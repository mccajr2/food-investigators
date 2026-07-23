package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.sessions.CompleteSessionRequest;
import com.yourorg.quickapp.sessions.CreateSessionRequest;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.FoodOutcomeRequest;
import com.yourorg.quickapp.sessions.InvalidHistoryPdfRequestException;
import com.yourorg.quickapp.sessions.InvalidSessionFoodException;
import com.yourorg.quickapp.sessions.InvalidSessionScheduleException;
import com.yourorg.quickapp.sessions.SessionDateOccupiedException;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.SessionFoodRequest;
import com.yourorg.quickapp.sessions.SessionNotEditableException;
import com.yourorg.quickapp.sessions.SessionNotFoundException;
import com.yourorg.quickapp.sessions.SessionResponse;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.Smell;
import com.yourorg.quickapp.sessions.Temperature;
import com.yourorg.quickapp.sessions.Texture;
import com.yourorg.quickapp.sessions.UpdateSessionRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private TastingSessionRepository sessions;

    @Mock
    private FoodCatalog foodCatalog;

    private SessionService service;
    private final Instant now = Instant.parse("2026-07-15T12:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID foodA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
    private final UUID foodB = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05");

    @BeforeEach
    void setUp() {
        service = new SessionService(sessions, foodCatalog, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void createPersistsPlannedSessionWithTwoFoods() {
        stubSelectable(foodA, "Apples", "apple");
        stubSelectable(foodB, "Bananas", "banana");
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SessionResponse created =
                service.create(
                        householdId,
                        new CreateSessionRequest(
                                LocalDate.of(2026, 7, 20),
                                List.of(
                                        new SessionFoodRequest(
                                                foodA, Familiarity.likes, "  Honeycrisp  "),
                                        new SessionFoodRequest(
                                                foodB, Familiarity.truly_new, null))));

        assertThat(created.status()).isEqualTo(SessionStatus.planned);
        assertThat(created.scheduledOn()).isEqualTo(LocalDate.of(2026, 7, 20));
        assertThat(created.foods()).hasSize(2);
        assertThat(created.foods().get(0).variantNote()).isEqualTo("Honeycrisp");
        assertThat(created.foods().get(0).name()).isEqualTo("Apples");
        assertThat(created.foods().get(1).familiarity()).isEqualTo(Familiarity.truly_new);

        ArgumentCaptor<TastingSession> captor = ArgumentCaptor.forClass(TastingSession.class);
        verify(sessions).save(captor.capture());
        assertThat(captor.getValue().getHouseholdId()).isEqualTo(householdId);
        assertThat(captor.getValue().getFoods()).hasSize(2);
    }

    @Test
    void createRejectsUnknownOrArchivedFood() {
        when(foodCatalog.findSelectable(householdId, foodA)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateSessionRequest(
                                                LocalDate.of(2026, 7, 20),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null),
                                                        new SessionFoodRequest(
                                                                foodB,
                                                                Familiarity.familiar_but_new,
                                                                null)))))
                .isInstanceOf(InvalidSessionFoodException.class);
    }

    @Test
    void createRejectsPastScheduledOn() {
        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateSessionRequest(
                                                LocalDate.of(2026, 7, 14),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null),
                                                        new SessionFoodRequest(
                                                                foodB, Familiarity.likes, null)))))
                .isInstanceOf(InvalidSessionScheduleException.class)
                .hasMessageContaining("past");
    }

    @Test
    void createAllowsToday() {
        stubSelectable(foodA, "Apples", "apple");
        stubSelectable(foodB, "Bananas", "banana");
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SessionResponse created =
                service.create(
                        householdId,
                        new CreateSessionRequest(
                                LocalDate.of(2026, 7, 15),
                                List.of(
                                        new SessionFoodRequest(foodA, Familiarity.likes, null),
                                        new SessionFoodRequest(foodB, Familiarity.likes, null))));

        assertThat(created.scheduledOn()).isEqualTo(LocalDate.of(2026, 7, 15));
    }

    @Test
    void createRejectsWhenPlannedOrCompletedOccupiesDay() {
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(
                        org.mockito.ArgumentMatchers.eq(householdId),
                        org.mockito.ArgumentMatchers.eq(LocalDate.of(2026, 7, 20)),
                        any()))
                .thenReturn(true);

        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateSessionRequest(
                                                LocalDate.of(2026, 7, 20),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null),
                                                        new SessionFoodRequest(
                                                                foodB, Familiarity.likes, null)))))
                .isInstanceOf(SessionDateOccupiedException.class);
    }

    @Test
    void createAllowsDayWithOnlyCancelledSession() {
        stubSelectable(foodA, "Apples", "apple");
        stubSelectable(foodB, "Bananas", "banana");
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(any(), any(), any()))
                .thenReturn(false);
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SessionResponse created =
                service.create(
                        householdId,
                        new CreateSessionRequest(
                                LocalDate.of(2026, 7, 20),
                                List.of(
                                        new SessionFoodRequest(foodA, Familiarity.likes, null),
                                        new SessionFoodRequest(foodB, Familiarity.likes, null))));

        assertThat(created.status()).isEqualTo(SessionStatus.planned);
    }

    @Test
    void createAllowsSameFoodWithDistinctVariants() {
        stubSelectable(foodA, "Bagel", "bagel");
        stubVisible(foodA, "Bagel", "bagel");
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SessionResponse created =
                service.create(
                        householdId,
                        new CreateSessionRequest(
                                LocalDate.of(2026, 7, 20),
                                List.of(
                                        new SessionFoodRequest(
                                                foodA, Familiarity.likes, "Bagelsaurus"),
                                        new SessionFoodRequest(
                                                foodA, Familiarity.familiar_but_new, "Iggy's"))));

        assertThat(created.foods().get(0).foodId()).isEqualTo(foodA);
        assertThat(created.foods().get(1).foodId()).isEqualTo(foodA);
        assertThat(created.foods().get(0).variantNote()).isEqualTo("Bagelsaurus");
        assertThat(created.foods().get(1).variantNote()).isEqualTo("Iggy's");
    }

    @Test
    void createRejectsSameFoodWithoutDistinctVariants() {
        stubSelectable(foodA, "Bagel", "bagel");

        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateSessionRequest(
                                                LocalDate.of(2026, 7, 20),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null),
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, "Iggy's")))))
                .isInstanceOf(InvalidSessionFoodException.class)
                .hasMessageContaining("brand/variety");

        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateSessionRequest(
                                                LocalDate.of(2026, 7, 20),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, "Iggy's"),
                                                        new SessionFoodRequest(
                                                                foodA,
                                                                Familiarity.likes,
                                                                "  iggy's  ")))))
                .isInstanceOf(InvalidSessionFoodException.class);
    }

    @Test
    void updateRejectsPastScheduledOn() {
        TastingSession session = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), now);
        when(sessions.findByIdAndHouseholdId(session.getId(), householdId))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(
                        () ->
                                service.update(
                                        householdId,
                                        session.getId(),
                                        new UpdateSessionRequest(
                                                LocalDate.of(2026, 7, 10),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null),
                                                        new SessionFoodRequest(
                                                                foodB, Familiarity.likes, null)))))
                .isInstanceOf(InvalidSessionScheduleException.class);
    }

    @Test
    void updateRejectsMovingOntoOccupiedDay() {
        TastingSession session = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), now);
        when(sessions.findByIdAndHouseholdId(session.getId(), householdId))
                .thenReturn(Optional.of(session));
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusInAndIdNot(
                        org.mockito.ArgumentMatchers.eq(householdId),
                        org.mockito.ArgumentMatchers.eq(LocalDate.of(2026, 7, 21)),
                        any(),
                        org.mockito.ArgumentMatchers.eq(session.getId())))
                .thenReturn(true);

        assertThatThrownBy(
                        () ->
                                service.update(
                                        householdId,
                                        session.getId(),
                                        new UpdateSessionRequest(
                                                LocalDate.of(2026, 7, 21),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null),
                                                        new SessionFoodRequest(
                                                                foodB, Familiarity.likes, null)))))
                .isInstanceOf(SessionDateOccupiedException.class);
    }

    @Test
    void updateAllowsKeepingSameDay() {
        TastingSession session = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.likes, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.truly_new, null, 2)),
                now);
        when(sessions.findByIdAndHouseholdId(session.getId(), householdId))
                .thenReturn(Optional.of(session));
        when(sessions.existsByHouseholdIdAndScheduledOnAndStatusInAndIdNot(
                        any(), any(), any(), any()))
                .thenReturn(false);
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        stubSelectable(foodA, "Apples", "apple");
        stubSelectable(foodB, "Bananas", "banana");
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");

        SessionResponse updated =
                service.update(
                        householdId,
                        session.getId(),
                        new UpdateSessionRequest(
                                LocalDate.of(2026, 7, 20),
                                List.of(
                                        new SessionFoodRequest(foodA, Familiarity.likes, null),
                                        new SessionFoodRequest(
                                                foodB, Familiarity.familiar_but_new, null))));

        assertThat(updated.scheduledOn()).isEqualTo(LocalDate.of(2026, 7, 20));
        assertThat(updated.foods().get(1).familiarity()).isEqualTo(Familiarity.familiar_but_new);
    }

    @Test
    void createRejectsWrongFoodCount() {
        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateSessionRequest(
                                                LocalDate.of(2026, 7, 20),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null)))))
                .isInstanceOf(InvalidSessionFoodException.class);
    }

    @Test
    void listUpcomingReturnsOnlyPlannedOrderedByDate() {
        TastingSession later = TastingSession.planned(householdId, LocalDate.of(2026, 8, 1), now);
        TastingSession earlier = TastingSession.planned(householdId, LocalDate.of(2026, 7, 18), now);
        stubVisibleFoods(earlier, later);
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnAscCreatedAtAsc(
                        householdId, SessionStatus.planned))
                .thenReturn(List.of(earlier, later));

        List<SessionResponse> listed = service.listUpcoming(householdId);

        assertThat(listed).extracting(SessionResponse::scheduledOn)
                .containsExactly(LocalDate.of(2026, 7, 18), LocalDate.of(2026, 8, 1));
    }

    @Test
    void updateAndCancelRejectCancelledSessions() {
        TastingSession session = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), now);
        session.cancel(now);
        when(sessions.findByIdAndHouseholdId(session.getId(), householdId))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(
                        () ->
                                service.update(
                                        householdId,
                                        session.getId(),
                                        new UpdateSessionRequest(
                                                LocalDate.of(2026, 7, 21),
                                                List.of(
                                                        new SessionFoodRequest(
                                                                foodA, Familiarity.likes, null),
                                                        new SessionFoodRequest(
                                                                foodB, Familiarity.likes, null)))))
                .isInstanceOf(SessionNotEditableException.class);
        assertThatThrownBy(() -> service.cancel(householdId, session.getId()))
                .isInstanceOf(SessionNotEditableException.class);
    }

    @Test
    void getRejectsOtherHousehold() {
        when(sessions.findByIdAndHouseholdId(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(householdId, UUID.randomUUID()))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void cancelMarksSessionCancelled() {
        TastingSession session = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.likes, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.truly_new, null, 2)),
                now);
        when(sessions.findByIdAndHouseholdId(session.getId(), householdId))
                .thenReturn(Optional.of(session));
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");

        SessionResponse cancelled = service.cancel(householdId, session.getId());

        assertThat(cancelled.status()).isEqualTo(SessionStatus.cancelled);
    }

    @Test
    void completeRecordsOutcomesAndMarksCompleted() {
        TastingSession session = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.likes, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.truly_new, null, 2)),
                now);
        when(sessions.findByIdAndHouseholdId(session.getId(), householdId))
                .thenReturn(Optional.of(session));
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");

        SessionResponse completed =
                service.complete(
                        householdId,
                        session.getId(),
                        new CompleteSessionRequest(
                                List.of(
                                        new FoodOutcomeRequest(
                                                1,
                                                Liked.like,
                                                Texture.crunchy,
                                                Temperature.cold,
                                                Smell.like,
                                                "  crunchy  ",
                                                "less peel",
                                                true),
                                        new FoodOutcomeRequest(
                                                2,
                                                Liked.so_so,
                                                null,
                                                Temperature.warm,
                                                null,
                                                null,
                                                null,
                                                false))));

        assertThat(completed.status()).isEqualTo(SessionStatus.completed);
        assertThat(completed.foods().get(0).liked()).isEqualTo(Liked.like);
        assertThat(completed.foods().get(0).texture()).isEqualTo(Texture.crunchy);
        assertThat(completed.foods().get(0).whyNote()).isEqualTo("crunchy");
        assertThat(completed.foods().get(0).changeNote()).isEqualTo("less peel");
        assertThat(completed.foods().get(0).ateEnough()).isTrue();
        assertThat(completed.foods().get(1).liked()).isEqualTo(Liked.so_so);
        assertThat(completed.foods().get(1).ateEnough()).isFalse();
    }

    @Test
    void listHistoryReturnsCompletedNewestFirstWithOutcomes() {
        Instant earlier = Instant.parse("2026-07-10T12:00:00Z");
        Instant later = Instant.parse("2026-07-15T12:00:00Z");
        TastingSession older = TastingSession.planned(householdId, LocalDate.of(2026, 7, 10), earlier);
        older.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.likes, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.truly_new, null, 2)),
                earlier);
        older.getFoods().get(0).recordOutcome(Liked.like, null, null, null, "yay", null, true);
        older.getFoods().get(1).recordOutcome(Liked.no, null, null, null, null, null, false);
        older.complete(earlier);

        TastingSession newer = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), later);
        newer.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.likes, "Honeycrisp", 1),
                        TastingSessionFood.of(foodB, Familiarity.familiar_but_new, null, 2)),
                later);
        newer.getFoods().get(0).recordOutcome(Liked.so_so, Texture.soft, null, null, null, null, true);
        newer.getFoods().get(1).recordOutcome(null, null, null, null, null, null, true);
        newer.complete(later);

        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(List.of(newer, older));
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");

        List<SessionResponse> history = service.listHistory(householdId);

        assertThat(history).hasSize(2);
        assertThat(history.get(0).scheduledOn()).isEqualTo(LocalDate.of(2026, 7, 20));
        assertThat(history.get(0).status()).isEqualTo(SessionStatus.completed);
        assertThat(history.get(0).foods().get(0).liked()).isEqualTo(Liked.so_so);
        assertThat(history.get(0).foods().get(0).variantNote()).isEqualTo("Honeycrisp");
        assertThat(history.get(1).scheduledOn()).isEqualTo(LocalDate.of(2026, 7, 10));
        assertThat(history.get(1).foods().get(0).whyNote()).isEqualTo("yay");
        assertThat(history.get(1).foods().get(1).ateEnough()).isFalse();
    }

    @Test
    void exportHistoryPdfIncludesCompletedSessionsAndFiltersByScheduledOn() throws Exception {
        Instant earlier = Instant.parse("2026-07-10T12:00:00Z");
        Instant later = Instant.parse("2026-07-15T12:00:00Z");
        TastingSession older = TastingSession.planned(householdId, LocalDate.of(2026, 7, 10), earlier);
        older.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.likes, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.truly_new, null, 2)),
                earlier);
        older.getFoods().get(0).recordOutcome(Liked.like, Texture.crunchy, null, null, "yay", null, true);
        older.getFoods().get(1).recordOutcome(Liked.no, null, null, null, null, null, false);
        older.complete(earlier);

        TastingSession newer = TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), later);
        newer.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.likes, "Honeycrisp", 1),
                        TastingSessionFood.of(foodB, Familiarity.familiar_but_new, null, 2)),
                later);
        newer.getFoods().get(0).recordOutcome(Liked.so_so, null, null, null, null, null, true);
        newer.getFoods().get(1).recordOutcome(null, null, null, null, null, null, true);
        newer.complete(later);

        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(List.of(newer, older));
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");

        byte[] fullPdf = service.exportHistoryPdf(householdId, null, null);
        String fullText = pdfText(fullPdf);
        assertThat(fullText).contains("Food Investigators - tasting history");
        assertThat(fullText).contains("Generated: 2026-07-15");
        assertThat(fullText).contains("Range: All completed sessions");
        assertThat(fullText).contains("Session: 2026-07-20");
        assertThat(fullText).contains("Session: 2026-07-10");
        assertThat(fullText).contains("Honeycrisp");
        assertThat(fullText).contains("yay");
        assertThat(fullText).doesNotContain("bbbbbbbb");

        byte[] filteredPdf =
                service.exportHistoryPdf(
                        householdId, LocalDate.of(2026, 7, 15), LocalDate.of(2026, 7, 31));
        String filteredText = pdfText(filteredPdf);
        assertThat(filteredText).contains("2026-07-15 to 2026-07-31");
        assertThat(filteredText).contains("Session: 2026-07-20");
        assertThat(filteredText).doesNotContain("Session: 2026-07-10");

        byte[] emptyPdf =
                service.exportHistoryPdf(
                        householdId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
        assertThat(pdfText(emptyPdf)).contains("No completed tasting sessions in this range.");
    }

    @Test
    void exportHistoryPdfRejectsFromAfterTo() {
        assertThatThrownBy(
                        () ->
                                service.exportHistoryPdf(
                                        householdId,
                                        LocalDate.of(2026, 7, 20),
                                        LocalDate.of(2026, 7, 10)))
                .isInstanceOf(InvalidHistoryPdfRequestException.class)
                .hasMessageContaining("'from' must be on or before 'to'");
    }

    @Test
    void completeRejectsCancelledOrCompletedSessions() {
        TastingSession cancelled =
                TastingSession.planned(householdId, LocalDate.of(2026, 7, 20), now);
        cancelled.cancel(now);
        when(sessions.findByIdAndHouseholdId(cancelled.getId(), householdId))
                .thenReturn(Optional.of(cancelled));

        assertThatThrownBy(
                        () ->
                                service.complete(
                                        householdId,
                                        cancelled.getId(),
                                        new CompleteSessionRequest(
                                                List.of(
                                                        new FoodOutcomeRequest(
                                                                1, null, null, null, null, null,
                                                                null, true),
                                                        new FoodOutcomeRequest(
                                                                2, null, null, null, null, null,
                                                                null, true)))))
                .isInstanceOf(SessionNotEditableException.class);
    }

    private void stubSelectable(UUID foodId, String name, String iconKey) {
        when(foodCatalog.findSelectable(householdId, foodId))
                .thenReturn(Optional.of(new CatalogFood(foodId, name, iconKey)));
    }

    private void stubVisible(UUID foodId, String name, String iconKey) {
        when(foodCatalog.findVisible(householdId, foodId))
                .thenReturn(Optional.of(new CatalogFood(foodId, name, iconKey)));
    }

    private static String pdfText(byte[] pdf) throws Exception {
        try (PDDocument document = Loader.loadPDF(pdf)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private void stubVisibleFoods(TastingSession... sessionList) {
        for (TastingSession session : sessionList) {
            session.replaceFoods(
                    List.of(
                            TastingSessionFood.of(foodA, Familiarity.likes, null, 1),
                            TastingSessionFood.of(foodB, Familiarity.truly_new, null, 2)),
                    now);
        }
        stubVisible(foodA, "Apples", "apple");
        stubVisible(foodB, "Bananas", "banana");
    }
}
