package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.Liked;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Builds a bounded brief + shortlist from aggregates and the selectable catalog. */
final class SuggestionBriefBuilder {

    private SuggestionBriefBuilder() {}

    static SuggestionBrief build(
            List<TastingSession> completedNewestFirst,
            List<CatalogFood> selectable,
            InsightsResponse insights,
            List<SafeExposureSnapshot> safeExposures) {
        Set<UUID> recentFoodIds = recentFoodIds(completedNewestFirst, 3);
        Set<UUID> likedNoFoodIds = likedNoFoodIds(completedNewestFirst);

        List<SuggestionCandidate> ranked = new ArrayList<>();
        for (CatalogFood food : selectable) {
            String hint = hintFor(food.id(), recentFoodIds, likedNoFoodIds);
            ranked.add(
                    new SuggestionCandidate(
                            food.id(), food.name(), food.iconKey(), food.iconUrl(), hint));
        }

        ranked.sort(
                Comparator.comparingInt(SuggestionBriefBuilder::hintPriority)
                        .thenComparing(SuggestionCandidate::name, String.CASE_INSENSITIVE_ORDER));

        List<SuggestionCandidate> shortlist =
                ranked.stream().limit(SuggestionBrief.MAX_CANDIDATES).toList();

        List<SafeExposureSnapshot> boundedSafes =
                safeExposures == null
                        ? List.of()
                        : safeExposures.stream()
                                .limit(SuggestionBrief.MAX_SAFE_EXPOSURES)
                                .toList();

        String paceHint = paceHint(insights);

        return new SuggestionBrief(
                insights.completedSessionCount(),
                paceHint,
                List.copyOf(insights.topLikedTextures()),
                List.copyOf(insights.topLikedTastes()),
                insights.familiaritySafe(),
                insights.familiarityFamiliarButNew(),
                insights.familiarityTrulyNew(),
                insights.ateEnoughYes(),
                insights.ateEnoughNo(),
                shortlist,
                boundedSafes);
    }

    /** Back-compat overload used by older tests — empty safe exposures. */
    static SuggestionBrief build(
            List<TastingSession> completedNewestFirst,
            List<CatalogFood> selectable,
            InsightsResponse insights) {
        return build(completedNewestFirst, selectable, insights, List.of());
    }

    static String paceHint(InsightsResponse insights) {
        if (insights.completedSessionCount() < InsightsCalculator.READY_SESSION_THRESHOLD) {
            return "steady";
        }
        boolean pullBack =
                insights.tips().stream()
                        .anyMatch(tip -> tip.id().equals(InsightsCalculator.TIP_SLOW_DOWN_TRULY_NEW));
        if (pullBack) {
            return "pull_back";
        }
        if (insights.familiarityTrulyNew() == 0) {
            return "gentle_stretch";
        }
        return "steady";
    }

    private static int hintPriority(SuggestionCandidate candidate) {
        return switch (candidate.hint()) {
            case "not_recent" -> 0;
            case "safe_anchor" -> 1;
            case "retry" -> 2;
            default -> 3;
        };
    }

    private static String hintFor(UUID foodId, Set<UUID> recentFoodIds, Set<UUID> likedNoFoodIds) {
        if (likedNoFoodIds.contains(foodId)) {
            return "retry";
        }
        if (!recentFoodIds.contains(foodId)) {
            return "not_recent";
        }
        return "safe_anchor";
    }

    private static Set<UUID> recentFoodIds(List<TastingSession> completedNewestFirst, int nights) {
        Set<UUID> ids = new HashSet<>();
        int count = 0;
        for (TastingSession session : completedNewestFirst) {
            if (count >= nights) {
                break;
            }
            for (TastingSessionFood food : session.getFoods()) {
                ids.add(food.getFoodId());
            }
            count++;
        }
        return ids;
    }

    private static Set<UUID> likedNoFoodIds(List<TastingSession> completedNewestFirst) {
        Set<UUID> ids = new HashSet<>();
        for (TastingSession session : completedNewestFirst) {
            for (TastingSessionFood food : session.getFoods()) {
                if (food.getLiked() == Liked.no) {
                    ids.add(food.getFoodId());
                }
            }
        }
        return ids;
    }

    /** Expose candidate map for validation. */
    static Map<UUID, SuggestionCandidate> candidateMap(SuggestionBrief brief) {
        Map<UUID, SuggestionCandidate> map = new LinkedHashMap<>();
        for (SuggestionCandidate candidate : brief.candidates()) {
            map.put(candidate.foodId(), candidate);
        }
        return map;
    }

    static Familiarity defaultFamiliarity(SuggestionCandidate candidate, String paceHint) {
        if ("pull_back".equals(paceHint) || "retry".equals(candidate.hint())) {
            return Familiarity.safe;
        }
        if ("gentle_stretch".equals(paceHint) && "not_recent".equals(candidate.hint())) {
            return Familiarity.familiar_but_new;
        }
        if ("safe_anchor".equals(candidate.hint())) {
            return Familiarity.safe;
        }
        return Familiarity.familiar_but_new;
    }
}
