package com.yourorg.quickapp.accounts.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sessions")
class SessionToken {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SessionToken() {}

    SessionToken(UUID id, UUID userId, String token, Instant expiresAt, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.token = token;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    UUID getUserId() {
        return userId;
    }

    String getToken() {
        return token;
    }

    Instant getExpiresAt() {
        return expiresAt;
    }

    boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }
}
