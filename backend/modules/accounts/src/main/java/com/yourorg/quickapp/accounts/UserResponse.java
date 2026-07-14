package com.yourorg.quickapp.accounts;

import java.util.UUID;

public record UserResponse(UUID id, String email, UUID householdId) {}
