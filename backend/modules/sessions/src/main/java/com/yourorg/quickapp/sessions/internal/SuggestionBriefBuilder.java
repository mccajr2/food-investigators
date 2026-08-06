package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.ExposureSnapshot;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.foods.StretchTargetSnapshot;
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
            List<SafeExposureSnapshot> safeExposures,
            List<StretchTargetSnapshot> stretchTargets) {
        return build(
                completedNewestFirst,
                selectable,
                insights,
                safeExposures,
                toExposuresFromSafes(safeExposures),
                stretchTargets);
    }

    static SuggestionBrief build(
            List<TastingSession> completedNewestFirst,
            List<CatalogFood> selectable,
            InsightsResponse insights,
            List<SafeExposureSnapshot> safeExposures,
            List<ExposureSnapshot> exposures,
            List<StretchTargetSnapshot> stretchTargets) {
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

        List<SafeExposureSnapshot> boundedSafes =
                safeExposures == null
                        ? List.of()
                        : safeExposures.stream()
                                .limit(SuggestionBrief.MAX_SAFE_EXPOSURES)
                                .toList();

        List<ExposureSnapshot> boundedExposures =
                exposures == null
                        ? toExposuresFromSafes(boundedSafes)
                        : List.copyOf(exposures);

        List<SuggestionCandidate> shortlist = shortlistWithPinnedSafes(ranked, boundedSafes);

        List<StretchTargetSnapshot> targets =
                stretchTargets == null ? List.of() : List.copyOf(stretchTargets);

        String paceHint = paceHint(insights);
        List<StretchTargetSnapshot> ready =
                StretchPathSupport.readyDestinations(
                        paceHint, targets, boundedSafes, completedNewestFirst);

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
                boundedSafes,
                boundedExposures,
                targets,
                ready);
    }

    private static List<ExposureSnapshot> toExposuresFromSafes(
            List<SafeExposureSnapshot> safeExposures) {
        if (safeExposures == null || safeExposures.isEmpty()) {
            return List.of();
        }
        List<ExposureSnapshot> result = new ArrayList<>(safeExposures.size());
        for (SafeExposureSnapshot safe : safeExposures) {
            result.add(
                    new ExposureSnapshot(
                            safe.foodId(),
                            safe.foodName(),
                            safe.variantKey(),
                            FoodFamiliarity.safe));
        }
        return List.copyOf(result);
    }

    /**
     * Keep the ranked shortlist, but always reserve room for foods that have a
     * safe exposure so invent/stretch-destination pairing can find an anchor.
     */
    static List<SuggestionCandidate> shortlistWithPinnedSafes(
            List<SuggestionCandidate> ranked, List<SafeExposureSnapshot> boundedSafes) {
        if (ranked.size() <= SuggestionBrief.MAX_CANDIDATES) {
            return List.copyOf(ranked);
        }
        Set<UUID> safeIds = new HashSet<>();
        for (SafeExposureSnapshot safe : boundedSafes) {
            safeIds.add(safe.foodId());
        }
        List<SuggestionCandidate> pinned = new ArrayList<>();
        for (SuggestionCandidate candidate : ranked) {
            if (safeIds.contains(candidate.foodId())) {
                pinned.add(candidate);
            }
        }
        List<SuggestionCandidate> result = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        for (SuggestionCandidate candidate : ranked) {
            if (result.size() >= SuggestionBrief.MAX_CANDIDATES - Math.min(pinned.size(), 5)) {
                break;
            }
            if (seen.add(candidate.foodId())) {
                result.add(candidate);
            }
        }
        for (SuggestionCandidate candidate : pinned) {
            if (result.size() >= SuggestionBrief.MAX_CANDIDATES) {
                break;
            }
            if (seen.add(candidate.foodId())) {
                result.add(candidate);
            }
        }
        // If still short (few ranked), fill from ranked.
        for (SuggestionCandidate candidate : ranked) {
            if (result.size() >= SuggestionBrief.MAX_CANDIDATES) {
                break;
            }
            if (seen.add(candidate.foodId())) {
                result.add(candidate);
            }
        }
        return List.copyOf(result);
    }

    /** Back-compat overload used by older tests — empty safe exposures / stretch targets. */
    static SuggestionBrief build(
            List<TastingSession> completedNewestFirst,
            List<CatalogFood> selectable,
            InsightsResponse insights) {
        return build(completedNewestFirst, selectable, insights, List.of(), List.of());
    }

    static SuggestionBrief build(
            List<TastingSession> completedNewestFirst,
            List<CatalogFood> selectable,
            InsightsResponse insights,
            List<SafeExposureSnapshot> safeExposures) {
        return build(completedNewestFirst, selectable, insights, safeExposures, List.of());
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
