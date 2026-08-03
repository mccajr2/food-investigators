package com.yourorg.quickapp.foods.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface HouseholdFoodExposureRepository extends JpaRepository<HouseholdFoodExposure, UUID> {

    List<HouseholdFoodExposure> findByHouseholdId(UUID householdId);

    List<HouseholdFoodExposure> findByHouseholdIdAndFoodId(UUID householdId, UUID foodId);

    Optional<HouseholdFoodExposure> findByHouseholdIdAndFoodIdAndVariantKey(
            UUID householdId, UUID foodId, String variantKey);

    void deleteByHouseholdIdAndFoodIdAndVariantKey(
            UUID householdId, UUID foodId, String variantKey);
}
