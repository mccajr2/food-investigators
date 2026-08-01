package com.yourorg.quickapp.accounts;

import jakarta.validation.constraints.Size;

/** PATCH body for the authenticated parent's household profile fields. */
public record UpdateMeRequest(
        @Size(max = ChildDisplayNames.MAX_LENGTH) String childDisplayName) {}
