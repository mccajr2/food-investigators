package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsightTip;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.TasteBasic;
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
        assertThat(response.topLikedTastes()).isEmpty();
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
    void countsSessionLikedTastesMultiSelectAndIgnoresSnacksForTastes() {
        List<TastingSession> nights =
                List.of(
                        completedNightWithTastes(
                                LocalDate.of(2026, 7, 10),
                                Liked.like,
                                List.of(TasteBasic.salty, TasteBasic.sweet)),
                        completedNightWithTastes(
                                LocalDate.of(2026, 7, 11), Liked.like, List.of(TasteBasic.salty)),
                        completedNightWithTastes(
                                LocalDate.of(2026, 7, 12), Liked.so_so, List.of(TasteBasic.bitter)));
        List<SnackPreferenceSnapshot> snacks =
                List.of(new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy));

        InsightsResponse response = InsightsCalculator.compute(nights, snacks, Set.of());

        // salty x2 (night1 + night2), sweet x1; bitter skipped (liked so_so); snacks ignored
        assertThat(response.topLikedTastes()).containsExactly("salty", "sweet");
        assertThat(response.tips().stream().map(InsightTip::id))
                .contains(InsightsCalculator.TIP_LEAN_INTO_TASTE);
        assertThat(
                        response.tips().stream()
                                .filter(tip -> tip.id().equals(InsightsCalculator.TIP_LEAN_INTO_TASTE))
                                .findFirst()
                                .orElseThrow()
                                .message())
                .contains("Salty");
    }

    @Test
    void leanIntoTasteComesAfterTextureInTipOrderWhenBothEligible() {
        List<TastingSession> nights =
                List.of(
                        completedNightWithTextureAndTastes(
                                LocalDate.of(2026, 7, 10),
                                Texture.crunchy,
                                List.of(TasteBasic.salty)),
                        completedNightWithTextureAndTastes(
                                LocalDate.of(2026, 7, 11),
                                Texture.crunchy,
                                List.of(TasteBasic.salty)),
                        completedNightWithTextureAndTastes(
                                LocalDate.of(2026, 7, 12), Texture.soft, List.of()));

        InsightsResponse response = InsightsCalculator.compute(nights, List.of(), Set.of());

        List<String> tipIds = response.tips().stream().map(InsightTip::id).toList();
        assertThat(tipIds).contains(InsightsCalculator.TIP_LEAN_INTO_TEXTURE);
        assertThat(tipIds).contains(InsightsCalculator.TIP_LEAN_INTO_TASTE);
        assertThat(tipIds.indexOf(InsightsCalculator.TIP_LEAN_INTO_TEXTURE))
                .isLessThan(tipIds.indexOf(InsightsCalculator.TIP_LEAN_INTO_TASTE));
    }

    @Test
    void omitsDismissedLeanIntoTaste() {
        List<TastingSession> nights =
                List.of(
                        completedNightWithTastes(
                                LocalDate.of(2026, 7, 10), Liked.like, List.of(TasteBasic.sour)),
                        completedNightWithTastes(
                                LocalDate.of(2026, 7, 11), Liked.like, List.of(TasteBasic.sour)),
                        completedNightWithTastes(
                                LocalDate.of(2026, 7, 12), Liked.like, List.of(TasteBasic.sour)));

        InsightsResponse response =
                InsightsCalculator.compute(
                        nights,
                        List.of(),
                        Set.of(InsightsCalculator.TIP_LEAN_INTO_TASTE));

        assertThat(response.tips().stream().map(InsightTip::id))
                .doesNotContain(InsightsCalculator.TIP_LEAN_INTO_TASTE);
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
        session.getFoods().get(0).recordOutcome(null, null, null, null, null, null, null, true);
        session.getFoods().get(1).recordOutcome(Liked.like, null, null, null, null, null, null, false);
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

    @Test
    void recentWhyNotesEmptyWhenNotReady() {
        TastingSession one = completedNightWithWhy(LocalDate.of(2026, 7, 10), Liked.like, "tasty");

        InsightsResponse response =
                InsightsCalculator.compute(
                        List.of(one), List.of(), Set.of(), id -> "Apples");

        assertThat(response.ready()).isFalse();
        assertThat(response.recentWhyNotes()).isEmpty();
    }

    @Test
    void recentWhyNotesNewestFirstCappedAtFive() {
        List<TastingSession> nights =
                List.of(
                        completedNightWithWhy(LocalDate.of(2026, 7, 10), Liked.like, "why-10"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 11), Liked.like, "why-11"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 12), Liked.like, "why-12"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 13), Liked.no, "why-13"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 14), Liked.like, "why-14"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 15), Liked.like, "why-15"));

        InsightsResponse response =
                InsightsCalculator.compute(
                        nights, List.of(), Set.of(), id -> id.equals(foodA) ? "Apples" : "Berries");

        assertThat(response.ready()).isTrue();
        assertThat(response.recentWhyNotes()).hasSize(5);
        assertThat(response.recentWhyNotes().getFirst().whyNote()).isEqualTo("why-15");
        assertThat(response.recentWhyNotes().getFirst().foodName()).isEqualTo("Apples");
        assertThat(response.recentWhyNotes().get(4).whyNote()).isEqualTo("why-11");
    }

    @Test
    void leanIntoWhyLikeWhenChipAppearsInAtLeastTwoLikeNotes() {
        List<TastingSession> nights =
                List.of(
                        completedNightWithWhy(LocalDate.of(2026, 7, 10), Liked.like, "tasty, crunchy"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 11), Liked.like, "crunchy — peel"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 12), Liked.so_so, "not sure"));

        InsightsResponse response =
                InsightsCalculator.compute(nights, List.of(), Set.of(), id -> "Apples");

        assertThat(response.tips().stream().map(InsightTip::id))
                .contains(InsightsCalculator.TIP_LEAN_INTO_WHY_LIKE);
        assertThat(
                        response.tips().stream()
                                .filter(tip -> tip.id().equals(InsightsCalculator.TIP_LEAN_INTO_WHY_LIKE))
                                .findFirst()
                                .orElseThrow()
                                .message())
                .contains("crunchy");
    }

    @Test
    void noticeWhyDislikeWhenChipAppearsInAtLeastTwoNoNotes() {
        List<TastingSession> nights =
                List.of(
                        completedNightWithWhy(LocalDate.of(2026, 7, 10), Liked.no, "yucky smell"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 11), Liked.no, "yucky smell — strong"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 12), Liked.like, "tasty"));

        InsightsResponse response =
                InsightsCalculator.compute(nights, List.of(), Set.of(), id -> "Apples");

        assertThat(response.tips().stream().map(InsightTip::id))
                .contains(InsightsCalculator.TIP_NOTICE_WHY_DISLIKE);
        assertThat(
                        response.tips().stream()
                                .filter(tip -> tip.id().equals(InsightsCalculator.TIP_NOTICE_WHY_DISLIKE))
                                .findFirst()
                                .orElseThrow()
                                .message())
                .contains("yucky smell");
    }

    @Test
    void whyLikeTipTieBreaksByChipListOrder() {
        List<TastingSession> nights =
                List.of(
                        completedNightWithWhy(LocalDate.of(2026, 7, 10), Liked.like, "tasty and soft"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 11), Liked.like, "tasty, soft"),
                        completedNightWithWhy(LocalDate.of(2026, 7, 12), Liked.like, "warm"));

        InsightsResponse response =
                InsightsCalculator.compute(
                        nights,
                        List.of(),
                        Set.of(
                                InsightsCalculator.TIP_CELEBRATE_ATE_ENOUGH,
                                InsightsCalculator.TIP_MIX_FAMILIARITY),
                        id -> "Apples");

        assertThat(
                        response.tips().stream()
                                .filter(tip -> tip.id().equals(InsightsCalculator.TIP_LEAN_INTO_WHY_LIKE))
                                .findFirst()
                                .orElseThrow()
                                .message())
                .contains("tasty");
    }

    private TastingSession completedNightWithWhy(LocalDate day, Liked liked, String whyNote) {
        TastingSession session = TastingSession.planned(householdId, day, now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.safe, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.safe, null, 2)),
                now);
        session.getFoods()
                .get(0)
                .recordOutcome(liked, null, null, null, null, whyNote, null, true);
        session.getFoods()
                .get(1)
                .recordOutcome(Liked.so_so, null, null, null, null, null, null, true);
        session.complete(now);
        return session;
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
                .recordOutcome(liked, texture, null, null, null, null, null, ateEnough);
        session.getFoods()
                .get(1)
                .recordOutcome(Liked.so_so, null, null, null, null, null, null, ateEnough);
        session.complete(now);
        return session;
    }

    private TastingSession completedNightWithTastes(
            LocalDate day, Liked liked, List<TasteBasic> tastes) {
        return completedNightWithTextureAndTastes(day, null, liked, tastes);
    }

    private TastingSession completedNightWithTextureAndTastes(
            LocalDate day, Texture texture, List<TasteBasic> tastes) {
        return completedNightWithTextureAndTastes(day, texture, Liked.like, tastes);
    }

    private TastingSession completedNightWithTextureAndTastes(
            LocalDate day, Texture texture, Liked liked, List<TasteBasic> tastes) {
        TastingSession session = TastingSession.planned(householdId, day, now);
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodA, Familiarity.safe, null, 1),
                        TastingSessionFood.of(foodB, Familiarity.safe, null, 2)),
                now);
        session.getFoods()
                .get(0)
                .recordOutcome(liked, texture, null, null, tastes, null, null, true);
        session.getFoods()
                .get(1)
                .recordOutcome(Liked.so_so, null, null, null, null, null, null, true);
        session.complete(now);
        return session;
    }
}
