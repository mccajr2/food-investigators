package com.yourorg.quickapp.foods;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BootstrapSafesRequest(@NotNull List<@Valid BootstrapSafeItemRequest> items) {}
