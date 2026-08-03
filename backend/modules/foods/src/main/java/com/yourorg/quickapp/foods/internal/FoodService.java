package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.CreateFoodRequest;
import com.yourorg.quickapp.foods.DuplicateFoodNameException;
import com.yourorg.quickapp.foods.ExposureSource;
import com.yourorg.quickapp.foods.FoodExposureResponse;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.foods.FoodIconKeys;
import com.yourorg.quickapp.foods.FoodIllustrationStore;
import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodNotFoundException;
import com.yourorg.quickapp.foods.FoodResponse;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.InvalidFoodPreferenceException;
import com.yourorg.quickapp.foods.SystemFoodImmutableException;
import com.yourorg.quickapp.foods.UpdateFoodRequest;
import com.yourorg.quickapp.foods.UpsertFoodExposureRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FoodService {

    private static final int TASTE_NOTE_MAX = 100;
    private static final int VARIANT_KEY_MAX = 200;

    private final FoodRepository foods;
    private final HouseholdFoodExposureRepository exposures;
    private final FoodIllustrationStore illustrations;
    private final Clock clock;

    FoodService(
            FoodRepository foods,
            HouseholdFoodExposureRepository exposures,
            FoodIllustrationStore illustrations,
            Clock clock) {
        this.foods = foods;
        this.exposures = exposures;
        this.illustrations = illustrations;
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
        Map<String, String> urls =
                illustrations.findPublicUrls(result.stream().map(Food::getIconKey).toList());
        Map<UUID, List<FoodExposureResponse>> byFood = exposuresByFood(householdId);
        return result.stream()
                .map(
                        food ->
                                toResponse(
                                        food,
                                        urls.get(food.getIconKey()),
                                        byFood.getOrDefault(food.getId(), List.of())))
                .toList();
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
        Food saved = foods.save(food);
        if (!saved.isSessionEligible()) {
            upsertSafeEmptyVariant(householdId, saved.getId(), now);
        }
        return toResponse(saved);
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
        Food saved = foods.save(food);
        if (!saved.isSessionEligible()) {
            upsertSafeEmptyVariant(householdId, saved.getId(), now);
        }
        return toResponse(saved);
    }

    @Transactional
    public FoodResponse archive(UUID householdId, UUID foodId) {
        Food food = requireHouseholdFood(householdId, foodId);
        food.archive(clock.instant());
        return toResponse(foods.save(food));
    }

    @Transactional
    public FoodExposureResponse upsertExposure(
            UUID householdId, UUID foodId, UpsertFoodExposureRequest request) {
        requireVisibleFood(householdId, foodId);
        String variantKey = normalizeVariantKey(request.variantKey());
        Instant now = clock.instant();
        HouseholdFoodExposure row =
                exposures
                        .findByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, variantKey)
                        .orElseGet(
                                () ->
                                        HouseholdFoodExposure.create(
                                                householdId,
                                                foodId,
                                                variantKey,
                                                request.familiarity(),
                                                ExposureSource.manual,
                                                now));
        row.updateFamiliarity(request.familiarity(), ExposureSource.manual, now);
        return toExposureResponse(exposures.save(row));
    }

    @Transactional
    public void clearExposure(UUID householdId, UUID foodId, String variantKeyRaw) {
        requireVisibleFood(householdId, foodId);
        String variantKey = normalizeVariantKey(variantKeyRaw);
        exposures.deleteByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, variantKey);
    }

    private void upsertSafeEmptyVariant(UUID householdId, UUID foodId, Instant now) {
        HouseholdFoodExposure row =
                exposures
                        .findByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, "")
                        .orElseGet(
                                () ->
                                        HouseholdFoodExposure.create(
                                                householdId,
                                                foodId,
                                                "",
                                                FoodFamiliarity.safe,
                                                ExposureSource.manual,
                                                now));
        row.updateFamiliarity(FoodFamiliarity.safe, ExposureSource.manual, now);
        exposures.save(row);
    }

    private Map<UUID, List<FoodExposureResponse>> exposuresByFood(UUID householdId) {
        return exposures.findByHouseholdId(householdId).stream()
                .map(FoodService::toExposureResponse)
                .collect(
                        Collectors.groupingBy(
                                FoodExposureResponse::foodId,
                                Collectors.collectingAndThen(
                                        Collectors.toList(),
                                        list ->
                                                list.stream()
                                                        .sorted(
                                                                Comparator.comparing(
                                                                        FoodExposureResponse
                                                                                ::variantKey))
                                                        .toList())));
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

    /** System starters or this household's foods (including archived). */
    private Food requireVisibleFood(UUID householdId, UUID foodId) {
        Food food = foods.findById(foodId).orElseThrow(FoodNotFoundException::new);
        if (food.isSystem()) {
            return food;
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

    static String normalizeVariantKey(String raw) {
        if (raw == null) {
            return "";
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() > VARIANT_KEY_MAX) {
            throw new InvalidFoodPreferenceException(
                    "Variant note must be at most " + VARIANT_KEY_MAX + " characters");
        }
        return normalized;
    }

    private FoodResponse toResponse(Food food) {
        if (food.getHouseholdId() == null) {
            return toResponse(
                    food, illustrations.findPublicUrl(food.getIconKey()).orElse(null), List.of());
        }
        List<FoodExposureResponse> foodExposures =
                exposures.findByHouseholdIdAndFoodId(food.getHouseholdId(), food.getId()).stream()
                        .map(FoodService::toExposureResponse)
                        .sorted(Comparator.comparing(FoodExposureResponse::variantKey))
                        .toList();
        return toResponse(
                food,
                illustrations.findPublicUrl(food.getIconKey()).orElse(null),
                foodExposures);
    }

    private static FoodResponse toResponse(
            Food food, String iconUrl, List<FoodExposureResponse> foodExposures) {
        return new FoodResponse(
                food.getId(),
                food.getName(),
                food.getIconKey(),
                iconUrl,
                food.getHouseholdId(),
                food.isSystem(),
                food.isSessionEligible(),
                food.getLiked(),
                food.getTexture(),
                food.getTasteNote(),
                food.getArchivedAt(),
                foodExposures);
    }

    private static FoodExposureResponse toExposureResponse(HouseholdFoodExposure row) {
        return new FoodExposureResponse(
                row.getFoodId(), row.getVariantKey(), row.getFamiliarity(), row.getSource());
    }
}
