package com.yourorg.quickapp.sessions.internal;

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
        List<SuggestionCandidate> candidates) {

    static final int MAX_CANDIDATES = 20;
}
