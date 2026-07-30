package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.sessions.CalendarProperties;
import com.yourorg.quickapp.sessions.InsufficientSuggestionCatalogException;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.SessionSuggestionResponse;
import com.yourorg.quickapp.sessions.SuggestedSessionFood;
import com.yourorg.quickapp.sessions.SuggestionSource;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionSuggestionService {

    private static final Set<SessionStatus> DAY_OCCUPYING_STATUSES =
            EnumSet.of(SessionStatus.planned, SessionStatus.completed);

    private final TastingSessionRepository sessions;
    private final FoodCatalog foodCatalog;
    private final SuggestionLlmPort llm;
    private final Clock clock;
    private final ZoneId calendarZone;

    @Autowired
    SessionSuggestionService(
            TastingSessionRepository sessions,
            FoodCatalog foodCatalog,
            SuggestionLlmPort llm,
            Clock clock,
            CalendarProperties calendarProperties) {
        this.sessions = sessions;
        this.foodCatalog = foodCatalog;
        this.llm = llm;
        this.clock = clock;
        this.calendarZone = calendarProperties.zoneId();
    }

    /** Test helper — same calendar zone as production default when omitted. */
    SessionSuggestionService(
            TastingSessionRepository sessions,
            FoodCatalog foodCatalog,
            SuggestionLlmPort llm,
            Clock clock) {
        this(sessions, foodCatalog, llm, clock, new CalendarProperties("America/New_York"));
    }

    @Transactional(readOnly = true)
    public SessionSuggestionResponse suggestNext(UUID householdId) {
        List<TastingSession> completed =
                sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed);
        List<SnackPreferenceSnapshot> snacks = foodCatalog.listActiveSnackPreferences(householdId);
        InsightsResponse insights = InsightsCalculator.compute(completed, snacks, Set.of());
        List<CatalogFood> selectable = foodCatalog.listSelectable(householdId);
        SuggestionBrief brief =
                SuggestionBriefBuilder.build(completed, selectable, insights);
        if (brief.candidates().size() < 2) {
            throw new InsufficientSuggestionCatalogException(
                    "Need at least two session-eligible foods to suggest a night");
        }

        LocalDate scheduledOn = nextOpenDay(householdId);
        Map<UUID, SuggestionCandidate> candidates =
                SuggestionBriefBuilder.candidateMap(brief);

        boolean tryAi =
                insights.completedSessionCount() >= InsightsCalculator.READY_SESSION_THRESHOLD;
        if (tryAi) {
            Optional<LlmSuggestionChoice> aiChoice = llm.propose(brief);
            Optional<SessionSuggestionResponse> validated =
                    aiChoice.flatMap(choice -> toResponse(choice, candidates, scheduledOn, SuggestionSource.ai));
            if (validated.isPresent()) {
                return validated.get();
            }
        }

        LlmSuggestionChoice heuristic =
                HeuristicSuggestionPicker.pick(brief)
                        .orElseThrow(
                                () ->
                                        new InsufficientSuggestionCatalogException(
                                                "Need at least two session-eligible foods to suggest a night"));
        return toResponse(heuristic, candidates, scheduledOn, SuggestionSource.heuristic)
                .orElseThrow(
                        () ->
                                new InsufficientSuggestionCatalogException(
                                        "Need at least two session-eligible foods to suggest a night"));
    }

    private Optional<SessionSuggestionResponse> toResponse(
            LlmSuggestionChoice choice,
            Map<UUID, SuggestionCandidate> candidates,
            LocalDate scheduledOn,
            SuggestionSource source) {
        if (choice.foods() == null || choice.foods().size() != 2) {
            return Optional.empty();
        }
        LlmFoodPick first = choice.foods().get(0);
        LlmFoodPick second = choice.foods().get(1);
        if (first.foodId().equals(second.foodId())) {
            return Optional.empty();
        }
        SuggestionCandidate c1 = candidates.get(first.foodId());
        SuggestionCandidate c2 = candidates.get(second.foodId());
        if (c1 == null || c2 == null) {
            return Optional.empty();
        }
        if (first.familiarity() == null || second.familiarity() == null) {
            return Optional.empty();
        }
        return Optional.of(
                new SessionSuggestionResponse(
                        scheduledOn,
                        List.of(
                                new SuggestedSessionFood(
                                        c1.foodId(), c1.name(), c1.iconKey(), first.familiarity()),
                                new SuggestedSessionFood(
                                        c2.foodId(), c2.name(), c2.iconKey(), second.familiarity())),
                        choice.rationale(),
                        source));
    }

    private LocalDate nextOpenDay(UUID householdId) {
        LocalDate day = today();
        for (int i = 0; i < 366; i++) {
            boolean occupied =
                    sessions.existsByHouseholdIdAndScheduledOnAndStatusIn(
                            householdId, day, DAY_OCCUPYING_STATUSES);
            if (!occupied) {
                return day;
            }
            day = day.plusDays(1);
        }
        return today().plusDays(1);
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(calendarZone));
    }
}
