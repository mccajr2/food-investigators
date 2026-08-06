package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.ExposureSnapshot;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.foods.StretchTargetSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsufficientSuggestionCatalogException;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.SessionSuggestionResponse;
import com.yourorg.quickapp.sessions.SuggestionSource;
import com.yourorg.quickapp.sessions.Texture;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SessionSuggestionServiceTest {

    private final Instant now = Instant.parse("2026-07-15T12:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID foodA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
    private final UUID foodB = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05");
    private final UUID foodC = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13");

    @Mock
    private TastingSessionRepository sessions;

    @Mock
    private FoodCatalog foodCatalog;

    @Mock
    private SuggestionLlmPort llm;

    private SessionSuggestionService service;

    @BeforeEach
    void setUp() {
        service =
                new SessionSuggestionService(
                        sessions,
                        foodCatalog,
                        llm,
                        Clock.fixed(now, ZoneOffset.UTC));
        when(foodCatalog.listActiveSnackPreferences(householdId)).thenReturn(List.of());
        when(foodCatalog.listExposures(householdId)).thenReturn(List.of());
        when(foodCatalog.listSafeExposures(householdId)).thenReturn(List.of());
        when(foodCatalog.listStretchTargets(householdId)).thenReturn(List.of());
        when(foodCatalog.listSelectable(householdId))
                .thenReturn(
                        List.of(
                                new CatalogFood(foodA, "Apples", "apple", null),
                                new CatalogFood(foodB, "Strawberries", "strawberry", null),
                                new CatalogFood(foodC, "Blueberries", "blueberry", null)));
    }

    private void stubReadyHistory() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(
                        List.of(
                                completedNight(LocalDate.of(2026, 7, 12), foodA),
                                completedNight(LocalDate.of(2026, 7, 13), foodB),
                                completedNight(LocalDate.of(2026, 7, 14), foodC)));
    }

    @Test
    void coldStartUsesHeuristicWithoutCallingLlm() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(List.of(completedNight(LocalDate.of(2026, 7, 14), foodA)));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods()).hasSize(2);
        assertThat(response.scheduledOn()).isEqualTo(LocalDate.of(2026, 7, 15));
        assertThat(response.pacingNote())
                .isEqualTo(PacingEvidencePack.forHint("steady").pacingNote());
        assertThat(response.citations())
                .isEqualTo(PacingEvidencePack.forHint("steady").citations());
        verify(llm, never()).propose(any());
    }

    @Test
    void aiOverridesMislabelledSafeExposureFamiliarity() {
        stubReadyHistory();
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(
                                        foodB, "Strawberries", "", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(List.of(new SafeExposureSnapshot(foodB, "Strawberries", "")));
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(foodB, Familiarity.familiar_but_new),
                                                new LlmFoodPick(foodC, Familiarity.truly_new)),
                                        "Mislabelled")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.ai);
        assertThat(response.foods().get(0).foodId()).isEqualTo(foodB);
        assertThat(response.foods().get(0).familiarity()).isEqualTo(Familiarity.safe);
        assertThat(response.foods().get(0).variantNote()).isNull();
        assertThat(response.foods().get(1).familiarity()).isEqualTo(Familiarity.truly_new);
    }

    @Test
    void heuristicLabelsSafeExposureAsSafeNotFamiliarButNew() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(List.of());
        when(foodCatalog.listSelectable(householdId))
                .thenReturn(
                        List.of(
                                new CatalogFood(foodA, "Apples", "apple", null),
                                new CatalogFood(foodB, "Strawberries", "strawberry", null)));
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(
                                        foodA, "Apples", "", FoodFamiliarity.safe),
                                new ExposureSnapshot(
                                        foodB, "Strawberries", "fresh", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(
                        List.of(
                                new SafeExposureSnapshot(foodA, "Apples", ""),
                                new SafeExposureSnapshot(foodB, "Strawberries", "fresh")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods()).hasSize(2);
        assertThat(response.foods())
                .allSatisfy(food -> assertThat(food.familiarity()).isEqualTo(Familiarity.safe));
        assertThat(
                        response.foods().stream()
                                .filter(food -> foodB.equals(food.foodId()))
                                .findFirst()
                                .orElseThrow()
                                .variantNote())
                .isEqualTo("fresh");
    }

    @Test
    void readyHistoryUsesAiWhenLlmReturnsValidShortlistPicks() {
        stubReadyHistory();
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(foodB, Familiarity.safe),
                                                new LlmFoodPick(foodC, Familiarity.familiar_but_new)),
                                        "Gentle salty stretch")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.ai);
        assertThat(response.rationale()).isEqualTo("Gentle salty stretch");
        assertThat(response.foods().get(0).foodId()).isEqualTo(foodB);
        assertThat(response.foods().get(1).familiarity()).isEqualTo(Familiarity.familiar_but_new);
        // Ready + no truly_new history → gentle_stretch pack (not stuffed into rationale).
        assertThat(response.pacingNote())
                .isEqualTo(PacingEvidencePack.forHint("gentle_stretch").pacingNote());
        assertThat(response.citations())
                .isEqualTo(PacingEvidencePack.forHint("gentle_stretch").citations());
        assertThat(response.rationale()).doesNotContain(response.citations().getFirst().title());
        verify(llm).propose(any());
    }

    @Test
    void aiInventWithSafeAnchorIsAccepted() {
        stubReadyHistory();
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(
                                        foodB, "Strawberries", "", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(List.of(new SafeExposureSnapshot(foodB, "Strawberries", "")));
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(foodB, Familiarity.safe),
                                                LlmFoodPick.invent(
                                                        "Pickles", "spears", Familiarity.truly_new)),
                                        "Salty stretch")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.ai);
        assertThat(response.foods().get(0).foodId()).isEqualTo(foodB);
        assertThat(response.foods().get(0).familiarity()).isEqualTo(Familiarity.safe);
        assertThat(response.foods().get(1).foodId()).isNull();
        assertThat(response.foods().get(1).proposedName()).isEqualTo("Pickles");
        assertThat(response.foods().get(1).proposedVariantNote()).isEqualTo("spears");
        assertThat(response.foods().get(1).variantNote()).isNull();
        assertThat(response.foods().get(1).foodId()).isNull();
    }

    @Test
    void inventNameMatchingCandidateBecomesCatalogPick() {
        stubReadyHistory();
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(
                                        foodB, "Strawberries", "", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(List.of(new SafeExposureSnapshot(foodB, "Strawberries", "")));
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(foodB, Familiarity.safe),
                                                LlmFoodPick.invent(
                                                        "Blueberries", null, Familiarity.familiar_but_new)),
                                        "Match catalog")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.ai);
        assertThat(response.foods().get(1).foodId()).isEqualTo(foodC);
        assertThat(response.foods().get(1).proposedName()).isNull();
    }

    @Test
    void twoInventsFallsBackToHeuristic() {
        stubReadyHistory();
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(
                                        foodB, "Strawberries", "", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(List.of(new SafeExposureSnapshot(foodB, "Strawberries", "")));
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                LlmFoodPick.invent("Pickles", null, Familiarity.truly_new),
                                                LlmFoodPick.invent("Olives", null, Familiarity.truly_new)),
                                        "too stretchy")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods()).noneMatch(f -> f.foodId() == null);
    }

    @Test
    void inventWithoutSafeExposuresFallsBackToHeuristic() {
        stubReadyHistory();
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(foodB, Familiarity.safe),
                                                LlmFoodPick.invent(
                                                        "Pickles", null, Familiarity.truly_new)),
                                        "invent")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods()).noneMatch(f -> f.foodId() == null);
    }

    @Test
    void inventOnHeuristicPathIsRejected() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(List.of(completedNight(LocalDate.of(2026, 7, 14), foodA)));
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(foodA, "Apples", "", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(List.of(new SafeExposureSnapshot(foodA, "Apples", "")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods()).noneMatch(f -> f.foodId() == null);
        verify(llm, never()).propose(any());
    }

    @Test
    void invalidAiPickFallsBackToHeuristic() {
        stubReadyHistory();
        UUID offList = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(offList, Familiarity.safe),
                                                new LlmFoodPick(foodA, Familiarity.safe)),
                                        "bad")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods()).hasSize(2);
    }

    @Test
    void heuristicPrefersReadyStretchDestinationWithSafeAnchor() {
        stubReadyHistory();
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(foodA, "Apples", "", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(List.of(new SafeExposureSnapshot(foodA, "Apples", "")));
        when(foodCatalog.listStretchTargets(householdId))
                .thenReturn(List.of(new StretchTargetSnapshot(foodC, "Blueberries", "")));
        when(llm.propose(any())).thenReturn(Optional.empty());

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods())
                .extracting(f -> f.foodId())
                .containsExactlyInAnyOrder(foodA, foodC);
        assertThat(response.rationale()).containsIgnoringCase("Blueberries");
        assertThat(
                        response.foods().stream()
                                .filter(f -> foodA.equals(f.foodId()))
                                .findFirst()
                                .orElseThrow()
                                .familiarity())
                .isEqualTo(Familiarity.safe);
    }

    @Test
    void aiDestinationWhileOnCooldownFallsBackToHeuristic() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        TastingSession rejected =
                TastingSession.planned(householdId, LocalDate.of(2026, 7, 14), now);
        rejected.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodC, Familiarity.truly_new, null, 1),
                        TastingSessionFood.of(foodA, Familiarity.safe, null, 2)),
                now);
        rejected.getFoods()
                .get(0)
                .recordOutcome(Liked.no, null, null, null, null, null, null, false);
        rejected.getFoods()
                .get(1)
                .recordOutcome(Liked.like, Texture.soft, null, null, null, null, null, true);
        rejected.complete(now);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(
                        List.of(
                                rejected,
                                completedNight(LocalDate.of(2026, 7, 13), foodB),
                                completedNight(LocalDate.of(2026, 7, 12), foodA)));
        when(foodCatalog.listExposures(householdId))
                .thenReturn(
                        List.of(
                                new ExposureSnapshot(foodA, "Apples", "", FoodFamiliarity.safe)));
        when(foodCatalog.listSafeExposures(householdId))
                .thenReturn(List.of(new SafeExposureSnapshot(foodA, "Apples", "")));
        when(foodCatalog.listStretchTargets(householdId))
                .thenReturn(List.of(new StretchTargetSnapshot(foodC, "Blueberries", "")));
        when(llm.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(foodA, Familiarity.safe),
                                                new LlmFoodPick(foodC, Familiarity.truly_new)),
                                        "too soon")));

        SessionSuggestionResponse response = service.suggestNext(householdId);

        assertThat(response.source()).isEqualTo(SuggestionSource.heuristic);
        assertThat(response.foods()).noneMatch(f -> foodC.equals(f.foodId()));
    }

    @Test
    void throwsWhenFewerThanTwoSelectableFoods() {
        when(foodCatalog.listSelectable(householdId))
                .thenReturn(List.of(new CatalogFood(foodA, "Apples", "apple", null)));
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        eq(householdId), eq(SessionStatus.completed)))
                .thenReturn(List.of());

        assertThatThrownBy(() -> service.suggestNext(householdId))
                .isInstanceOf(InsufficientSuggestionCatalogException.class);
    }

    private TastingSession completedNight(LocalDate day, UUID primaryFood) {
        TastingSession session = TastingSession.planned(householdId, day, now);
        UUID other =
                primaryFood.equals(foodA)
                        ? foodB
                        : foodA;
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(primaryFood, Familiarity.safe, null, 1),
                        TastingSessionFood.of(other, Familiarity.safe, null, 2)),
                now);
        session.getFoods()
                .get(0)
                .recordOutcome(Liked.like, Texture.soft, null, null, null, null, null, true);
        session.getFoods()
                .get(1)
                .recordOutcome(Liked.so_so, null, null, null, null, null, null, true);
        session.complete(now);
        return session;
    }
}
