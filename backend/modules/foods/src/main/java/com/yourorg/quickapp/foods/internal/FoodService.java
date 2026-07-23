package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.CreateFoodRequest;
import com.yourorg.quickapp.foods.DuplicateFoodNameException;
import com.yourorg.quickapp.foods.FoodIconKeys;
import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodNotFoundException;
import com.yourorg.quickapp.foods.FoodResponse;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.InvalidFoodPreferenceException;
import com.yourorg.quickapp.foods.SystemFoodImmutableException;
import com.yourorg.quickapp.foods.UpdateFoodRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FoodService {

    private static final int TASTE_NOTE_MAX = 100;

    private final FoodRepository foods;
    private final Clock clock;

    FoodService(FoodRepository foods, Clock clock) {
        this.foods = foods;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<FoodResponse> list(UUID householdId, boolean includeArchived) {
        List<Food> result = new ArrayList<>(foods.findByHouseholdIdIsNullOrderByNameAsc());
        if (includeArchived) {
            result.addAll(foods.findByHouseholdIdOrderByNameAsc(householdId));
        } else {
            result.addAll(foods.findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(householdId));
        }
        result.sort(Comparator.comparing(Food::getName, String.CASE_INSENSITIVE_ORDER));
        return result.stream().map(FoodService::toResponse).toList();
    }

    @Transactional
    public FoodResponse create(UUID householdId, CreateFoodRequest request) {
        FoodIconKeys.requireAllowed(request.iconKey());
        String name = request.name().trim();
        requireUniqueVisibleName(householdId, name, null);
        Instant now = clock.instant();
        Food food = Food.household(householdId, name, request.iconKey(), now);
        boolean sessionEligible =
                request.sessionEligible() == null || request.sessionEligible();
        food.setSessionEligible(sessionEligible, now);
        food.setPreferences(
                request.liked(),
                request.texture(),
                normalizeTasteNote(request.tasteNote()),
                now);
        return toResponse(foods.save(food));
    }

    @Transactional
    public FoodResponse update(UUID householdId, UUID foodId, UpdateFoodRequest request) {
        Food food = requireHouseholdFood(householdId, foodId);
        Instant now = clock.instant();
        if (request.name() != null && !request.name().isBlank()) {
            String name = request.name().trim();
            requireUniqueVisibleName(householdId, name, foodId);
            food.rename(name, now);
        }
        if (request.iconKey() != null && !request.iconKey().isBlank()) {
            FoodIconKeys.requireAllowed(request.iconKey());
            food.changeIcon(request.iconKey(), now);
        }
        if (request.sessionEligible() != null) {
            food.setSessionEligible(request.sessionEligible(), now);
        }
        if (request.liked() != null
                || request.texture() != null
                || request.tasteNote() != null) {
            FoodLiked liked = request.liked() != null ? request.liked() : food.getLiked();
            FoodTexture texture =
                    request.texture() != null ? request.texture() : food.getTexture();
            String tasteNote =
                    request.tasteNote() != null
                            ? normalizeTasteNote(request.tasteNote())
                            : food.getTasteNote();
            food.setPreferences(liked, texture, tasteNote, now);
        }
        return toResponse(foods.save(food));
    }

    @Transactional
    public FoodResponse archive(UUID householdId, UUID foodId) {
        Food food = requireHouseholdFood(householdId, foodId);
        food.archive(clock.instant());
        return toResponse(foods.save(food));
    }

    private void requireUniqueVisibleName(UUID householdId, String name, UUID excludeId) {
        if (foods.existsVisibleName(householdId, name, excludeId)) {
            throw new DuplicateFoodNameException(name);
        }
    }

    private Food requireHouseholdFood(UUID householdId, UUID foodId) {
        Food food = foods.findById(foodId).orElseThrow(FoodNotFoundException::new);
        if (food.isSystem()) {
            throw new SystemFoodImmutableException();
        }
        if (!householdId.equals(food.getHouseholdId())) {
            throw new FoodNotFoundException();
        }
        return food;
    }

    static String normalizeTasteNote(String note) {
        if (note == null) {
            return null;
        }
        String trimmed = note.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > TASTE_NOTE_MAX) {
            throw new InvalidFoodPreferenceException(
                    "Taste note must be at most " + TASTE_NOTE_MAX + " characters");
        }
        return trimmed;
    }

    private static FoodResponse toResponse(Food food) {
        return new FoodResponse(
                food.getId(),
                food.getName(),
                food.getIconKey(),
                food.getHouseholdId(),
                food.isSystem(),
                food.isSessionEligible(),
                food.getLiked(),
                food.getTexture(),
                food.getTasteNote(),
                food.getArchivedAt());
    }
}
