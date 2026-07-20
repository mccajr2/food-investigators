package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.sessions.CompleteSessionRequest;
import com.yourorg.quickapp.sessions.CreateSessionRequest;
import com.yourorg.quickapp.sessions.FoodOutcomeRequest;
import com.yourorg.quickapp.sessions.InvalidSessionFoodException;
import com.yourorg.quickapp.sessions.InvalidSessionOutcomeException;
import com.yourorg.quickapp.sessions.SessionFoodRequest;
import com.yourorg.quickapp.sessions.SessionFoodResponse;
import com.yourorg.quickapp.sessions.SessionNotEditableException;
import com.yourorg.quickapp.sessions.SessionNotFoundException;
import com.yourorg.quickapp.sessions.SessionResponse;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.UpdateSessionRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {

    private final TastingSessionRepository sessions;
    private final FoodCatalog foodCatalog;
    private final Clock clock;

    SessionService(TastingSessionRepository sessions, FoodCatalog foodCatalog, Clock clock) {
        this.sessions = sessions;
        this.foodCatalog = foodCatalog;
        this.clock = clock;
    }

    @Transactional
    public SessionResponse create(UUID householdId, CreateSessionRequest request) {
        Instant now = clock.instant();
        List<ResolvedFood> resolved = resolveFoods(householdId, request.foods());
        TastingSession session = TastingSession.planned(householdId, request.scheduledOn(), now);
        session.replaceFoods(toEntities(resolved), now);
        return toResponse(sessions.save(session));
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> listUpcoming(UUID householdId) {
        return sessions
                .findByHouseholdIdAndStatusOrderByScheduledOnAscCreatedAtAsc(
                        householdId, SessionStatus.planned)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SessionResponse get(UUID householdId, UUID sessionId) {
        return toResponse(requireSession(householdId, sessionId));
    }

    @Transactional
    public SessionResponse update(UUID householdId, UUID sessionId, UpdateSessionRequest request) {
        TastingSession session = requireSession(householdId, sessionId);
        requireEditable(session);
        Instant now = clock.instant();
        List<ResolvedFood> resolved = resolveFoods(householdId, request.foods());
        session.reschedule(request.scheduledOn(), now);
        session.getFoods().clear();
        sessions.flush();
        session.replaceFoods(toEntities(resolved), now);
        return toResponse(sessions.save(session));
    }

    @Transactional
    public SessionResponse cancel(UUID householdId, UUID sessionId) {
        TastingSession session = requireSession(householdId, sessionId);
        requireEditable(session);
        session.cancel(clock.instant());
        return toResponse(sessions.save(session));
    }

    @Transactional
    public SessionResponse complete(
            UUID householdId, UUID sessionId, CompleteSessionRequest request) {
        TastingSession session = requireSession(householdId, sessionId);
        requireEditable(session);
        applyOutcomes(session, request.foods());
        session.complete(clock.instant());
        return toResponse(sessions.save(session));
    }

    private void applyOutcomes(TastingSession session, List<FoodOutcomeRequest> outcomes) {
        if (outcomes == null || outcomes.size() != 2) {
            throw new InvalidSessionOutcomeException("Exactly two food outcomes are required");
        }
        Set<Integer> positions = new HashSet<>();
        for (FoodOutcomeRequest outcome : outcomes) {
            if (outcome.position() == null || outcome.position() < 1 || outcome.position() > 2) {
                throw new InvalidSessionOutcomeException("Food outcome position must be 1 or 2");
            }
            if (!positions.add(outcome.position())) {
                throw new InvalidSessionOutcomeException("Duplicate food outcome position");
            }
            if (outcome.ateEnough() == null) {
                throw new InvalidSessionOutcomeException("ateEnough is required for each food");
            }
            TastingSessionFood row =
                    session.getFoods().stream()
                            .filter(food -> food.getPosition() == outcome.position())
                            .findFirst()
                            .orElseThrow(
                                    () ->
                                            new InvalidSessionOutcomeException(
                                                    "No food at position " + outcome.position()));
            row.recordOutcome(
                    outcome.liked(),
                    outcome.texture(),
                    outcome.temperature(),
                    outcome.smell(),
                    normalizeNote(outcome.whyNote(), 500),
                    normalizeNote(outcome.changeNote(), 500),
                    outcome.ateEnough());
        }
        if (!positions.contains(1) || !positions.contains(2)) {
            throw new InvalidSessionOutcomeException("Outcomes for positions 1 and 2 are required");
        }
    }

    private TastingSession requireSession(UUID householdId, UUID sessionId) {
        return sessions
                .findByIdAndHouseholdId(sessionId, householdId)
                .orElseThrow(SessionNotFoundException::new);
    }

    private static void requireEditable(TastingSession session) {
        if (!session.isPlanned()) {
            throw new SessionNotEditableException();
        }
    }

    private List<ResolvedFood> resolveFoods(UUID householdId, List<SessionFoodRequest> foods) {
        if (foods == null || foods.size() != 2) {
            throw new InvalidSessionFoodException("Exactly two foods are required");
        }
        List<ResolvedFood> resolved = new ArrayList<>(2);
        for (int i = 0; i < foods.size(); i++) {
            SessionFoodRequest item = foods.get(i);
            CatalogFood catalog =
                    foodCatalog
                            .findSelectable(householdId, item.foodId())
                            .orElseThrow(
                                    () ->
                                            new InvalidSessionFoodException(
                                                    "Food is unknown, archived, or not in this household catalog"));
            String note = normalizeNote(item.variantNote(), 200);
            resolved.add(new ResolvedFood(catalog, item.familiarity(), note, i + 1));
        }
        return resolved;
    }

    private static String normalizeNote(String note, int maxLength) {
        if (note == null) {
            return null;
        }
        String trimmed = note.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > maxLength) {
            throw new InvalidSessionOutcomeException(
                    "Note must be at most " + maxLength + " characters");
        }
        return trimmed;
    }

    private static List<TastingSessionFood> toEntities(List<ResolvedFood> resolved) {
        return resolved.stream()
                .map(
                        food ->
                                TastingSessionFood.of(
                                        food.catalog().id(),
                                        food.familiarity(),
                                        food.variantNote(),
                                        food.position()))
                .toList();
    }

    private SessionResponse toResponse(TastingSession session) {
        List<SessionFoodResponse> foods =
                session.getFoods().stream()
                        .map(
                                row -> {
                                    CatalogFood catalog =
                                            foodCatalog
                                                    .findVisible(
                                                            session.getHouseholdId(), row.getFoodId())
                                                    .orElseGet(
                                                            () ->
                                                                    new CatalogFood(
                                                                            row.getFoodId(),
                                                                            "Unknown food",
                                                                            "custom_unknown"));
                                    return new SessionFoodResponse(
                                            catalog.id(),
                                            catalog.name(),
                                            catalog.iconKey(),
                                            row.getFamiliarity(),
                                            row.getVariantNote(),
                                            row.getPosition(),
                                            row.getLiked(),
                                            row.getTexture(),
                                            row.getTemperature(),
                                            row.getSmell(),
                                            row.getWhyNote(),
                                            row.getChangeNote(),
                                            row.getAteEnough());
                                })
                        .toList();
        return new SessionResponse(
                session.getId(),
                session.getScheduledOn(),
                session.getStatus(),
                foods,
                session.getCreatedAt(),
                session.getUpdatedAt());
    }

    private record ResolvedFood(
            CatalogFood catalog,
            com.yourorg.quickapp.sessions.Familiarity familiarity,
            String variantNote,
            int position) {}
}
