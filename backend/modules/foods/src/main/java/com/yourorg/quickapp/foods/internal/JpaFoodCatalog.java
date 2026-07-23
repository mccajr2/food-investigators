package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class JpaFoodCatalog implements FoodCatalog {

    private final FoodRepository foods;

    JpaFoodCatalog(FoodRepository foods) {
        this.foods = foods;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CatalogFood> findVisible(UUID householdId, UUID foodId) {
        return foods.findById(foodId)
                .filter(food -> food.isSystem() || householdId.equals(food.getHouseholdId()))
                .map(this::toCatalog);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CatalogFood> findSelectable(UUID householdId, UUID foodId) {
        return foods.findById(foodId)
                .filter(food -> !food.isArchived())
                .filter(Food::isSessionEligible)
                .filter(food -> food.isSystem() || householdId.equals(food.getHouseholdId()))
                .map(this::toCatalog);
    }

    private CatalogFood toCatalog(Food food) {
        return new CatalogFood(food.getId(), food.getName(), food.getIconKey());
    }
}
