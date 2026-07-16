package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.sessions.CreateSessionRequest;
import com.yourorg.quickapp.sessions.InvalidSessionFoodException;
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
import java.util.List;
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
        return toResponse(sessions.save(session), resolved);
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
        return toResponse(sessions.save(session), resolved);
    }

    @Transactional
    public SessionResponse cancel(UUID householdId, UUID sessionId) {
        TastingSession session = requireSession(householdId, sessionId);
        requireEditable(session);
        session.cancel(clock.instant());
        return toResponse(sessions.save(session));
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
            String note = normalizeNote(item.variantNote());
            resolved.add(
                    new ResolvedFood(
                            catalog, item.familiarity(), note, i + 1));
        }
        return resolved;
    }

    private static String normalizeNote(String variantNote) {
        if (variantNote == null) {
            return null;
        }
        String trimmed = variantNote.trim();
        return trimmed.isEmpty() ? null : trimmed;
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
        List<ResolvedFood> resolved =
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
                                    return new ResolvedFood(
                                            catalog,
                                            row.getFamiliarity(),
                                            row.getVariantNote(),
                                            row.getPosition());
                                })
                        .toList();
        return toResponse(session, resolved);
    }

    private static SessionResponse toResponse(TastingSession session, List<ResolvedFood> resolved) {
        List<SessionFoodResponse> foods =
                resolved.stream()
                        .map(
                                food ->
                                        new SessionFoodResponse(
                                                food.catalog().id(),
                                                food.catalog().name(),
                                                food.catalog().iconKey(),
                                                food.familiarity(),
                                                food.variantNote(),
                                                food.position()))
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
