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

    /**
     * Optional display first name for the household's current/primary child (beta). Multi-child
     * may later move this to a children table.
     */
    @Column(name = "child_display_name", length = 40)
    private String childDisplayName;

    protected Household() {}

    Household(UUID id, Instant createdAt, String childDisplayName) {
        this.id = id;
        this.createdAt = createdAt;
        this.childDisplayName = childDisplayName;
    }

    UUID getId() {
        return id;
    }

    String getChildDisplayName() {
        return childDisplayName;
    }

    void setChildDisplayName(String childDisplayName) {
        this.childDisplayName = childDisplayName;
    }
}
