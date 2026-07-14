package com.yourorg.quickapp.accounts.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "households")
class Household {

    @Id
    private UUID id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Household() {}

    Household(UUID id, Instant createdAt) {
        this.id = id;
        this.createdAt = createdAt;
    }

    UUID getId() {
        return id;
    }
}
