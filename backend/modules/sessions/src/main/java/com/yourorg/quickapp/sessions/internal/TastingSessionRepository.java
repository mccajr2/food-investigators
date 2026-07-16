package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.SessionStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface TastingSessionRepository extends JpaRepository<TastingSession, UUID> {

    List<TastingSession> findByHouseholdIdAndStatusOrderByScheduledOnAscCreatedAtAsc(
            UUID householdId, SessionStatus status);

    Optional<TastingSession> findByIdAndHouseholdId(UUID id, UUID householdId);
}
