package com.yourorg.quickapp.foods.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "foods")
class Food {

    @Id
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "icon_key", nullable = false, length = 64)
    private String iconKey;

    @Column(name = "household_id")
    private UUID householdId;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Food() {}

    static Food system(UUID id, String name, String iconKey, Instant now) {
        Food food = new Food();
        food.id = id;
        food.name = name;
        food.iconKey = iconKey;
        food.householdId = null;
        food.archivedAt = null;
        food.createdAt = now;
        food.updatedAt = now;
        return food;
    }

    static Food household(UUID householdId, String name, String iconKey, Instant now) {
        Food food = new Food();
        food.id = UUID.randomUUID();
        food.name = name;
        food.iconKey = iconKey;
        food.householdId = householdId;
        food.archivedAt = null;
        food.createdAt = now;
        food.updatedAt = now;
        return food;
    }

    UUID getId() {
        return id;
    }

    String getName() {
        return name;
    }

    String getIconKey() {
        return iconKey;
    }

    UUID getHouseholdId() {
        return householdId;
    }

    Instant getArchivedAt() {
        return archivedAt;
    }

    boolean isSystem() {
        return householdId == null;
    }

    boolean isArchived() {
        return archivedAt != null;
    }

    void rename(String name, Instant now) {
        this.name = name;
        this.updatedAt = now;
    }

    void changeIcon(String iconKey, Instant now) {
        this.iconKey = iconKey;
        this.updatedAt = now;
    }

    void archive(Instant now) {
        this.archivedAt = now;
        this.updatedAt = now;
    }
}
