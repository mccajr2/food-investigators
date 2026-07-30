package com.yourorg.quickapp.sessions;

import java.time.LocalDate;

/** One recent completed-food why note for Insights. */
public record RecentWhyNote(
        LocalDate scheduledOn, String foodName, Liked liked, String whyNote) {}
