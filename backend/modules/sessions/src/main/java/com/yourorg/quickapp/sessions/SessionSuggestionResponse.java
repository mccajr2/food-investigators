package com.yourorg.quickapp.sessions;

import java.time.LocalDate;
import java.util.List;

public record SessionSuggestionResponse(
        LocalDate scheduledOn,
        List<SuggestedSessionFood> foods,
        String rationale,
        SuggestionSource source,
        String pacingNote,
        List<PacingCitation> citations) {

    public SessionSuggestionResponse {
        citations = citations == null ? List.of() : List.copyOf(citations);
    }
}
