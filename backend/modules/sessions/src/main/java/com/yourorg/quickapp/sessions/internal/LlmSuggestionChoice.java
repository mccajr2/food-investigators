package com.yourorg.quickapp.sessions.internal;

import java.util.List;

record LlmSuggestionChoice(List<LlmFoodPick> foods, String rationale) {}
