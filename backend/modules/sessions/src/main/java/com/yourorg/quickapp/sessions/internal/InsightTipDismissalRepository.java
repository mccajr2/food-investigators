package com.yourorg.quickapp.sessions.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface InsightTipDismissalRepository extends JpaRepository<InsightTipDismissal, InsightTipDismissal.Pk> {

    List<InsightTipDismissal> findByHouseholdId(UUID householdId);

    Optional<InsightTipDismissal> findByHouseholdIdAndTipId(UUID householdId, String tipId);

    boolean existsByHouseholdIdAndTipId(UUID householdId, String tipId);
}
