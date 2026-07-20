package com.yourorg.quickapp.sessions;

import com.yourorg.quickapp.accounts.AccountPrincipal;
import com.yourorg.quickapp.sessions.internal.SessionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> create(
            @AuthenticationPrincipal AccountPrincipal principal,
            @Valid @RequestBody CreateSessionRequest request) {
        SessionResponse created = sessionService.create(requireHouseholdId(principal), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<SessionResponse> listUpcoming(@AuthenticationPrincipal AccountPrincipal principal) {
        return sessionService.listUpcoming(requireHouseholdId(principal));
    }

    @GetMapping("/{sessionId}")
    public SessionResponse get(
            @AuthenticationPrincipal AccountPrincipal principal,
            @PathVariable("sessionId") UUID sessionId) {
        return sessionService.get(requireHouseholdId(principal), sessionId);
    }

    @PutMapping("/{sessionId}")
    public SessionResponse update(
            @AuthenticationPrincipal AccountPrincipal principal,
            @PathVariable("sessionId") UUID sessionId,
            @Valid @RequestBody UpdateSessionRequest request) {
        return sessionService.update(requireHouseholdId(principal), sessionId, request);
    }

    @PostMapping("/{sessionId}/cancel")
    public SessionResponse cancel(
            @AuthenticationPrincipal AccountPrincipal principal,
            @PathVariable("sessionId") UUID sessionId) {
        return sessionService.cancel(requireHouseholdId(principal), sessionId);
    }

    @PostMapping("/{sessionId}/complete")
    public SessionResponse complete(
            @AuthenticationPrincipal AccountPrincipal principal,
            @PathVariable("sessionId") UUID sessionId,
            @Valid @RequestBody CompleteSessionRequest request) {
        return sessionService.complete(requireHouseholdId(principal), sessionId, request);
    }

    private static UUID requireHouseholdId(AccountPrincipal principal) {
        if (principal == null || principal.householdId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return principal.householdId();
    }
}
