package com.yourorg.quickapp.foods.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "household_stretch_targets")
class HouseholdStretchTarget {

    @Id
    private UUID id;

    @Column(name = "household_id", nullable = false)
    private UUID householdId;

    @Column(name = "food_id", nullable = false)
    private UUID foodId;

    @Column(name = "variant_key", nullable = false, length = 200)
    private String variantKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected HouseholdStretchTarget() {}

    static HouseholdStretchTarget create(
            UUID householdId, UUID foodId, String variantKey, Instant now) {
        HouseholdStretchTarget row = new HouseholdStretchTarget();
        row.id = UUID.randomUUID();
        row.householdId = householdId;
        row.foodId = foodId;
        row.variantKey = variantKey;
        row.createdAt = now;
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

    Instant getCreatedAt() {
        return createdAt;
    }
}
