package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.Texture;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SuggestionBriefBuilderTest {

    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final Instant now = Instant.parse("2026-07-15T12:00:00Z");

    @Test
    void shortlistIsCappedAtTwentyAndPrefersNotRecent() {
        List<CatalogFood> selectable = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            selectable.add(
                    new CatalogFood(
                            UUID.fromString(String.format("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa%02d", i + 1)),
                            "Food " + i,
                            "apple"));
        }
        TastingSession recent = completed(LocalDate.of(2026, 7, 14), selectable.get(0).id());
        InsightsResponse insights = emptyInsights(1);

        SuggestionBrief brief =
                SuggestionBriefBuilder.build(List.of(recent), selectable, insights);

        assertThat(brief.candidates()).hasSize(SuggestionBrief.MAX_CANDIDATES);
        assertThat(brief.candidates().getFirst().hint()).isEqualTo("not_recent");
        assertThat(brief.candidates().stream().map(SuggestionCandidate::foodId))
                .doesNotHaveDuplicates();
    }

    @Test
    void paceHintPullBackWhenSlowDownTipPresent() {
        InsightsResponse insights =
                new InsightsResponse(
                        3,
                        true,
                        3,
                        1,
                        2,
                        1,
                        2,
                        0,
                        List.of(),
                        List.of(),
                        2,
                        1,
                        3,
                        0,
                        false,
                        List.of(
                                new com.yourorg.quickapp.sessions.InsightTip(
                                        InsightsCalculator.TIP_SLOW_DOWN_TRULY_NEW, "ease off")));
        assertThat(SuggestionBriefBuilder.paceHint(insights)).isEqualTo("pull_back");
    }

    private TastingSession completed(LocalDate day, UUID foodId) {
        TastingSession session = TastingSession.planned(householdId, day, now);
        UUID other = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa99");
        session.replaceFoods(
                List.of(
                        TastingSessionFood.of(foodId, Familiarity.safe, null, 1),
                        TastingSessionFood.of(other, Familiarity.safe, null, 2)),
                now);
        session.getFoods().get(0).recordOutcome(Liked.like, Texture.soft, null, null, null, null, null, true);
        session.getFoods().get(1).recordOutcome(Liked.so_so, null, null, null, null, null, null, true);
        session.complete(now);
        return session;
    }

    private static InsightsResponse emptyInsights(int completed) {
        return new InsightsResponse(
                completed,
                completed >= 3,
                0,
                0,
                0,
                0,
                0,
                0,
                List.of(),
                List.of(),
                0,
                0,
                0,
                0,
                false,
                List.of());
    }
}
