package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.BootstrapSafeItemRequest;
import com.yourorg.quickapp.foods.BootstrapSafesRequest;
import com.yourorg.quickapp.foods.CreateFoodRequest;
import com.yourorg.quickapp.foods.DuplicateFoodNameException;
import com.yourorg.quickapp.foods.ExposureSource;
import com.yourorg.quickapp.foods.FoodExposureResponse;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.foods.FoodIllustrationStore;
import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodNotFoundException;
import com.yourorg.quickapp.foods.FoodResponse;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.InvalidBootstrapSafesException;
import com.yourorg.quickapp.foods.InvalidFoodIconKeyException;
import com.yourorg.quickapp.foods.InvalidFoodPreferenceException;
import com.yourorg.quickapp.foods.SessionCompletedEvent;
import com.yourorg.quickapp.foods.SessionCompletedFood;
import com.yourorg.quickapp.foods.SystemFoodImmutableException;
import com.yourorg.quickapp.foods.UpdateFoodRequest;
import com.yourorg.quickapp.foods.UpsertFoodExposureRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    @Mock
    private FoodRepository foods;

    @Mock
    private HouseholdFoodExposureRepository exposures;

    @Mock
    private FoodIllustrationStore illustrations;

    private FoodService service;
    private final Instant now = Instant.parse("2026-07-14T00:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        service = new FoodService(foods, exposures, illustrations, Clock.fixed(now, ZoneOffset.UTC));
        org.mockito.Mockito.lenient()
                .when(illustrations.findPublicUrl(any()))
                .thenReturn(Optional.empty());
        org.mockito.Mockito.lenient()
                .when(illustrations.findPublicUrls(any()))
                .thenReturn(Map.of());
        org.mockito.Mockito.lenient()
                .when(exposures.findByHouseholdId(householdId))
                .thenReturn(List.of());
        org.mockito.Mockito.lenient()
                .when(exposures.findByHouseholdIdAndFoodId(eq(householdId), any()))
                .thenReturn(List.of());
        org.mockito.Mockito.lenient()
                .when(exposures.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void listIncludesIconUrlWhenIllustrationExists() {
        Food mine = Food.household(householdId, "Cucumber", "custom_cucumber", now);
        when(foods.findByHouseholdIdIsNullOrderByNameAsc()).thenReturn(List.of());
        when(foods.findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(householdId))
                .thenReturn(List.of(mine));
        when(illustrations.findPublicUrls(any()))
                .thenReturn(
                        Map.of(
                                "custom_cucumber",
                                "http://127.0.0.1/food-illustrations/illustrations/custom_cucumber.png"));

        List<FoodResponse> listed = service.list(householdId, false);

        assertThat(listed).hasSize(1);
        assertThat(listed.get(0).iconUrl())
                .isEqualTo(
                        "http://127.0.0.1/food-illustrations/illustrations/custom_cucumber.png");
        assertThat(listed.get(0).exposures()).isEmpty();
    }

    @Test
    void listMergesSystemAndActiveHouseholdFoodsWithExposures() {
        Food system = Food.system(UUID.randomUUID(), "Apples", "apple", now);
        Food mine = Food.household(householdId, "My mash", "sweet_potato", now);
        when(foods.findByHouseholdIdIsNullOrderByNameAsc()).thenReturn(List.of(system));
        when(foods.findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(householdId))
                .thenReturn(List.of(mine));
        HouseholdFoodExposure overlay =
                HouseholdFoodExposure.create(
                        householdId,
                        system.getId(),
                        "bagelsaurus",
                        FoodFamiliarity.safe,
                        ExposureSource.manual,
                        now);
        when(exposures.findByHouseholdId(householdId)).thenReturn(List.of(overlay));

        List<FoodResponse> listed = service.list(householdId, false);

        assertThat(listed).extracting(FoodResponse::name).containsExactly("Apples", "My mash");
        assertThat(listed.get(0).exposures()).hasSize(1);
        assertThat(listed.get(0).exposures().get(0).variantKey()).isEqualTo("bagelsaurus");
        assertThat(listed.get(0).exposures().get(0).familiarity()).isEqualTo(FoodFamiliarity.safe);
        assertThat(listed.get(1).exposures()).isEmpty();
    }

    @Test
    void createRejectsInvalidIcon() {
        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateFoodRequest(
                                                "Soup", "nope", null, null, null, null)))
                .isInstanceOf(InvalidFoodIconKeyException.class);
    }

    @Test
    void createPersistsHouseholdFood() {
        when(foods.existsVisibleName(householdId, "Extra apple", null)).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        FoodResponse created =
                service.create(
                        householdId,
                        new CreateFoodRequest(
                                "  Extra apple  ", "apple", null, null, null, null));

        assertThat(created.name()).isEqualTo("Extra apple");
        assertThat(created.iconKey()).isEqualTo("apple");
        assertThat(created.system()).isFalse();
        assertThat(created.householdId()).isEqualTo(householdId);
        assertThat(created.sessionEligible()).isTrue();
        assertThat(created.exposures()).isEmpty();
        verify(exposures, never()).save(any());

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foods).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Extra apple");
    }

    @Test
    void createPersistsSnackWithSafeExposure() {
        when(foods.existsVisibleName(householdId, "Salt chips", null)).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(eq(householdId), any(), eq("")))
                .thenReturn(Optional.empty());
        when(exposures.findByHouseholdIdAndFoodId(eq(householdId), any()))
                .thenAnswer(
                        invocation -> {
                            UUID foodId = invocation.getArgument(1);
                            return List.of(
                                    HouseholdFoodExposure.create(
                                            householdId,
                                            foodId,
                                            "",
                                            FoodFamiliarity.safe,
                                            ExposureSource.manual,
                                            now));
                        });

        FoodResponse created =
                service.create(
                        householdId,
                        new CreateFoodRequest(
                                "Salt chips",
                                "custom_chips",
                                false,
                                FoodLiked.like,
                                FoodTexture.crunchy,
                                "  salt & vinegar  "));

        assertThat(created.sessionEligible()).isFalse();
        assertThat(created.liked()).isEqualTo(FoodLiked.like);
        assertThat(created.exposures()).hasSize(1);
        assertThat(created.exposures().get(0).variantKey()).isEqualTo("");
        assertThat(created.exposures().get(0).familiarity()).isEqualTo(FoodFamiliarity.safe);

        ArgumentCaptor<HouseholdFoodExposure> exposureCaptor =
                ArgumentCaptor.forClass(HouseholdFoodExposure.class);
        verify(exposures).save(exposureCaptor.capture());
        assertThat(exposureCaptor.getValue().getVariantKey()).isEqualTo("");
        assertThat(exposureCaptor.getValue().getFamiliarity()).isEqualTo(FoodFamiliarity.safe);
    }

    @Test
    void createRejectsTasteNoteOverMax() {
        when(foods.existsVisibleName(householdId, "Chips", null)).thenReturn(false);
        String tooLong = "x".repeat(101);

        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateFoodRequest(
                                                "Chips",
                                                "apple",
                                                false,
                                                FoodLiked.like,
                                                null,
                                                tooLong)))
                .isInstanceOf(InvalidFoodPreferenceException.class)
                .hasMessageContaining("100");
    }

    @Test
    void createRejectsDuplicateVisibleName() {
        when(foods.existsVisibleName(householdId, "watermelon", null)).thenReturn(true);

        assertThatThrownBy(
                        () ->
                                service.create(
                                        householdId,
                                        new CreateFoodRequest(
                                                "watermelon", "apple", null, null, null, null)))
                .isInstanceOf(DuplicateFoodNameException.class);
    }

    @Test
    void updateRejectsRenameToDuplicateVisibleName() {
        Food mine = Food.household(householdId, "My mash", "apple", now);
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));
        when(foods.existsVisibleName(householdId, "Apples", mine.getId())).thenReturn(true);

        assertThatThrownBy(
                        () ->
                                service.update(
                                        householdId,
                                        mine.getId(),
                                        new UpdateFoodRequest(
                                                "Apples", null, null, null, null, null)))
                .isInstanceOf(DuplicateFoodNameException.class);
    }

    @Test
    void updateAllowsKeepingSameName() {
        Food mine = Food.household(householdId, "My mash", "apple", now);
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));
        when(foods.existsVisibleName(householdId, "My mash", mine.getId())).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        FoodResponse updated =
                service.update(
                        householdId,
                        mine.getId(),
                        new UpdateFoodRequest("My mash", "banana", null, null, null, null));

        assertThat(updated.name()).isEqualTo("My mash");
        assertThat(updated.iconKey()).isEqualTo("banana");
    }

    @Test
    void updateMarksSnackAndSafeExposure() {
        Food mine = Food.household(householdId, "Chips", "apple", now);
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(householdId, mine.getId(), ""))
                .thenReturn(Optional.empty());
        when(exposures.findByHouseholdIdAndFoodId(householdId, mine.getId()))
                .thenReturn(
                        List.of(
                                HouseholdFoodExposure.create(
                                        householdId,
                                        mine.getId(),
                                        "",
                                        FoodFamiliarity.safe,
                                        ExposureSource.manual,
                                        now)));

        FoodResponse updated =
                service.update(
                        householdId,
                        mine.getId(),
                        new UpdateFoodRequest(
                                null,
                                null,
                                false,
                                FoodLiked.so_so,
                                FoodTexture.crunchy,
                                "bbq"));

        assertThat(updated.sessionEligible()).isFalse();
        assertThat(updated.exposures().get(0).familiarity()).isEqualTo(FoodFamiliarity.safe);
        verify(exposures).save(any());
    }

    @Test
    void updateAndArchiveRejectSystemFoods() {
        UUID systemId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
        Food system = Food.system(systemId, "Apples", "apple", now);
        when(foods.findById(systemId)).thenReturn(Optional.of(system));

        assertThatThrownBy(
                        () ->
                                service.update(
                                        householdId,
                                        systemId,
                                        new UpdateFoodRequest(
                                                "X", null, false, null, null, null)))
                .isInstanceOf(SystemFoodImmutableException.class);
        assertThatThrownBy(() -> service.archive(householdId, systemId))
                .isInstanceOf(SystemFoodImmutableException.class);
        assertThat(system.isSessionEligible()).isTrue();
    }

    @Test
    void updateRejectsOtherHouseholdFood() {
        UUID foodId = UUID.randomUUID();
        UUID otherHousehold = UUID.randomUUID();
        Food other = Food.household(otherHousehold, "Theirs", "banana", now);
        when(foods.findById(foodId)).thenReturn(Optional.of(other));

        assertThatThrownBy(
                        () ->
                                service.update(
                                        householdId,
                                        foodId,
                                        new UpdateFoodRequest(
                                                "Mine", null, null, null, null, null)))
                .isInstanceOf(FoodNotFoundException.class);
    }

    @Test
    void updateAndArchiveHouseholdFood() {
        Food mine = Food.household(householdId, "My mash", "apple", now);
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));
        when(foods.existsVisibleName(householdId, "Renamed", mine.getId())).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        FoodResponse updated =
                service.update(
                        householdId,
                        mine.getId(),
                        new UpdateFoodRequest(
                                "Renamed", "sweet_potato", null, null, null, null));
        assertThat(updated.name()).isEqualTo("Renamed");
        assertThat(updated.iconKey()).isEqualTo("sweet_potato");

        FoodResponse archived = service.archive(householdId, mine.getId());
        assertThat(archived.archivedAt()).isEqualTo(now);
    }

    @Test
    void upsertExposureNormalizesVariantAndAllowsSystemFood() {
        UUID systemId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
        Food system = Food.system(systemId, "Apples", "apple", now);
        when(foods.findById(systemId)).thenReturn(Optional.of(system));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(
                        householdId, systemId, "bagelsaurus"))
                .thenReturn(Optional.empty());

        FoodExposureResponse created =
                service.upsertExposure(
                        householdId,
                        systemId,
                        new UpsertFoodExposureRequest("  Bagelsaurus  ", FoodFamiliarity.safe));

        assertThat(created.foodId()).isEqualTo(systemId);
        assertThat(created.variantKey()).isEqualTo("bagelsaurus");
        assertThat(created.familiarity()).isEqualTo(FoodFamiliarity.safe);
        assertThat(created.source()).isEqualTo(ExposureSource.manual);
        assertThat(created.attemptCount()).isNull();
        assertThat(created.lastTriedOn()).isNull();
        assertThat(created.lastLiked()).isNull();
    }

    @Test
    void upsertExposureCollidesOnCaseFoldedVariant() {
        Food mine = Food.household(householdId, "Bagel", "apple", now);
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));
        HouseholdFoodExposure existing =
                HouseholdFoodExposure.create(
                        householdId,
                        mine.getId(),
                        "bagelsaurus",
                        FoodFamiliarity.truly_new,
                        ExposureSource.manual,
                        now);
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(
                        householdId, mine.getId(), "bagelsaurus"))
                .thenReturn(Optional.of(existing));

        FoodExposureResponse updated =
                service.upsertExposure(
                        householdId,
                        mine.getId(),
                        new UpsertFoodExposureRequest("BAGELSAURUS", FoodFamiliarity.safe));

        assertThat(updated.familiarity()).isEqualTo(FoodFamiliarity.safe);
        assertThat(existing.getFamiliarity()).isEqualTo(FoodFamiliarity.safe);
    }

    @Test
    void clearExposureDeletesRow() {
        Food mine = Food.household(householdId, "Bagel", "apple", now);
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));

        service.clearExposure(householdId, mine.getId(), " Bagelsaurus ");

        verify(exposures)
                .deleteByHouseholdIdAndFoodIdAndVariantKey(
                        householdId, mine.getId(), "bagelsaurus");
    }

    @Test
    void upsertExposureRejectsOtherHouseholdFood() {
        UUID foodId = UUID.randomUUID();
        Food other = Food.household(UUID.randomUUID(), "Theirs", "banana", now);
        when(foods.findById(foodId)).thenReturn(Optional.of(other));

        assertThatThrownBy(
                        () ->
                                service.upsertExposure(
                                        householdId,
                                        foodId,
                                        new UpsertFoodExposureRequest("", FoodFamiliarity.safe)))
                .isInstanceOf(FoodNotFoundException.class);
    }

    @Test
    void normalizeVariantKeyTrimsAndLowercases() {
        assertThat(FoodService.normalizeVariantKey("  Bagelsaurus  ")).isEqualTo("bagelsaurus");
        assertThat(FoodService.normalizeVariantKey(null)).isEqualTo("");
        assertThat(FoodService.normalizeVariantKey("   ")).isEqualTo("");
    }

    @Test
    void bootstrapSafesMatchesSystemStarterWithoutCreatingHouseholdFood() {
        UUID systemId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04");
        Food system = Food.system(systemId, "Apples", "apple", now);
        when(foods.findFirstByHouseholdIdIsNullAndNameIgnoreCase("Apples"))
                .thenReturn(Optional.of(system));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(householdId, systemId, "honeycrisp"))
                .thenReturn(Optional.empty());

        List<FoodExposureResponse> results =
                service.bootstrapSafes(
                        householdId,
                        new BootstrapSafesRequest(
                                List.of(
                                        new BootstrapSafeItemRequest(
                                                "  Apples  ", "Honeycrisp", true))));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).foodId()).isEqualTo(systemId);
        assertThat(results.get(0).variantKey()).isEqualTo("honeycrisp");
        assertThat(results.get(0).familiarity()).isEqualTo(FoodFamiliarity.safe);
        assertThat(results.get(0).source()).isEqualTo(ExposureSource.signup);
        verify(foods, never()).save(any());
    }

    @Test
    void bootstrapSafesInventsHouseholdFoodWithSignupExposure() {
        when(foods.findFirstByHouseholdIdIsNullAndNameIgnoreCase("Cucumber"))
                .thenReturn(Optional.empty());
        when(foods.existsVisibleName(householdId, "Cucumber", null)).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(eq(householdId), any(), eq("")))
                .thenReturn(Optional.empty());

        List<FoodExposureResponse> results =
                service.bootstrapSafes(
                        householdId,
                        new BootstrapSafesRequest(
                                List.of(new BootstrapSafeItemRequest("Cucumber", null, true))));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).familiarity()).isEqualTo(FoodFamiliarity.safe);
        assertThat(results.get(0).source()).isEqualTo(ExposureSource.signup);
        assertThat(results.get(0).variantKey()).isEqualTo("");

        ArgumentCaptor<Food> foodCaptor = ArgumentCaptor.forClass(Food.class);
        verify(foods).save(foodCaptor.capture());
        assertThat(foodCaptor.getValue().getName()).isEqualTo("Cucumber");
        assertThat(foodCaptor.getValue().getIconKey()).isEqualTo("custom_cucumber");
        assertThat(foodCaptor.getValue().isSessionEligible()).isTrue();
        assertThat(foodCaptor.getValue().getHouseholdId()).isEqualTo(householdId);
    }

    @Test
    void bootstrapSafesCreatesSnackAsNonSessionEligible() {
        when(foods.findFirstByHouseholdIdIsNullAndNameIgnoreCase("Goldfish"))
                .thenReturn(Optional.empty());
        when(foods.existsVisibleName(householdId, "Goldfish", null)).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(eq(householdId), any(), eq("")))
                .thenReturn(Optional.empty());

        service.bootstrapSafes(
                householdId,
                new BootstrapSafesRequest(
                        List.of(new BootstrapSafeItemRequest("Goldfish", "", false))));

        ArgumentCaptor<Food> foodCaptor = ArgumentCaptor.forClass(Food.class);
        verify(foods).save(foodCaptor.capture());
        assertThat(foodCaptor.getValue().isSessionEligible()).isFalse();

        ArgumentCaptor<HouseholdFoodExposure> exposureCaptor =
                ArgumentCaptor.forClass(HouseholdFoodExposure.class);
        verify(exposures).save(exposureCaptor.capture());
        assertThat(exposureCaptor.getValue().getSource()).isEqualTo(ExposureSource.signup);
        assertThat(exposureCaptor.getValue().getFamiliarity()).isEqualTo(FoodFamiliarity.safe);
    }

    @Test
    void bootstrapSafesRejectsMoreThanTenItems() {
        List<BootstrapSafeItemRequest> items = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            items.add(new BootstrapSafeItemRequest("Food " + i, null, true));
        }

        assertThatThrownBy(
                        () ->
                                service.bootstrapSafes(
                                        householdId, new BootstrapSafesRequest(items)))
                .isInstanceOf(InvalidBootstrapSafesException.class)
                .hasMessageContaining("10");
        verify(foods, never()).save(any());
    }

    @Test
    void bootstrapSafesRejectsDuplicateNameAndVariant() {
        when(foods.findFirstByHouseholdIdIsNullAndNameIgnoreCase("Bagel"))
                .thenReturn(Optional.empty());
        when(foods.existsVisibleName(householdId, "Bagel", null)).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(eq(householdId), any(), eq("bagelsaurus")))
                .thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                service.bootstrapSafes(
                                        householdId,
                                        new BootstrapSafesRequest(
                                                List.of(
                                                        new BootstrapSafeItemRequest(
                                                                "Bagel", "Bagelsaurus", true),
                                                        new BootstrapSafeItemRequest(
                                                                "bagel", "  BAGELSAURUS ", true)))))
                .isInstanceOf(InvalidBootstrapSafesException.class)
                .hasMessageContaining("Duplicate");
    }

    @Test
    void bootstrapSafesAllowsEmptyList() {
        List<FoodExposureResponse> results =
                service.bootstrapSafes(householdId, new BootstrapSafesRequest(List.of()));

        assertThat(results).isEmpty();
        verify(foods, never()).save(any());
        verify(exposures, never()).save(any());
    }

    @Test
    void applySessionCompletedPositiveTryCreatesSafeOutcome() {
        Food food = Food.household(householdId, "Carrot", "carrot", now);
        when(foods.findById(food.getId())).thenReturn(Optional.of(food));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(householdId, food.getId(), "steamed"))
                .thenReturn(Optional.empty());

        service.applySessionCompleted(
                new SessionCompletedEvent(
                        householdId,
                        UUID.randomUUID(),
                        java.time.LocalDate.of(2026, 8, 3),
                        List.of(
                                new SessionCompletedFood(
                                        food.getId(), "  Steamed ", "like", true))));

        ArgumentCaptor<HouseholdFoodExposure> captor =
                ArgumentCaptor.forClass(HouseholdFoodExposure.class);
        verify(exposures).save(captor.capture());
        HouseholdFoodExposure saved = captor.getValue();
        assertThat(saved.getFamiliarity()).isEqualTo(FoodFamiliarity.safe);
        assertThat(saved.getSource()).isEqualTo(ExposureSource.outcome);
        assertThat(saved.getVariantKey()).isEqualTo("steamed");
        assertThat(saved.getAttemptCount()).isEqualTo(1);
        assertThat(saved.getLastTriedOn()).isEqualTo(java.time.LocalDate.of(2026, 8, 3));
        assertThat(saved.getLastLiked()).isEqualTo("like");
    }

    @Test
    void applySessionCompletedDidNotLandCreatesRetrying() {
        Food food = Food.household(householdId, "Peas", "peas", now);
        when(foods.findById(food.getId())).thenReturn(Optional.of(food));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(householdId, food.getId(), ""))
                .thenReturn(Optional.empty());

        service.applySessionCompleted(
                new SessionCompletedEvent(
                        householdId,
                        UUID.randomUUID(),
                        java.time.LocalDate.of(2026, 8, 4),
                        List.of(new SessionCompletedFood(food.getId(), null, "no", true))));

        ArgumentCaptor<HouseholdFoodExposure> captor =
                ArgumentCaptor.forClass(HouseholdFoodExposure.class);
        verify(exposures).save(captor.capture());
        assertThat(captor.getValue().getFamiliarity()).isEqualTo(FoodFamiliarity.retrying);
        assertThat(captor.getValue().getSource()).isEqualTo(ExposureSource.outcome);
        assertThat(captor.getValue().getLastLiked()).isEqualTo("no");
    }

    @Test
    void applySessionCompletedLikeWithoutAteEnoughIsRetrying() {
        Food food = Food.household(householdId, "Broccoli", "broccoli", now);
        when(foods.findById(food.getId())).thenReturn(Optional.of(food));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(householdId, food.getId(), ""))
                .thenReturn(Optional.empty());

        service.applySessionCompleted(
                new SessionCompletedEvent(
                        householdId,
                        UUID.randomUUID(),
                        java.time.LocalDate.of(2026, 8, 5),
                        List.of(new SessionCompletedFood(food.getId(), "", "like", false))));

        ArgumentCaptor<HouseholdFoodExposure> captor =
                ArgumentCaptor.forClass(HouseholdFoodExposure.class);
        verify(exposures).save(captor.capture());
        assertThat(captor.getValue().getFamiliarity()).isEqualTo(FoodFamiliarity.retrying);
    }

    @Test
    void applySessionCompletedPreservesSafeOnBadOutcomeAndIncrementsAttempts() {
        Food food = Food.household(householdId, "Yogurt", "yogurt", now);
        HouseholdFoodExposure existing =
                HouseholdFoodExposure.create(
                        householdId,
                        food.getId(),
                        "",
                        FoodFamiliarity.safe,
                        ExposureSource.manual,
                        now);
        existing.recordAttempt(java.time.LocalDate.of(2026, 7, 1), "like", now);
        when(foods.findById(food.getId())).thenReturn(Optional.of(food));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(householdId, food.getId(), ""))
                .thenReturn(Optional.of(existing));

        service.applySessionCompleted(
                new SessionCompletedEvent(
                        householdId,
                        UUID.randomUUID(),
                        java.time.LocalDate.of(2026, 8, 6),
                        List.of(new SessionCompletedFood(food.getId(), "  ", "so_so", false))));

        ArgumentCaptor<HouseholdFoodExposure> captor =
                ArgumentCaptor.forClass(HouseholdFoodExposure.class);
        verify(exposures).save(captor.capture());
        HouseholdFoodExposure saved = captor.getValue();
        assertThat(saved.getFamiliarity()).isEqualTo(FoodFamiliarity.safe);
        assertThat(saved.getSource()).isEqualTo(ExposureSource.manual);
        assertThat(saved.getAttemptCount()).isEqualTo(2);
        assertThat(saved.getLastTriedOn()).isEqualTo(java.time.LocalDate.of(2026, 8, 6));
        assertThat(saved.getLastLiked()).isEqualTo("so_so");
    }

    @Test
    void applySessionCompletedProcessesBothFoods() {
        Food a = Food.household(householdId, "Apple", "apple", now);
        Food b = Food.household(householdId, "Banana", "banana", now);
        when(foods.findById(a.getId())).thenReturn(Optional.of(a));
        when(foods.findById(b.getId())).thenReturn(Optional.of(b));
        when(exposures.findByHouseholdIdAndFoodIdAndVariantKey(eq(householdId), any(), any()))
                .thenReturn(Optional.empty());

        service.applySessionCompleted(
                new SessionCompletedEvent(
                        householdId,
                        UUID.randomUUID(),
                        java.time.LocalDate.of(2026, 8, 7),
                        List.of(
                                new SessionCompletedFood(a.getId(), "", "like", true),
                                new SessionCompletedFood(b.getId(), "ripe", "no", true))));

        ArgumentCaptor<HouseholdFoodExposure> captor =
                ArgumentCaptor.forClass(HouseholdFoodExposure.class);
        verify(exposures, org.mockito.Mockito.times(2)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(HouseholdFoodExposure::getFamiliarity)
                .containsExactly(FoodFamiliarity.safe, FoodFamiliarity.retrying);
    }
}
