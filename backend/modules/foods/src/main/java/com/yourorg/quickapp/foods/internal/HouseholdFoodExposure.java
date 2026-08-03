package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.ExposureSource;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "household_food_exposures")
class HouseholdFoodExposure {

    @Id
    private UUID id;

    @Column(name = "household_id", nullable = false)
    private UUID householdId;

    @Column(name = "food_id", nullable = false)
    private UUID foodId;

    @Column(name = "variant_key", nullable = false, length = 200)
    private String variantKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FoodFamiliarity familiarity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ExposureSource source;

    @Column(name = "attempt_count")
    private Integer attemptCount;

    @Column(name = "last_tried_on")
    private LocalDate lastTriedOn;

    @Column(name = "last_liked", length = 16)
    private String lastLiked;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected HouseholdFoodExposure() {}

    static HouseholdFoodExposure create(
            UUID householdId,
            UUID foodId,
            String variantKey,
            FoodFamiliarity familiarity,
            ExposureSource source,
            Instant now) {
        HouseholdFoodExposure row = new HouseholdFoodExposure();
        row.id = UUID.randomUUID();
        row.householdId = householdId;
        row.foodId = foodId;
        row.variantKey = variantKey;
        row.familiarity = familiarity;
        row.source = source;
        row.createdAt = now;
        row.updatedAt = now;
        return row;
    }

    UUID getId() {
        return id;
    }

    UUID getHouseholdId() {
        return householdId;
    }

    UUID getFoodId() {
        return foodId;
    }

    String getVariantKey() {
        return variantKey;
    }

    FoodFamiliarity getFamiliarity() {
        return familiarity;
    }

    ExposureSource getSource() {
        return source;
    }

    void updateFamiliarity(FoodFamiliarity familiarity, ExposureSource source, Instant now) {
        this.familiarity = familiarity;
        this.source = source;
        this.updatedAt = now;
    }
}
