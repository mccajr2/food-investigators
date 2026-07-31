package com.yourorg.quickapp.sessions.internal;

import java.util.UUID;

record SuggestionCandidate(
        UUID foodId, String name, String iconKey, String iconUrl, String hint) {}
