package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.sessions.CreateSessionRequest;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InvalidSessionFoodException;
import com.yourorg.quickapp.sessions.SessionFoodRequest;
import com.yourorg.quickapp.sessions.SessionNotEditableException;
import com.yourorg.quickapp.sessions.SessionNotFoundException;
import com.yourorg.quickapp.sessions.SessionResponse;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.UpdateSessionRequest;
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
        when(foodCatalog.findVisible(householdId, foodA))
                .thenReturn(Optional.of(new CatalogFood(foodA, "Apples", "apple")));
        when(foodCatalog.findVisible(householdId, foodB))
                .thenReturn(Optional.of(new CatalogFood(foodB, "Bananas", "banana")));

        SessionResponse cancelled = service.cancel(householdId, session.getId());

        assertThat(cancelled.status()).isEqualTo(SessionStatus.cancelled);
    }

    private void stubSelectable(UUID foodId, String name, String iconKey) {
        when(foodCatalog.findSelectable(householdId, foodId))
                .thenReturn(Optional.of(new CatalogFood(foodId, name, iconKey)));
    }

    private void stubVisibleFoods(TastingSession... sessionList) {
        for (TastingSession session : sessionList) {
            session.replaceFoods(
                    List.of(
                            TastingSessionFood.of(foodA, Familiarity.likes, null, 1),
                            TastingSessionFood.of(foodB, Familiarity.truly_new, null, 2)),
                    now);
        }
        when(foodCatalog.findVisible(householdId, foodA))
                .thenReturn(Optional.of(new CatalogFood(foodA, "Apples", "apple")));
        when(foodCatalog.findVisible(householdId, foodB))
                .thenReturn(Optional.of(new CatalogFood(foodB, "Bananas", "banana")));
    }
}
