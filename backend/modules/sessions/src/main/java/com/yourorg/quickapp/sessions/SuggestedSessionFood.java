package com.yourorg.quickapp.sessions;

import java.util.UUID;

public record SuggestedSessionFood(
        UUID foodId, String name, String iconKey, String iconUrl, Familiarity familiarity) {}
