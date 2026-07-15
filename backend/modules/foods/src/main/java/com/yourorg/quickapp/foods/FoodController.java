package com.yourorg.quickapp.foods;

import com.yourorg.quickapp.accounts.AccountPrincipal;
import com.yourorg.quickapp.foods.internal.FoodService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @GetMapping
    public List<FoodResponse> list(
            @AuthenticationPrincipal AccountPrincipal principal,
            @RequestParam(name = "includeArchived", defaultValue = "false") boolean includeArchived) {
        return foodService.list(requireHouseholdId(principal), includeArchived);
    }

    @PostMapping
    public ResponseEntity<FoodResponse> create(
            @AuthenticationPrincipal AccountPrincipal principal,
            @Valid @RequestBody CreateFoodRequest request) {
        FoodResponse created = foodService.create(requireHouseholdId(principal), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{foodId}")
    public FoodResponse update(
            @AuthenticationPrincipal AccountPrincipal principal,
            @PathVariable("foodId") UUID foodId,
            @Valid @RequestBody UpdateFoodRequest request) {
        return foodService.update(requireHouseholdId(principal), foodId, request);
    }

    @PostMapping("/{foodId}/archive")
    public FoodResponse archive(
            @AuthenticationPrincipal AccountPrincipal principal, @PathVariable("foodId") UUID foodId) {
        return foodService.archive(requireHouseholdId(principal), foodId);
    }

    private static UUID requireHouseholdId(AccountPrincipal principal) {
        if (principal == null || principal.householdId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return principal.householdId();
    }
}
