package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.foods.StretchTargetSnapshot;
import java.util.List;

/** Bounded context for the LLM — never a full history dump. */
record SuggestionBrief(
        int completedSessionCount,
        String paceHint,
        List<String> topLikedTextures,
        List<String> topLikedTastes,
        int familiaritySafe,
        int familiarityFamiliarButNew,
        int familiarityTrulyNew,
        int ateEnoughYes,
        int ateEnoughNo,
        List<SuggestionCandidate> candidates,
        List<SafeExposureSnapshot> safeExposures,
        List<StretchTargetSnapshot> stretchTargets,
        List<StretchTargetSnapshot> readyStretchDestinations) {

    static final int MAX_CANDIDATES = 20;
    static final int MAX_SAFE_EXPOSURES = 20;

    SuggestionBrief {
        candidates = List.copyOf(candidates);
        safeExposures = List.copyOf(safeExposures);
        stretchTargets = List.copyOf(stretchTargets);
        readyStretchDestinations = List.copyOf(readyStretchDestinations);
    }
}
