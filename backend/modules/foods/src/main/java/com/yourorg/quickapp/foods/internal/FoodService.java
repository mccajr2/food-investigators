package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.CreateFoodRequest;
import com.yourorg.quickapp.foods.FoodIconKeys;
import com.yourorg.quickapp.foods.FoodNotFoundException;
import com.yourorg.quickapp.foods.FoodResponse;
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
        Instant now = clock.instant();
        Food food =
                foods.save(
                        Food.household(
                                householdId, request.name().trim(), request.iconKey(), now));
        return toResponse(food);
    }

    @Transactional
    public FoodResponse update(UUID householdId, UUID foodId, UpdateFoodRequest request) {
        Food food = requireHouseholdFood(householdId, foodId);
        Instant now = clock.instant();
        if (request.name() != null && !request.name().isBlank()) {
            food.rename(request.name().trim(), now);
        }
        if (request.iconKey() != null && !request.iconKey().isBlank()) {
            FoodIconKeys.requireAllowed(request.iconKey());
            food.changeIcon(request.iconKey(), now);
        }
        return toResponse(foods.save(food));
    }

    @Transactional
    public FoodResponse archive(UUID householdId, UUID foodId) {
        Food food = requireHouseholdFood(householdId, foodId);
        food.archive(clock.instant());
        return toResponse(foods.save(food));
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

    private static FoodResponse toResponse(Food food) {
        return new FoodResponse(
                food.getId(),
                food.getName(),
                food.getIconKey(),
                food.getHouseholdId(),
                food.isSystem(),
                food.getArchivedAt());
    }
}
