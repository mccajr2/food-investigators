package com.yourorg.quickapp.accounts.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.accounts.AuthResponse;
import com.yourorg.quickapp.accounts.DuplicateEmailException;
import com.yourorg.quickapp.accounts.InvalidChildDisplayNameException;
import com.yourorg.quickapp.accounts.InvalidCredentialsException;
import com.yourorg.quickapp.accounts.SessionTtlProperties;
import com.yourorg.quickapp.accounts.UserResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private HouseholdRepository households;

    @Mock
    private UserAccountRepository users;

    @Mock
    private SessionTokenRepository sessions;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AccountService service;
    private final Instant now = Instant.parse("2026-07-14T00:00:00Z");

    @BeforeEach
    void setUp() {
        SessionTtlProperties ttl =
                new SessionTtlProperties(Duration.ofDays(30), Duration.ofHours(12));
        service =
                new AccountService(
                        households,
                        users,
                        sessions,
                        passwordEncoder,
                        ttl,
                        Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void registerCreatesHouseholdUserAndRememberSession() {
        when(users.existsByEmailIgnoreCase("parent@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("hashed");
        when(households.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(users.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = service.register("Parent@Example.com", "password1", true, null);

        assertThat(response.user().email()).isEqualTo("parent@example.com");
        assertThat(response.user().childDisplayName()).isNull();
        assertThat(response.token()).hasSize(64);

        ArgumentCaptor<Household> householdCaptor = ArgumentCaptor.forClass(Household.class);
        verify(households).save(householdCaptor.capture());
        assertThat(householdCaptor.getValue().getChildDisplayName()).isNull();

        ArgumentCaptor<SessionToken> sessionCaptor = ArgumentCaptor.forClass(SessionToken.class);
        verify(sessions).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().getExpiresAt()).isEqualTo(now.plus(Duration.ofDays(30)));
    }

    @Test
    void registerPersistsTrimmedChildDisplayName() {
        when(users.existsByEmailIgnoreCase("parent@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("hashed");
        when(households.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(users.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response =
                service.register("parent@example.com", "password1", true, "  Alex  ");

        assertThat(response.user().childDisplayName()).isEqualTo("Alex");
        ArgumentCaptor<Household> householdCaptor = ArgumentCaptor.forClass(Household.class);
        verify(households).save(householdCaptor.capture());
        assertThat(householdCaptor.getValue().getChildDisplayName()).isEqualTo("Alex");
    }

    @Test
    void registerDuplicateEmailThrows() {
        when(users.existsByEmailIgnoreCase("parent@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register("parent@example.com", "password1", true, null))
                .isInstanceOf(DuplicateEmailException.class);
    }

    @Test
    void loginRejectsBadPasswordWithoutLeaking() {
        UserAccount user =
                new UserAccount(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        "parent@example.com",
                        "hashed",
                        now);
        when(users.findByEmailIgnoreCase("parent@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> service.login("parent@example.com", "wrong", false))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginSessionOnlyUsesShorterTtl() {
        UUID householdId = UUID.randomUUID();
        UserAccount user =
                new UserAccount(
                        UUID.randomUUID(),
                        householdId,
                        "parent@example.com",
                        "hashed",
                        now);
        when(users.findByEmailIgnoreCase("parent@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password1", "hashed")).thenReturn(true);
        when(households.findById(householdId))
                .thenReturn(Optional.of(new Household(householdId, now, "Sam")));
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = service.login("parent@example.com", "password1", false);

        assertThat(response.user().childDisplayName()).isEqualTo("Sam");
        ArgumentCaptor<SessionToken> sessionCaptor = ArgumentCaptor.forClass(SessionToken.class);
        verify(sessions).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().getExpiresAt())
                .isEqualTo(now.plus(Duration.ofHours(12)));
    }

    @Test
    void updateMeSetsAndClearsChildDisplayName() {
        UUID householdId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UserAccount user =
                new UserAccount(userId, householdId, "parent@example.com", "hashed", now);
        Household household = new Household(householdId, now, null);
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(households.findById(householdId)).thenReturn(Optional.of(household));
        when(households.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse updated = service.updateMe(userId, "  Riley  ");
        assertThat(updated.childDisplayName()).isEqualTo("Riley");
        assertThat(household.getChildDisplayName()).isEqualTo("Riley");

        UserResponse cleared = service.updateMe(userId, "   ");
        assertThat(cleared.childDisplayName()).isNull();
        assertThat(household.getChildDisplayName()).isNull();
    }

    @Test
    void updateMeRejectsInvalidName() {
        UUID householdId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UserAccount user =
                new UserAccount(userId, householdId, "parent@example.com", "hashed", now);
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(households.findById(householdId))
                .thenReturn(Optional.of(new Household(householdId, now, null)));

        assertThatThrownBy(() -> service.updateMe(userId, "a".repeat(41)))
                .isInstanceOf(InvalidChildDisplayNameException.class);
    }
}
