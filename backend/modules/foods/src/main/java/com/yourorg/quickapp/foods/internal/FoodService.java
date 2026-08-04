package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.BootstrapSafeItemRequest;
import com.yourorg.quickapp.foods.BootstrapSafesRequest;
import com.yourorg.quickapp.foods.CreateFoodRequest;
import com.yourorg.quickapp.foods.CreateStretchTargetRequest;
import com.yourorg.quickapp.foods.DuplicateFoodNameException;
import com.yourorg.quickapp.foods.DuplicateStretchTargetException;
import com.yourorg.quickapp.foods.ExposureSource;
import com.yourorg.quickapp.foods.FoodExposureResponse;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.foods.FoodIconKeys;
import com.yourorg.quickapp.foods.FoodIllustrationStore;
import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodNotFoundException;
import com.yourorg.quickapp.foods.FoodResponse;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.InvalidBootstrapSafesException;
import com.yourorg.quickapp.foods.InvalidFoodPreferenceException;
import com.yourorg.quickapp.foods.InvalidStretchTargetException;
import com.yourorg.quickapp.foods.SessionCompletedEvent;
import com.yourorg.quickapp.foods.SessionCompletedFood;
import com.yourorg.quickapp.foods.StretchTargetResponse;
import com.yourorg.quickapp.foods.SystemFoodImmutableException;
import com.yourorg.quickapp.foods.UpdateFoodRequest;
import com.yourorg.quickapp.foods.UpsertFoodExposureRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FoodService {

    private static final int TASTE_NOTE_MAX = 100;
    private static final int VARIANT_KEY_MAX = 200;
    private static final int BOOTSTRAP_SAFES_MAX = 10;
    static final int STRETCH_TARGETS_MAX = 5;

    private final FoodRepository foods;
    private final HouseholdFoodExposureRepository exposures;
    private final HouseholdStretchTargetRepository stretchTargets;
    private final FoodIllustrationStore illustrations;
    private final Clock clock;

    FoodService(
            FoodRepository foods,
            HouseholdFoodExposureRepository exposures,
            HouseholdStretchTargetRepository stretchTargets,
            FoodIllustrationStore illustrations,
            Clock clock) {
        this.foods = foods;
        this.exposures = exposures;
        this.stretchTargets = stretchTargets;
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
            upsertSafe(householdId, saved.getId(), "", ExposureSource.manual, now);
        }
        return toResponse(saved);
    }

    @Transactional
    public List<FoodExposureResponse> bootstrapSafes(
            UUID householdId, BootstrapSafesRequest request) {
        List<BootstrapSafeItemRequest> items =
                request.items() == null ? List.of() : request.items();
        if (items.size() > BOOTSTRAP_SAFES_MAX) {
            throw new InvalidBootstrapSafesException(
                    "At most " + BOOTSTRAP_SAFES_MAX + " safe foods can be bootstrapped");
        }
        Set<String> seen = new HashSet<>();
        Instant now = clock.instant();
        List<FoodExposureResponse> results = new ArrayList<>(items.size());
        for (BootstrapSafeItemRequest item : items) {
            String name = item.name().trim();
            if (name.isEmpty()) {
                throw new InvalidBootstrapSafesException("Food name is required");
            }
            String variantKey = normalizeVariantKey(item.variantKey());
            String dedupeKey = name.toLowerCase(Locale.ROOT) + "\0" + variantKey;
            if (!seen.add(dedupeKey)) {
                throw new InvalidBootstrapSafesException(
                        "Duplicate safe food in request: " + name);
            }
            boolean sessionEligible =
                    item.sessionEligible() == null || item.sessionEligible();
            Food food =
                    foods.findFirstByHouseholdIdIsNullAndNameIgnoreCase(name)
                            .orElseGet(() -> inventHouseholdFood(householdId, name, sessionEligible, now));
            results.add(
                    upsertSafe(householdId, food.getId(), variantKey, ExposureSource.signup, now));
        }
        return results;
    }

    /**
     * Applies locked v1 outcome → exposure rules for a completed tasting
     * session. Never auto-downgrades {@code safe}.
     */
    @Transactional
    public void applySessionCompleted(SessionCompletedEvent event) {
        Instant now = clock.instant();
        for (SessionCompletedFood food : event.foods()) {
            applyOutcomeExposure(
                    event.householdId(),
                    food.foodId(),
                    food.variantNote(),
                    food.liked(),
                    food.ateEnough(),
                    event.scheduledOn(),
                    now);
        }
    }

    private void applyOutcomeExposure(
            UUID householdId,
            UUID foodId,
            String variantNote,
            String liked,
            boolean ateEnough,
            LocalDate triedOn,
            Instant now) {
        requireVisibleFood(householdId, foodId);
        String variantKey = normalizeVariantKey(variantNote);
        HouseholdFoodExposure row =
                exposures
                        .findByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, variantKey)
                        .orElse(null);
        boolean alreadySafe = row != null && row.getFamiliarity() == FoodFamiliarity.safe;
        if (!alreadySafe) {
            FoodFamiliarity target =
                    "like".equals(liked) && ateEnough
                            ? FoodFamiliarity.safe
                            : FoodFamiliarity.retrying;
            if (row == null) {
                row =
                        HouseholdFoodExposure.create(
                                householdId,
                                foodId,
                                variantKey,
                                target,
                                ExposureSource.outcome,
                                now);
            } else {
                row.updateFamiliarity(target, ExposureSource.outcome, now);
            }
        }
        row.recordAttempt(triedOn, liked, now);
        exposures.save(row);
    }

    private Food inventHouseholdFood(
            UUID householdId, String name, boolean sessionEligible, Instant now) {
        requireUniqueVisibleName(householdId, name, null);
        String iconKey = FoodIconKeys.customFromName(name);
        FoodIconKeys.requireAllowed(iconKey);
        Food food = Food.household(householdId, name, iconKey, now);
        food.setSessionEligible(sessionEligible, now);
        return foods.save(food);
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
            upsertSafe(householdId, saved.getId(), "", ExposureSource.manual, now);
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
        return upsertSafe(householdId, foodId, variantKey, ExposureSource.manual, now, request.familiarity());
    }

    @Transactional
    public void clearExposure(UUID householdId, UUID foodId, String variantKeyRaw) {
        requireVisibleFood(householdId, foodId);
        String variantKey = normalizeVariantKey(variantKeyRaw);
        exposures.deleteByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, variantKey);
    }

    @Transactional(readOnly = true)
    public List<StretchTargetResponse> listStretchTargets(UUID householdId) {
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
        List<StretchTargetResponse> result = new ArrayList<>();
        for (HouseholdStretchTarget row : rows) {
            Food food = foodById.get(row.getFoodId());
            if (food == null) {
                continue;
            }
            result.add(toStretchTargetResponse(row, food));
        }
        result.sort(
                Comparator.comparing(StretchTargetResponse::foodName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(StretchTargetResponse::variantKey));
        return List.copyOf(result);
    }

    @Transactional
    public StretchTargetResponse addStretchTarget(
            UUID householdId, CreateStretchTargetRequest request) {
        if (stretchTargets.countByHouseholdId(householdId) >= STRETCH_TARGETS_MAX) {
            throw new InvalidStretchTargetException(
                    "At most " + STRETCH_TARGETS_MAX + " stretch targets can be active");
        }
        Instant now = clock.instant();
        Food food = resolveStretchTargetFood(householdId, request, now);
        if (!food.isSessionEligible()) {
            throw new InvalidStretchTargetException(
                    "Stretch targets must be tasting foods (not snacks)");
        }
        String variantKey = normalizeVariantKey(request.variantKey());
        if (stretchTargets
                .findByHouseholdIdAndFoodIdAndVariantKey(householdId, food.getId(), variantKey)
                .isPresent()) {
            throw new DuplicateStretchTargetException();
        }
        HouseholdStretchTarget saved =
                stretchTargets.save(
                        HouseholdStretchTarget.create(householdId, food.getId(), variantKey, now));
        return toStretchTargetResponse(saved, food);
    }

    @Transactional
    public void removeStretchTarget(UUID householdId, UUID foodId, String variantKeyRaw) {
        requireVisibleFood(householdId, foodId);
        String variantKey = normalizeVariantKey(variantKeyRaw);
        if (stretchTargets
                .findByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, variantKey)
                .isEmpty()) {
            throw new FoodNotFoundException();
        }
        stretchTargets.deleteByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, variantKey);
    }

    private Food resolveStretchTargetFood(
            UUID householdId, CreateStretchTargetRequest request, Instant now) {
        boolean hasFoodId = request.foodId() != null;
        String name = request.name() == null ? "" : request.name().trim();
        boolean hasName = !name.isEmpty();
        if (hasFoodId == hasName) {
            throw new InvalidStretchTargetException(
                    "Provide either foodId or name (not both, not neither)");
        }
        if (hasFoodId) {
            return requireVisibleFood(householdId, request.foodId());
        }
        return foods.findFirstByHouseholdIdIsNullAndNameIgnoreCase(name)
                .or(() -> foods.findFirstByHouseholdIdAndArchivedAtIsNullAndNameIgnoreCase(
                        householdId, name))
                .orElseGet(() -> inventHouseholdFood(householdId, name, true, now));
    }

    private static StretchTargetResponse toStretchTargetResponse(
            HouseholdStretchTarget row, Food food) {
        return new StretchTargetResponse(
                row.getId(), food.getId(), food.getName(), row.getVariantKey(), row.getCreatedAt());
    }

    private FoodExposureResponse upsertSafe(
            UUID householdId,
            UUID foodId,
            String variantKey,
            ExposureSource source,
            Instant now) {
        return upsertSafe(householdId, foodId, variantKey, source, now, FoodFamiliarity.safe);
    }

    private FoodExposureResponse upsertSafe(
            UUID householdId,
            UUID foodId,
            String variantKey,
            ExposureSource source,
            Instant now,
            FoodFamiliarity familiarity) {
        HouseholdFoodExposure row =
                exposures
                        .findByHouseholdIdAndFoodIdAndVariantKey(householdId, foodId, variantKey)
                        .orElseGet(
                                () ->
                                        HouseholdFoodExposure.create(
                                                householdId,
                                                foodId,
                                                variantKey,
                                                familiarity,
                                                source,
                                                now));
        row.updateFamiliarity(familiarity, source, now);
        return toExposureResponse(exposures.save(row));
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
                row.getFoodId(),
                row.getVariantKey(),
                row.getFamiliarity(),
                row.getSource(),
                row.getAttemptCount(),
                row.getLastTriedOn(),
                row.getLastLiked());
    }
}
