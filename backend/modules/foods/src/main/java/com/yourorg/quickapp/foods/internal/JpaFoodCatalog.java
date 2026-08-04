package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.foods.FoodIllustrationStore;
import com.yourorg.quickapp.foods.SafeExposureSnapshot;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.foods.StretchTargetSnapshot;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class JpaFoodCatalog implements FoodCatalog {

    static final int MAX_SAFE_EXPOSURES = 20;

    private final FoodRepository foods;
    private final HouseholdFoodExposureRepository exposures;
    private final HouseholdStretchTargetRepository stretchTargets;
    private final FoodIllustrationStore illustrations;

    JpaFoodCatalog(
            FoodRepository foods,
            HouseholdFoodExposureRepository exposures,
            HouseholdStretchTargetRepository stretchTargets,
            FoodIllustrationStore illustrations) {
        this.foods = foods;
        this.exposures = exposures;
        this.stretchTargets = stretchTargets;
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
        List<Food> rows = new ArrayList<>();
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

    @Override
    @Transactional(readOnly = true)
    public List<SafeExposureSnapshot> listSafeExposures(UUID householdId) {
        List<HouseholdFoodExposure> safeRows =
                exposures.findByHouseholdId(householdId).stream()
                        .filter(row -> row.getFamiliarity() == FoodFamiliarity.safe)
                        .toList();
        if (safeRows.isEmpty()) {
            return List.of();
        }
        Map<UUID, Food> foodById =
                foods.findAllById(
                                safeRows.stream()
                                        .map(HouseholdFoodExposure::getFoodId)
                                        .distinct()
                                        .toList())
                        .stream()
                        .collect(Collectors.toMap(Food::getId, Function.identity()));
        List<SafeExposureSnapshot> result = new ArrayList<>();
        for (HouseholdFoodExposure row : safeRows) {
            Food food = foodById.get(row.getFoodId());
            if (food == null) {
                continue;
            }
            if (!food.isSystem() && !householdId.equals(food.getHouseholdId())) {
                continue;
            }
            result.add(
                    new SafeExposureSnapshot(food.getId(), food.getName(), row.getVariantKey()));
        }
        result.sort(
                Comparator.comparing(SafeExposureSnapshot::foodName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(SafeExposureSnapshot::variantKey));
        if (result.size() > MAX_SAFE_EXPOSURES) {
            return List.copyOf(result.subList(0, MAX_SAFE_EXPOSURES));
        }
        return List.copyOf(result);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StretchTargetSnapshot> listStretchTargets(UUID householdId) {
        List<HouseholdStretchTarget> rows = stretchTargets.findByHouseholdId(householdId);
        if (rows.isEmpty()) {
            return List.of();
        }
        Map<UUID, Food> foodById =
                foods.findAllById(
                                rows.stream()
                                        .map(HouseholdStretchTarget::getFoodId)
                                        .distinct()
                                        .toList())
                        .stream()
                        .collect(Collectors.toMap(Food::getId, Function.identity()));
        List<StretchTargetSnapshot> result = new ArrayList<>();
        for (HouseholdStretchTarget row : rows) {
            Food food = foodById.get(row.getFoodId());
            if (food == null) {
                continue;
            }
            if (!food.isSystem() && !householdId.equals(food.getHouseholdId())) {
                continue;
            }
            result.add(
                    new StretchTargetSnapshot(food.getId(), food.getName(), row.getVariantKey()));
        }
        result.sort(
                Comparator.comparing(StretchTargetSnapshot::foodName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(StretchTargetSnapshot::variantKey));
        return List.copyOf(result);
    }

    private CatalogFood toCatalog(Food food) {
        return toCatalog(food, illustrations.findPublicUrl(food.getIconKey()).orElse(null));
    }

    private static CatalogFood toCatalog(Food food, String iconUrl) {
        return new CatalogFood(food.getId(), food.getName(), food.getIconKey(), iconUrl);
    }
}
