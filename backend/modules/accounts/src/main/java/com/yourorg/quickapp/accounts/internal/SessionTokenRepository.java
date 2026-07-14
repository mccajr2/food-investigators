package com.yourorg.quickapp.accounts.internal;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SessionTokenRepository extends JpaRepository<SessionToken, UUID> {
    Optional<SessionToken> findByToken(String token);

    void deleteByToken(String token);
}
