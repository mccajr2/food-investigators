package com.yourorg.quickapp.foods;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BootstrapSafeItemRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 200) String variantKey,
        Boolean sessionEligible) {}
