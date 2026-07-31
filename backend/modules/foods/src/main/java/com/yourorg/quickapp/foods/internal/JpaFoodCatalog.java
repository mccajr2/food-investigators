package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.foods.FoodIllustrationStore;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class JpaFoodCatalog implements FoodCatalog {

    private final FoodRepository foods;
    private final FoodIllustrationStore illustrations;

    JpaFoodCatalog(FoodRepository foods, FoodIllustrationStore illustrations) {
        this.foods = foods;
        this.illustrations = illustrations;
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

    @Override
    @Transactional(readOnly = true)
    public List<CatalogFood> listSelectable(UUID householdId) {
        List<Food> rows = new java.util.ArrayList<>();
        foods.findByHouseholdIdIsNullOrderByNameAsc().stream()
                .filter(food -> !food.isArchived())
                .filter(Food::isSessionEligible)
                .forEach(rows::add);
        foods.findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(householdId).stream()
                .filter(Food::isSessionEligible)
                .forEach(rows::add);
        Map<String, String> urls =
                illustrations.findPublicUrls(rows.stream().map(Food::getIconKey).toList());
        return rows.stream()
                .map(food -> toCatalog(food, urls.get(food.getIconKey())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SnackPreferenceSnapshot> listActiveSnackPreferences(UUID householdId) {
        return foods
                .findByHouseholdIdAndSessionEligibleFalseAndArchivedAtIsNullOrderByNameAsc(
                        householdId)
                .stream()
                .map(food -> new SnackPreferenceSnapshot(food.getLiked(), food.getTexture()))
                .toList();
    }

    private CatalogFood toCatalog(Food food) {
        return toCatalog(
                food, illustrations.findPublicUrl(food.getIconKey()).orElse(null));
    }

    private static CatalogFood toCatalog(Food food, String iconUrl) {
        return new CatalogFood(food.getId(), food.getName(), food.getIconKey(), iconUrl);
    }
}
