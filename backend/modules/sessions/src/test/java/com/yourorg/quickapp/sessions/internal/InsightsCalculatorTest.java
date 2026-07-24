package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsightTip;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.Texture;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class InsightsCalculatorTest {

    private final Instant now = Instant.parse("2026-07-15T12:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID foodA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
    private final UUID foodB = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05");

    @Test
    void notReadyWhenFewerThanThreeCompletedSessionsEvenWithSnacks() {
        TastingSession one = completedNight(LocalDate.of(2026, 7, 10), Familiarity.safe, Liked.like, Texture.crunchy, true);
        List<SnackPreferenceSnapshot> snacks =
                List.of(
                        new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy),
                        new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy),
                        new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy));

        InsightsResponse response =
                InsightsCalculator.compute(List.of(one), snacks, Set.of());

        assertThat(response.ready()).isFalse();
        assertThat(response.completedSessionCount()).isEqualTo(1);
        assertThat(response.snackCount()).isEqualTo(3);
        // session food0 like + food1 so_so + 3 snack likes
        assertThat(response.likedLike()).isEqualTo(4);
        assertThat(response.tips()).isEmpty();
    }

    @Test
    void mergesSnackLikedIntoCountersAndReadyAfterThreeSessions() {
        List<TastingSession> nights =
                List.of(
                        completedNight(LocalDate.of(2026, 7, 10), Familiarity.safe, Liked.like, Texture.soft, true),
                        completedNight(LocalDate.of(2026, 7, 11), Familiarity.safe, Liked.so_so, null, true),
                        completedNight(LocalDate.of(2026, 7, 12), Familiarity.familiar_but_new, Liked.like, Texture.crunchy, true));
        List<SnackPreferenceSnapshot> snacks =
                List.of(new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy));

        InsightsResponse response = InsightsCalculator.compute(nights, snacks, Set.of());

        assertThat(response.ready()).isTrue();
        assertThat(response.completedSessionCount()).isEqualTo(3);
        assertThat(response.likedLike()).isEqualTo(3); // 2 session likes + 1 snack
        assertThat(response.likedSoSo()).isEqualTo(4); // night2 food0 + three food1 fillers
        assertThat(response.topLikedTextures()).containsExactly("crunchy", "soft");
        assertThat(response.snackCount()).isEqualTo(1);
        assertThat(response.tips()).isNotEmpty();
        assertThat(response.tips().size()).isLessThanOrEqualTo(3);
    }

    @Test
    void snacksAloneNeverMakeReady() {
        InsightsResponse response =
                InsightsCalculator.compute(
                        List.of(),
                        List.of(
                                new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy),
                                new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy),
                                new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy)),
                        Set.of());

        assertThat(response.ready()).isFalse();
        assertThat(response.tips()).isEmpty();
        assertThat(response.likedLike()).isEqualTo(3);
    }

    @Test
    void slowDownTrulyNewWhenHalfOrMoreTrulyNewAreNo() {
        List<TastingSession> nights =
                List.of(
                        completedWithFamiliarity(LocalDate.of(2026, 7, 10), Familiarity.truly_new, Liked.no, true),
                        completedWithFamiliarity(LocalDate.of(2026, 7, 11), Familiarity.truly_new, Liked.no, true),
                        completedWithFamiliarity(LocalDate.of(2026, 7, 12), Familiarity.safe, Liked.like, true));

        InsightsResponse response = InsightsCalculator.compute(nights, List.of(), Set.of());

        assertThat(response.tips().getFirst().id())
                .isEqualTo(InsightsCalculator.TIP_SLOW_DOWN_TRULY_NEW);
    }

    @Test
    void leanIntoTextureWhenMergedLikedTextureCountAtLeastTwo() {
        List<TastingSession> nights =
                List.of(
                        completedNight(LocalDate.of(2026, 7, 10), Familiarity.safe, Liked.like, Texture.crunchy, true),
                        completedNight(LocalDate.of(2026, 7, 11), Familiarity.safe, Liked.like, Texture.soft, true),
                        completedNight(LocalDate.of(2026, 7, 12), Familiarity.safe, Liked.so_so, null, true));
        List<SnackPreferenceSnapshot> snacks =
                List.of(new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy));

        InsightsResponse response = InsightsCalculator.compute(nights, snacks, Set.of());

        assertThat(response.tips().stream().map(InsightTip::id))
                .contains(InsightsCalculator.TIP_LEAN_INTO_TEXTURE);
        assertThat(
                        response.tips().stream()
                                .filter(tip -> tip.id().equals(InsightsCalculator.TIP_LEAN_INTO_TEXTURE))
                                .findFirst()
                                .orElseThrow()
                                .message())
                .contains("Crunchy");
    }

    @Test
    void omitsDismissedTipsAndFillsKeepGoing() {
        List<TastingSession> nights =
                List.of(
                        completedNight(LocalDate.of(2026, 7, 10), Familiarity.safe, Liked.like, Texture.crunchy, true),
                        completedNight(LocalDate.of(2026, 7, 11), Familiarity.safe, Liked.like, Texture.crunchy, true),
                        completedNight(LocalDate.of(2026, 7, 12), Familiarity.safe, Liked.like, Texture.crunchy, true));

        InsightsResponse response =
                InsightsCalculator.compute(
                        nights,
                        List.of(),
                        Set.of(InsightsCalculator.TIP_LEAN_INTO_TEXTURE));

        assertThat(response.tips().stream().map(InsightTip::id))
                .doesNotContain(InsightsCalculator.TIP_LEAN_INTO_TEXTURE)
                .contains(InsightsCalculator.TIP_KEEP_GOING)
                .hasSize(3);
    }

    @Test
    void countsSkippedLikedAndParentNotes() {
        TastingSession session = TastingSession.planned(householdId, LocalDate.of(2026, 7, 10), now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.safe, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.safe, null, 2)),
                now);
        session.getFoods().get(0).recordOutcome(null, null, null, null, null, null, true);
        session.getFoods().get(1).recordOutcome(Liked.like, null, null, null, null, null, false);
        session.complete(now);
        session.setParentNote("clinic was loud", now);

        InsightsResponse response =
                InsightsCalculator.compute(List.of(session), List.of(), Set.of());

        assertThat(response.likedSkipped()).isEqualTo(1);
        assertThat(response.likedLike()).isEqualTo(1);
        assertThat(response.hasParentNotes()).isTrue();
        assertThat(response.ateEnoughYes()).isEqualTo(1);
        assertThat(response.ateEnoughNo()).isEqualTo(1);
    }

    @Test
    void countsFamiliaritySafeAndMixTipUsesSafeFoodsCopy() {
        List<TastingSession> nights =
                List.of(
                        completedNight(LocalDate.of(2026, 7, 10), Familiarity.safe, Liked.like, Texture.crunchy, true),
                        completedNight(LocalDate.of(2026, 7, 11), Familiarity.safe, Liked.like, Texture.soft, true),
                        completedNight(LocalDate.of(2026, 7, 12), Familiarity.retrying, Liked.so_so, null, true));

        InsightsResponse response = InsightsCalculator.compute(nights, List.of(), Set.of());

        // food0 of nights 0–1 are safe; food1 of each night is always safe filler → 5 safe
        assertThat(response.familiaritySafe()).isEqualTo(5);
        assertThat(response.familiarityTrulyNew()).isEqualTo(0);
        assertThat(response.tips().stream().map(InsightTip::id))
                .contains(InsightsCalculator.TIP_MIX_FAMILIARITY);
        assertThat(
                        response.tips().stream()
                                .filter(tip -> tip.id().equals(InsightsCalculator.TIP_MIX_FAMILIARITY))
                                .findFirst()
                                .orElseThrow()
                                .message())
                .contains("safe foods");
    }

    private TastingSession completedNight(
            LocalDate day,
            Familiarity familiarity,
            Liked liked,
            Texture texture,
            boolean ateEnough) {
        return completedWithFamiliarity(day, familiarity, liked, texture, ateEnough);
    }

    private TastingSession completedWithFamiliarity(
            LocalDate day, Familiarity familiarity, Liked liked, boolean ateEnough) {
        return completedWithFamiliarity(day, familiarity, liked, null, ateEnough);
    }

    private TastingSession completedWithFamiliarity(
            LocalDate day,
            Familiarity familiarity,
            Liked liked,
            Texture texture,
            boolean ateEnough) {
        TastingSession session = TastingSession.planned(householdId, day, now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, familiarity, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.safe, null, 2)),
                now);
        session.getFoods()
                .get(0)
                .recordOutcome(liked, texture, null, null, null, null, ateEnough);
        session.getFoods()
                .get(1)
                .recordOutcome(Liked.so_so, null, null, null, null, null, ateEnough);
        session.complete(now);
        return session;
    }
}
