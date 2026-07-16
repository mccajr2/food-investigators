package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.SessionStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tasting_sessions")
class TastingSession {

    @Id
    private UUID id;

    @Column(name = "household_id", nullable = false)
    private UUID householdId;

    @Column(name = "scheduled_on", nullable = false)
    private LocalDate scheduledOn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<TastingSessionFood> foods = new ArrayList<>();

    protected TastingSession() {}

    static TastingSession planned(UUID householdId, LocalDate scheduledOn, Instant now) {
        TastingSession session = new TastingSession();
        session.id = UUID.randomUUID();
        session.householdId = householdId;
        session.scheduledOn = scheduledOn;
        session.status = SessionStatus.planned;
        session.createdAt = now;
        session.updatedAt = now;
        return session;
    }

    UUID getId() {
        return id;
    }

    UUID getHouseholdId() {
        return householdId;
    }

    LocalDate getScheduledOn() {
        return scheduledOn;
    }

    SessionStatus getStatus() {
        return status;
    }

    Instant getCreatedAt() {
        return createdAt;
    }

    Instant getUpdatedAt() {
        return updatedAt;
    }

    List<TastingSessionFood> getFoods() {
        return foods;
    }

    boolean isPlanned() {
        return status == SessionStatus.planned;
    }

    void reschedule(LocalDate scheduledOn, Instant now) {
        this.scheduledOn = scheduledOn;
        this.updatedAt = now;
    }

    void replaceFoods(List<TastingSessionFood> nextFoods, Instant now) {
        this.foods.clear();
        for (TastingSessionFood food : nextFoods) {
            food.attach(this);
            this.foods.add(food);
        }
        this.updatedAt = now;
    }

    void cancel(Instant now) {
        this.status = SessionStatus.cancelled;
        this.updatedAt = now;
    }
}
