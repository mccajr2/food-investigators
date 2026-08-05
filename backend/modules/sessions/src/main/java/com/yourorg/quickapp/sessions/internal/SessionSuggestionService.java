package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.foods.StretchTargetSnapshot;
import com.yourorg.quickapp.sessions.CalendarProperties;
import com.yourorg.quickapp.sessions.Familiarity;
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
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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
        List<SafeExposureSnapshot> safeExposures = foodCatalog.listSafeExposures(householdId);
        List<StretchTargetSnapshot> stretchTargets = foodCatalog.listStretchTargets(householdId);
        SuggestionBrief brief =
                SuggestionBriefBuilder.build(
                        completed, selectable, insights, safeExposures, stretchTargets);
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
                    aiChoice.flatMap(
                            choice -> toResponse(choice, candidates, brief, scheduledOn, SuggestionSource.ai));
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
        return toResponse(heuristic, candidates, brief, scheduledOn, SuggestionSource.heuristic)
                .orElseThrow(
                        () ->
                                new InsufficientSuggestionCatalogException(
                                        "Need at least two session-eligible foods to suggest a night"));
    }

    private Optional<SessionSuggestionResponse> toResponse(
            LlmSuggestionChoice choice,
            Map<UUID, SuggestionCandidate> candidates,
            SuggestionBrief brief,
            LocalDate scheduledOn,
            SuggestionSource source) {
        if (choice.foods() == null || choice.foods().size() != 2) {
            return Optional.empty();
        }
        if (StretchPathSupport.proposesUnreadyDestination(choice, brief)) {
            return Optional.empty();
        }
        LlmFoodPick first = normalizePick(choice.foods().get(0), candidates);
        LlmFoodPick second = normalizePick(choice.foods().get(1), candidates);
        if (first == null || second == null) {
            return Optional.empty();
        }
        if (first.familiarity() == null || second.familiarity() == null) {
            return Optional.empty();
        }

        long inventCount = (first.isInvent() ? 1 : 0) + (second.isInvent() ? 1 : 0);
        if (inventCount > 1) {
            return Optional.empty();
        }
        if (inventCount == 1) {
            if (brief.safeExposures().isEmpty() || source != SuggestionSource.ai) {
                return Optional.empty();
            }
            LlmFoodPick invent = first.isInvent() ? first : second;
            LlmFoodPick anchor = first.isInvent() ? second : first;
            if (invent.proposedName() == null || invent.proposedName().isBlank()) {
                return Optional.empty();
            }
            if (anchor.isInvent() || !isSafeAnchor(anchor, brief)) {
                return Optional.empty();
            }
            if (anchor.familiarity() != Familiarity.safe) {
                return Optional.empty();
            }
        } else {
            if (first.foodId().equals(second.foodId())) {
                return Optional.empty();
            }
            SuggestionCandidate c1 = candidates.get(first.foodId());
            SuggestionCandidate c2 = candidates.get(second.foodId());
            if (c1 == null || c2 == null) {
                return Optional.empty();
            }
        }

        SuggestedSessionFood slot1 = toSuggestedFood(first, candidates);
        SuggestedSessionFood slot2 = toSuggestedFood(second, candidates);
        if (slot1 == null || slot2 == null) {
            return Optional.empty();
        }
        PacingEvidencePack.Entry pacing = PacingEvidencePack.forHint(brief.paceHint());
        return Optional.of(
                new SessionSuggestionResponse(
                        scheduledOn,
                        List.of(slot1, slot2),
                        choice.rationale(),
                        source,
                        pacing.pacingNote(),
                        pacing.citations()));
    }

    /**
     * If an invent name matches a shortlist candidate, treat it as a catalog pick.
     */
    private static LlmFoodPick normalizePick(
            LlmFoodPick pick, Map<UUID, SuggestionCandidate> candidates) {
        if (pick == null) {
            return null;
        }
        if (!pick.isInvent()) {
            return pick;
        }
        String proposed = pick.proposedName() == null ? "" : pick.proposedName().trim();
        if (proposed.isEmpty()) {
            return pick;
        }
        for (SuggestionCandidate candidate : candidates.values()) {
            if (candidate.name().equalsIgnoreCase(proposed)) {
                return new LlmFoodPick(candidate.foodId(), pick.familiarity());
            }
        }
        return new LlmFoodPick(
                null,
                pick.familiarity(),
                proposed,
                blankToNull(pick.proposedVariantNote()));
    }

    private static boolean isSafeAnchor(LlmFoodPick pick, SuggestionBrief brief) {
        if (pick.isInvent() || pick.foodId() == null) {
            return false;
        }
        Set<UUID> safeFoodIds = new HashSet<>();
        for (SafeExposureSnapshot safe : brief.safeExposures()) {
            safeFoodIds.add(safe.foodId());
        }
        return safeFoodIds.contains(pick.foodId()) && candidatesContains(pick.foodId(), brief);
    }

    private static boolean candidatesContains(UUID foodId, SuggestionBrief brief) {
        return brief.candidates().stream().anyMatch(c -> c.foodId().equals(foodId));
    }

    private static SuggestedSessionFood toSuggestedFood(
            LlmFoodPick pick, Map<UUID, SuggestionCandidate> candidates) {
        if (pick.isInvent()) {
            String name = pick.proposedName().trim();
            return new SuggestedSessionFood(
                    null,
                    name,
                    "custom_" + slugIconKey(name),
                    null,
                    pick.familiarity(),
                    name,
                    blankToNull(pick.proposedVariantNote()));
        }
        SuggestionCandidate candidate = candidates.get(pick.foodId());
        if (candidate == null) {
            return null;
        }
        return new SuggestedSessionFood(
                candidate.foodId(),
                candidate.name(),
                candidate.iconKey(),
                candidate.iconUrl(),
                pick.familiarity(),
                null,
                null);
    }

    private static String slugIconKey(String name) {
        String slug =
                name.toLowerCase(Locale.ROOT)
                        .replaceAll("[^a-z0-9]+", "_")
                        .replaceAll("^_|_$", "");
        if (slug.isBlank()) {
            return "food";
        }
        if (slug.length() > 40) {
            return slug.substring(0, 40);
        }
        return slug;
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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
