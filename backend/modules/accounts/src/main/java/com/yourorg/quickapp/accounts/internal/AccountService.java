package com.yourorg.quickapp.accounts.internal;

import com.yourorg.quickapp.accounts.AccountPrincipal;
import com.yourorg.quickapp.accounts.AuthResponse;
import com.yourorg.quickapp.accounts.DuplicateEmailException;
import com.yourorg.quickapp.accounts.InvalidCredentialsException;
import com.yourorg.quickapp.accounts.SessionTtlProperties;
import com.yourorg.quickapp.accounts.UserResponse;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final HouseholdRepository households;
    private final UserAccountRepository users;
    private final SessionTokenRepository sessions;
    private final PasswordEncoder passwordEncoder;
    private final SessionTtlProperties sessionTtl;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    AccountService(
            HouseholdRepository households,
            UserAccountRepository users,
            SessionTokenRepository sessions,
            PasswordEncoder passwordEncoder,
            SessionTtlProperties sessionTtl,
            Clock clock) {
        this.households = households;
        this.users = users;
        this.sessions = sessions;
        this.passwordEncoder = passwordEncoder;
        this.sessionTtl = sessionTtl;
        this.clock = clock;
    }

    @Transactional
    public AuthResponse register(String email, String password, boolean rememberMe) {
        String normalized = normalizeEmail(email);
        if (users.existsByEmailIgnoreCase(normalized)) {
            throw new DuplicateEmailException(normalized);
        }

        Instant now = clock.instant();
        Household household = households.save(new Household(UUID.randomUUID(), now));
        UserAccount user =
                users.save(
                        new UserAccount(
                                UUID.randomUUID(),
                                household.getId(),
                                normalized,
                                passwordEncoder.encode(password),
                                now));
        return issueSession(user, rememberMe, now);
    }

    @Transactional
    public AuthResponse login(String email, String password, boolean rememberMe) {
        String normalized = normalizeEmail(email);
        UserAccount user =
                users.findByEmailIgnoreCase(normalized)
                        .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return issueSession(user, rememberMe, clock.instant());
    }

    @Transactional
    public void logout(String rawToken) {
        sessions.deleteByToken(rawToken);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        UserAccount user =
                users.findById(userId)
                        .orElseThrow(() -> new IllegalStateException("Authenticated user missing"));
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public Optional<AccountPrincipal> findPrincipalByToken(String rawToken) {
        Instant now = clock.instant();
        return sessions
                .findByToken(rawToken)
                .filter(session -> !session.isExpired(now))
                .flatMap(session -> users.findById(session.getUserId()))
                .map(
                        user ->
                                new AccountPrincipal(
                                        user.getId(), user.getHouseholdId(), user.getEmail()));
    }

    private AuthResponse issueSession(UserAccount user, boolean rememberMe, Instant now) {
        String token = newToken();
        Instant expiresAt = now.plus(sessionTtl.forRememberMe(rememberMe));
        sessions.save(new SessionToken(UUID.randomUUID(), user.getId(), token, expiresAt, now));
        return new AuthResponse(token, toUserResponse(user));
    }

    private static UserResponse toUserResponse(UserAccount user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getHouseholdId());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
