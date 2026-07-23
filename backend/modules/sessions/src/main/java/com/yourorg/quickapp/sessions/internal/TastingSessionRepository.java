package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.SessionStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface TastingSessionRepository extends JpaRepository<TastingSession, UUID> {

    List<TastingSession> findByHouseholdIdAndStatusOrderByScheduledOnAscCreatedAtAsc(
            UUID householdId, SessionStatus status);

    List<TastingSession> findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
            UUID householdId, SessionStatus status);

    Optional<TastingSession> findByIdAndHouseholdId(UUID id, UUID householdId);

    boolean existsByHouseholdIdAndScheduledOnAndStatusIn(
            UUID householdId, LocalDate scheduledOn, Collection<SessionStatus> statuses);

    boolean existsByHouseholdIdAndScheduledOnAndStatusInAndIdNot(
            UUID householdId,
            LocalDate scheduledOn,
            Collection<SessionStatus> statuses,
            UUID excludeId);
}
