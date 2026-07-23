package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodTexture;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @Column(name = "session_eligible", nullable = false)
    private boolean sessionEligible = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "liked", length = 16)
    private FoodLiked liked;

    @Enumerated(EnumType.STRING)
    @Column(name = "texture", length = 16)
    private FoodTexture texture;

    @Column(name = "taste_note", length = 100)
    private String tasteNote;

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
        food.sessionEligible = true;
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
        food.sessionEligible = true;
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

    boolean isSessionEligible() {
        return sessionEligible;
    }

    FoodLiked getLiked() {
        return liked;
    }

    FoodTexture getTexture() {
        return texture;
    }

    String getTasteNote() {
        return tasteNote;
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

    void setSessionEligible(boolean sessionEligible, Instant now) {
        this.sessionEligible = sessionEligible;
        this.updatedAt = now;
    }

    void setPreferences(FoodLiked liked, FoodTexture texture, String tasteNote, Instant now) {
        this.liked = liked;
        this.texture = texture;
        this.tasteNote = tasteNote;
        this.updatedAt = now;
    }

    void archive(Instant now) {
        this.archivedAt = now;
        this.updatedAt = now;
    }
}
