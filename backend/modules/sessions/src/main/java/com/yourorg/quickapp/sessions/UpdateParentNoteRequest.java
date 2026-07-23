package com.yourorg.quickapp.sessions;

import jakarta.validation.constraints.Size;

public record UpdateParentNoteRequest(
        @Size(max = 2000) String parentNote) {}
