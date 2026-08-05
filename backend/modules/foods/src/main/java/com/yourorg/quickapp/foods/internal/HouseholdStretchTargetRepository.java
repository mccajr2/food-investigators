package com.yourorg.quickapp.foods.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface HouseholdStretchTargetRepository extends JpaRepository<HouseholdStretchTarget, UUID> {

    List<HouseholdStretchTarget> findByHouseholdId(UUID householdId);

    long countByHouseholdId(UUID householdId);

    Optional<HouseholdStretchTarget> findByHouseholdIdAndFoodIdAndVariantKey(
            UUID householdId, UUID foodId, String variantKey);

    void deleteByHouseholdIdAndFoodIdAndVariantKey(
            UUID householdId, UUID foodId, String variantKey);
}
