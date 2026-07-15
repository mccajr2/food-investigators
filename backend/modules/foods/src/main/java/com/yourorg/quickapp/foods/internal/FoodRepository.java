package com.yourorg.quickapp.foods.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface FoodRepository extends JpaRepository<Food, UUID> {

    List<Food> findByHouseholdIdIsNullOrderByNameAsc();

    List<Food> findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(UUID householdId);

    List<Food> findByHouseholdIdOrderByNameAsc(UUID householdId);

    Optional<Food> findByIdAndHouseholdId(UUID id, UUID householdId);
}
