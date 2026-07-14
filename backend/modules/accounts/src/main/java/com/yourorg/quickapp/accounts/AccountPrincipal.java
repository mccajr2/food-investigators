package com.yourorg.quickapp.accounts;

import java.util.UUID;

/** Authenticated parent principal carried in the security context. */
public record AccountPrincipal(UUID userId, UUID householdId, String email) {}
