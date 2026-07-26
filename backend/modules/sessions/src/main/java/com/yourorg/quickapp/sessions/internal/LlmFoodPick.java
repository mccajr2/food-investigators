package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import java.util.UUID;

record LlmFoodPick(UUID foodId, Familiarity familiarity) {}
