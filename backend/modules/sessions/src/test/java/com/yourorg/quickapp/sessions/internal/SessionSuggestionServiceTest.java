package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
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
        when(foodCatalog.listSelectable(householdId))
                .thenReturn(
                        List.of(
                                new CatalogFood(foodA, "Apples", "apple", null),
                                new CatalogFood(foodB, "Strawberries", "strawberry", null),
                                new CatalogFood(foodC, "Blueberries", "blueberry", null)));
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
        verify(llm, never()).propose(any());
    }

    @Test
    void readyHistoryUsesAiWhenLlmReturnsValidShortlistPicks() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(
                        List.of(
                                completedNight(LocalDate.of(2026, 7, 12), foodA),
                                completedNight(LocalDate.of(2026, 7, 13), foodB),
                                completedNight(LocalDate.of(2026, 7, 14), foodC)));
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
        verify(llm).propose(any());
    }

    @Test
    void invalidAiPickFallsBackToHeuristic() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(
                        List.of(
                                completedNight(LocalDate.of(2026, 7, 12), foodA),
                                completedNight(LocalDate.of(2026, 7, 13), foodB),
                                completedNight(LocalDate.of(2026, 7, 14), foodC)));
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
