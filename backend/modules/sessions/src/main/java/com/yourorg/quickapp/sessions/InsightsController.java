package com.yourorg.quickapp.sessions;

import com.yourorg.quickapp.accounts.AccountPrincipal;
import com.yourorg.quickapp.sessions.internal.InsightsService;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    private final InsightsService insightsService;

    public InsightsController(InsightsService insightsService) {
        this.insightsService = insightsService;
    }

    @GetMapping
    public InsightsResponse get(@AuthenticationPrincipal AccountPrincipal principal) {
        return insightsService.get(requireHouseholdId(principal));
    }

    @PostMapping("/tips/{tipId}/dismiss")
    public ResponseEntity<Map<String, String>> dismiss(
            @AuthenticationPrincipal AccountPrincipal principal,
            @PathVariable("tipId") String tipId) {
        insightsService.dismissTip(requireHouseholdId(principal), tipId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    private static UUID requireHouseholdId(AccountPrincipal principal) {
        if (principal == null || principal.householdId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return principal.householdId();
    }
}
