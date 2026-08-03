package com.yourorg.quickapp.foods;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Published by the sessions module after a tasting session completes. Foods
 * listens to upsert exposure profiles from outcomes. {@code liked} is the
 * outcome enum name ({@code like}, {@code so_so}, {@code no}) or null.
 */
public record SessionCompletedEvent(
        UUID householdId,
        UUID sessionId,
        LocalDate scheduledOn,
        List<SessionCompletedFood> foods) {

    public SessionCompletedEvent {
        foods = List.copyOf(foods);
    }
}
