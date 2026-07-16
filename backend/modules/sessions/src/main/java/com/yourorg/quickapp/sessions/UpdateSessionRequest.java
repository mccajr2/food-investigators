package com.yourorg.quickapp.sessions;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record UpdateSessionRequest(
        @NotNull LocalDate scheduledOn,
        @NotNull @Size(min = 2, max = 2) @Valid List<SessionFoodRequest> foods) {}
