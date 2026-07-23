package com.yourorg.quickapp.foods.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface FoodRepository extends JpaRepository<Food, UUID> {

    List<Food> findByHouseholdIdIsNullOrderByNameAsc();

    List<Food> findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(UUID householdId);

    List<Food> findByHouseholdIdAndSessionEligibleFalseAndArchivedAtIsNullOrderByNameAsc(
            UUID householdId);

    List<Food> findByHouseholdIdOrderByNameAsc(UUID householdId);

    Optional<Food> findByIdAndHouseholdId(UUID id, UUID householdId);

    /**
     * True when a system starter or an active household food already uses this
     * name (case-insensitive). Archived household foods do not block reuse.
     */
    @Query(
            """
            SELECT COUNT(f) > 0 FROM Food f
            WHERE LOWER(f.name) = LOWER(:name)
              AND (
                f.householdId IS NULL
                OR (f.householdId = :householdId AND f.archivedAt IS NULL)
              )
              AND (:excludeId IS NULL OR f.id <> :excludeId)
            """)
    boolean existsVisibleName(
            @Param("householdId") UUID householdId,
            @Param("name") String name,
            @Param("excludeId") UUID excludeId);
}
