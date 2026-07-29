package com.yourorg.quickapp.sessions.internal;

import java.util.Optional;

/** Port for Gemini (or test double). Returns empty when unconfigured or on failure. */
interface SuggestionLlmPort {

    Optional<LlmSuggestionChoice> propose(SuggestionBrief brief);
}
