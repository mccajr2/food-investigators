package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.Texture;
import com.yourorg.quickapp.sessions.UnknownInsightTipException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InsightsServiceTest {

    @Mock
    private TastingSessionRepository sessions;

    @Mock
    private InsightTipDismissalRepository dismissals;

    @Mock
    private FoodCatalog foodCatalog;

    private InsightsService service;
    private final Instant now = Instant.parse("2026-07-15T12:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID foodA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
    private final UUID foodB = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05");

    @BeforeEach
    void setUp() {
        service =
                new InsightsService(
                        sessions, dismissals, foodCatalog, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void getReturnsNotReadyWithEmptyTipsBelowThreshold() {
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(List.of(completed(LocalDate.of(2026, 7, 10))));
        when(foodCatalog.listActiveSnackPreferences(householdId)).thenReturn(List.of());
        when(dismissals.findByHouseholdId(householdId)).thenReturn(List.of());

        InsightsResponse response = service.get(householdId);

        assertThat(response.ready()).isFalse();
        assertThat(response.completedSessionCount()).isEqualTo(1);
        assertThat(response.tips()).isEmpty();
    }

    @Test
    void getMergesSnacksAndExcludesDismissedTipsWhenReady() {
        when(sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed))
                .thenReturn(
                        List.of(
                                completed(LocalDate.of(2026, 7, 10)),
                                completed(LocalDate.of(2026, 7, 11)),
                                completed(LocalDate.of(2026, 7, 12))));
        when(foodCatalog.listActiveSnackPreferences(householdId))
                .thenReturn(
                        List.of(new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy)));
        when(dismissals.findByHouseholdId(householdId))
                .thenReturn(
                        List.of(
                                InsightTipDismissal.of(
                                        householdId,
                                        InsightsCalculator.TIP_LEAN_INTO_TEXTURE,
                                        now)));

        InsightsResponse response = service.get(householdId);

        assertThat(response.ready()).isTrue();
        assertThat(response.likedLike()).isGreaterThanOrEqualTo(4);
        assertThat(response.snackCount()).isEqualTo(1);
        assertThat(response.tips().stream().map(tip -> tip.id()))
                .doesNotContain(InsightsCalculator.TIP_LEAN_INTO_TEXTURE);
    }

    @Test
    void dismissPersistsUnknownRejectedAndIdempotent() {
        assertThatThrownBy(() -> service.dismissTip(householdId, "not_a_real_tip"))
                .isInstanceOf(UnknownInsightTipException.class);

        when(dismissals.existsByHouseholdIdAndTipId(
                        householdId, InsightsCalculator.TIP_KEEP_GOING))
                .thenReturn(false);
        when(dismissals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.dismissTip(householdId, InsightsCalculator.TIP_KEEP_GOING);

        ArgumentCaptor<InsightTipDismissal> captor =
                ArgumentCaptor.forClass(InsightTipDismissal.class);
        verify(dismissals).save(captor.capture());
        assertThat(captor.getValue().getTipId()).isEqualTo(InsightsCalculator.TIP_KEEP_GOING);
        assertThat(captor.getValue().getHouseholdId()).isEqualTo(householdId);

        when(dismissals.existsByHouseholdIdAndTipId(
                        householdId, InsightsCalculator.TIP_KEEP_GOING))
                .thenReturn(true);
        service.dismissTip(householdId, InsightsCalculator.TIP_KEEP_GOING);
        verify(dismissals, times(1)).save(any());
    }

    private TastingSession completed(LocalDate day) {
        TastingSession session = TastingSession.planned(householdId, day, now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.safe, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.safe, null, 2)),
                now);
        session.getFoods()
                .get(0)
                .recordOutcome(Liked.like, Texture.crunchy, null, null, null, null, true);
        session.getFoods()
                .get(1)
                .recordOutcome(Liked.like, Texture.crunchy, null, null, null, null, true);
        session.complete(now);
        return session;
    }
}
