package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.foods.StretchTargetSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.Liked;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class StretchPathSupportTest {

    private final Instant now = Instant.parse("2026-08-03T12:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID apples = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
    private final UUID beef = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa18");

    @Test
    void readyDestinationsEmptyOnPullBack() {
        List<StretchTargetSnapshot> targets =
                List.of(new StretchTargetSnapshot(beef, "Ground beef", ""));
        List<SafeExposureSnapshot> safes = List.of(new SafeExposureSnapshot(apples, "Apples", ""));

        assertThat(
                        StretchPathSupport.readyDestinations(
                                "pull_back", targets, safes, List.of()))
                .isEmpty();
    }

    @Test
    void readyDestinationsEmptyWithoutSafeAnchor() {
        List<StretchTargetSnapshot> targets =
                List.of(new StretchTargetSnapshot(beef, "Ground beef", ""));

        assertThat(
                        StretchPathSupport.readyDestinations(
                                "gentle_stretch", targets, List.of(), List.of()))
                .isEmpty();
    }

    @Test
    void cooldownAfterRecentLikedNo() {
        StretchTargetSnapshot target = new StretchTargetSnapshot(beef, "Ground beef", "taco");
        TastingSession night = TastingSession.planned(householdId, LocalDate.of(2026, 8, 1), now);
        night.replaceFoods(
                List.of(
                        TastingSessionFood.of(beef, Familiarity.truly_new, "Taco", 1),
                        TastingSessionFood.of(apples, Familiarity.safe, null, 2)),
                now);
        night.getFoods()
                .get(0)
                .recordOutcome(Liked.no, null, null, null, null, null, null, false);
        night.getFoods()
                .get(1)
                .recordOutcome(Liked.like, null, null, null, null, null, null, true);
        night.complete(now);

        assertThat(StretchPathSupport.isInCooldown(target, List.of(night))).isTrue();
        assertThat(
                        StretchPathSupport.readyDestinations(
                                "gentle_stretch",
                                List.of(target),
                                List.of(new SafeExposureSnapshot(apples, "Apples", "")),
                                List.of(night)))
                .isEmpty();
    }

    @Test
    void pathBiasedCandidatesPreferTokenMatchesAndDeferUnreadyDestination() {
        SuggestionCandidate applesCand =
                new SuggestionCandidate(apples, "Apples", "apple", null, "safe_anchor");
        SuggestionCandidate tacoCand =
                new SuggestionCandidate(
                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10"),
                        "Seasoned beef crumbles",
                        "custom",
                        null,
                        "not_recent");
        SuggestionCandidate beefCand =
                new SuggestionCandidate(beef, "Ground beef", "custom", null, "not_recent");
        SuggestionBrief brief =
                new SuggestionBrief(
                        3,
                        "gentle_stretch",
                        List.of(),
                        List.of(),
                        1,
                        0,
                        0,
                        1,
                        0,
                        List.of(applesCand, beefCand, tacoCand),
                        List.of(new SafeExposureSnapshot(apples, "Apples", "")),
                        List.of(new StretchTargetSnapshot(beef, "Ground beef", "")),
                        List.of());

        List<SuggestionCandidate> ordered = StretchPathSupport.pathBiasedCandidates(brief);

        assertThat(ordered.get(0).name()).isEqualTo("Seasoned beef crumbles");
        assertThat(ordered.get(ordered.size() - 1).foodId()).isEqualTo(beef);
    }
}
