package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.CreateFoodRequest;
import com.yourorg.quickapp.foods.DuplicateFoodNameException;
import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodNotFoundException;
import com.yourorg.quickapp.foods.FoodResponse;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.InvalidFoodIconKeyException;
import com.yourorg.quickapp.foods.InvalidFoodPreferenceException;
import com.yourorg.quickapp.foods.SystemFoodImmutableException;
import com.yourorg.quickapp.foods.UpdateFoodRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
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

    private FoodService service;
    private final Instant now = Instant.parse("2026-07-14T00:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        service = new FoodService(foods, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void listMergesSystemAndActiveHouseholdFoods() {
        Food system = Food.system(UUID.randomUUID(), "Apples", "apple", now);
        Food mine = Food.household(householdId, "My mash", "sweet_potato", now);
        when(foods.findByHouseholdIdIsNullOrderByNameAsc()).thenReturn(List.of(system));
        when(foods.findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(householdId))
                .thenReturn(List.of(mine));

        List<FoodResponse> listed = service.list(householdId, false);

        assertThat(listed).extracting(FoodResponse::name).containsExactly("Apples", "My mash");
        assertThat(listed.get(0).sessionEligible()).isTrue();
        assertThat(listed.get(1).sessionEligible()).isTrue();
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

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foods).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Extra apple");
    }

    @Test
    void createPersistsSnackWithPreferences() {
        when(foods.existsVisibleName(householdId, "Salt chips", null)).thenReturn(false);
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

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
        assertThat(created.texture()).isEqualTo(FoodTexture.crunchy);
        assertThat(created.tasteNote()).isEqualTo("salt & vinegar");
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
    void updateMarksSnackAndPreferences() {
        Food mine = Food.household(householdId, "Chips", "apple", now);
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));
        when(foods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

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
        assertThat(updated.liked()).isEqualTo(FoodLiked.so_so);
        assertThat(updated.texture()).isEqualTo(FoodTexture.crunchy);
        assertThat(updated.tasteNote()).isEqualTo("bbq");
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
}
