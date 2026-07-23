package com.yourorg.quickapp.sessions;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        LocalDate scheduledOn,
        SessionStatus status,
        List<SessionFoodResponse> foods,
        String parentNote,
        Instant createdAt,
        Instant updatedAt) {}
