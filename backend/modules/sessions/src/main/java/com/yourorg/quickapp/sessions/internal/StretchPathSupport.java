package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.foods.StretchTargetSnapshot;
import com.yourorg.quickapp.sessions.Liked;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** C-lite stretch-path helpers: destination readiness + cool-down. */
final class StretchPathSupport {

    static final int COOLDOWN_NIGHTS = 3;

    private StretchPathSupport() {}

    static List<StretchTargetSnapshot> readyDestinations(
            String paceHint,
            List<StretchTargetSnapshot> targets,
            List<SafeExposureSnapshot> safeExposures,
            List<TastingSession> completedNewestFirst) {
        if (targets == null || targets.isEmpty()) {
            return List.of();
        }
        if ("pull_back".equals(paceHint)) {
            return List.of();
        }
        if (safeExposures == null || safeExposures.isEmpty()) {
            return List.of();
        }
        List<StretchTargetSnapshot> ready = new ArrayList<>();
        for (StretchTargetSnapshot target : targets) {
            if (!isInCooldown(target, completedNewestFirst)) {
                ready.add(target);
            }
        }
        return List.copyOf(ready);
    }

    static boolean isInCooldown(
            StretchTargetSnapshot target, List<TastingSession> completedNewestFirst) {
        if (completedNewestFirst == null || completedNewestFirst.isEmpty()) {
            return false;
        }
        int nights = 0;
        for (TastingSession session : completedNewestFirst) {
            if (nights >= COOLDOWN_NIGHTS) {
                break;
            }
            for (TastingSessionFood food : session.getFoods()) {
                if (!food.getFoodId().equals(target.foodId())) {
                    continue;
                }
                if (food.getLiked() != Liked.no) {
                    continue;
                }
                String sessionVariant = normalizeVariantKey(food.getVariantNote());
                if (target.variantKey().isEmpty() || target.variantKey().equals(sessionVariant)) {
                    return true;
                }
            }
            nights++;
        }
        return false;
    }

    /** True when the choice proposes a stretch destination that is not ready. */
    static boolean proposesUnreadyDestination(LlmSuggestionChoice choice, SuggestionBrief brief) {
        if (choice.foods() == null || brief.stretchTargets().isEmpty()) {
            return false;
        }
        Set<String> readyKeys = readyKeys(brief.readyStretchDestinations());
        for (LlmFoodPick pick : choice.foods()) {
            for (StretchTargetSnapshot target : brief.stretchTargets()) {
                if (matchesDestination(pick, target) && !readyKeys.contains(key(target))) {
                    return true;
                }
            }
        }
        return false;
    }

    static boolean matchesDestination(LlmFoodPick pick, StretchTargetSnapshot target) {
        if (pick == null || target == null) {
            return false;
        }
        if (!pick.isInvent() && pick.foodId() != null && pick.foodId().equals(target.foodId())) {
            return true;
        }
        if (pick.isInvent()
                && pick.proposedName() != null
                && target.foodName().equalsIgnoreCase(pick.proposedName().trim())) {
            String inventVariant = normalizeVariantKey(pick.proposedVariantNote());
            return target.variantKey().isEmpty() || target.variantKey().equals(inventVariant);
        }
        return false;
    }

    static SuggestionCandidate findReadyDestinationCandidate(SuggestionBrief brief) {
        if (brief.readyStretchDestinations().isEmpty()) {
            return null;
        }
        Map<UUID, SuggestionCandidate> map = SuggestionBriefBuilder.candidateMap(brief);
        for (StretchTargetSnapshot target : brief.readyStretchDestinations()) {
            SuggestionCandidate candidate = map.get(target.foodId());
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    static SuggestionCandidate findSafeAnchorCandidate(SuggestionBrief brief) {
        Set<UUID> safeIds = new HashSet<>();
        for (SafeExposureSnapshot safe : brief.safeExposures()) {
            safeIds.add(safe.foodId());
        }
        for (SuggestionCandidate candidate : brief.candidates()) {
            if (safeIds.contains(candidate.foodId())) {
                return candidate;
            }
        }
        return null;
    }

    /**
     * Reorder candidates so foods that share meaningful tokens with stretch
     * targets (but are not unready destinations) come first.
     */
    static List<SuggestionCandidate> pathBiasedCandidates(SuggestionBrief brief) {
        if (brief.stretchTargets().isEmpty() || "pull_back".equals(brief.paceHint())) {
            return brief.candidates();
        }
        Set<String> tokens = targetTokens(brief.stretchTargets());
        if (tokens.isEmpty()) {
            return brief.candidates();
        }
        Set<UUID> unreadyDestinationIds = new HashSet<>();
        Set<String> readyKeys = readyKeys(brief.readyStretchDestinations());
        for (StretchTargetSnapshot target : brief.stretchTargets()) {
            if (!readyKeys.contains(key(target))) {
                unreadyDestinationIds.add(target.foodId());
            }
        }
        List<SuggestionCandidate> preferred = new ArrayList<>();
        List<SuggestionCandidate> rest = new ArrayList<>();
        for (SuggestionCandidate candidate : brief.candidates()) {
            if (unreadyDestinationIds.contains(candidate.foodId())) {
                rest.add(candidate);
                continue;
            }
            if (sharesToken(candidate.name(), tokens)) {
                preferred.add(candidate);
            } else {
                rest.add(candidate);
            }
        }
        preferred.addAll(rest);
        return List.copyOf(preferred);
    }

    static Set<String> targetTokens(List<StretchTargetSnapshot> targets) {
        Set<String> tokens = new HashSet<>();
        for (StretchTargetSnapshot target : targets) {
            for (String part : target.foodName().toLowerCase(Locale.ROOT).split("[^a-z0-9]+")) {
                if (part.length() >= 3) {
                    tokens.add(part);
                }
            }
            if (!target.variantKey().isEmpty() && target.variantKey().length() >= 3) {
                tokens.add(target.variantKey().toLowerCase(Locale.ROOT));
            }
        }
        return tokens;
    }

    private static boolean sharesToken(String name, Set<String> tokens) {
        String lower = name.toLowerCase(Locale.ROOT);
        for (String token : tokens) {
            if (lower.contains(token)) {
                return true;
            }
        }
        return false;
    }

    private static Set<String> readyKeys(List<StretchTargetSnapshot> ready) {
        Set<String> keys = new HashSet<>();
        for (StretchTargetSnapshot target : ready) {
            keys.add(key(target));
        }
        return keys;
    }

    private static String key(StretchTargetSnapshot target) {
        return target.foodId() + "\0" + target.variantKey();
    }

    static String normalizeVariantKey(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }
}
