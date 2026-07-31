package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.CatalogFood;
import com.yourorg.quickapp.foods.FoodIllustrationStore;
import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JpaFoodCatalogTest {

    @Mock
    private FoodRepository foods;

    @Mock
    private FoodIllustrationStore illustrations;

    private JpaFoodCatalog catalog;
    private final Instant now = Instant.parse("2026-07-15T00:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        catalog = new JpaFoodCatalog(foods, illustrations);
    }

    @Test
    void findSelectableAcceptsSystemAndActiveHouseholdFoods() {
        UUID systemId = UUID.randomUUID();
        Food system = Food.system(systemId, "Apples", "apple", now);
        Food mine = Food.household(householdId, "Mash", "sweet_potato", now);
        when(foods.findById(systemId)).thenReturn(Optional.of(system));
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));
        when(illustrations.findPublicUrl(any())).thenReturn(Optional.empty());

        assertThat(catalog.findSelectable(householdId, systemId))
                .contains(new CatalogFood(systemId, "Apples", "apple", null));
        assertThat(catalog.findSelectable(householdId, mine.getId()))
                .contains(new CatalogFood(mine.getId(), "Mash", "sweet_potato", null));
    }

    @Test
    void findSelectableRejectsArchivedAndOtherHousehold() {
        Food archived = Food.household(householdId, "Old", "apple", now);
        archived.archive(now);
        UUID otherId = UUID.randomUUID();
        Food other = Food.household(UUID.randomUUID(), "Theirs", "banana", now);
        when(foods.findById(archived.getId())).thenReturn(Optional.of(archived));
        when(foods.findById(otherId)).thenReturn(Optional.of(other));
        when(illustrations.findPublicUrl("apple")).thenReturn(Optional.empty());

        assertThat(catalog.findSelectable(householdId, archived.getId())).isEmpty();
        assertThat(catalog.findSelectable(householdId, otherId)).isEmpty();
        assertThat(catalog.findVisible(householdId, archived.getId()))
                .contains(new CatalogFood(archived.getId(), "Old", "apple", null));
    }

    @Test
    void findSelectableRejectsSnackFoodsButVisibleStillReturnsThem() {
        Food snack = Food.household(householdId, "Chips", "apple", now);
        snack.setSessionEligible(false, now);
        when(foods.findById(snack.getId())).thenReturn(Optional.of(snack));
        when(illustrations.findPublicUrl("apple")).thenReturn(Optional.empty());

        assertThat(catalog.findSelectable(householdId, snack.getId())).isEmpty();
        assertThat(catalog.findVisible(householdId, snack.getId()))
                .contains(new CatalogFood(snack.getId(), "Chips", "apple", null));
    }

    @Test
    void listSelectableReturnsSystemAndHouseholdSessionEligibleOnly() {
        UUID systemId = UUID.randomUUID();
        Food system = Food.system(systemId, "Apples", "apple", now);
        Food snack = Food.household(householdId, "Chips", "custom", now);
        snack.setSessionEligible(false, now);
        Food tasting = Food.household(householdId, "Cucumber", "custom", now);
        when(foods.findByHouseholdIdIsNullOrderByNameAsc()).thenReturn(List.of(system));
        when(foods.findByHouseholdIdAndArchivedAtIsNullOrderByNameAsc(householdId))
                .thenReturn(List.of(snack, tasting));
        when(illustrations.findPublicUrls(any())).thenReturn(Map.of());

        assertThat(catalog.listSelectable(householdId))
                .containsExactly(
                        new CatalogFood(systemId, "Apples", "apple", null),
                        new CatalogFood(tasting.getId(), "Cucumber", "custom", null));
    }

    @Test
    void listActiveSnackPreferencesReturnsNonArchivedSnacksOnly() {
        Food snack = Food.household(householdId, "Chips", "apple", now);
        snack.setSessionEligible(false, now);
        snack.setPreferences(FoodLiked.like, FoodTexture.crunchy, "salt", now);
        Food tasting = Food.household(householdId, "Mash", "sweet_potato", now);
        when(foods.findByHouseholdIdAndSessionEligibleFalseAndArchivedAtIsNullOrderByNameAsc(
                        householdId))
                .thenReturn(List.of(snack));

        assertThat(catalog.listActiveSnackPreferences(householdId))
                .containsExactly(new SnackPreferenceSnapshot(FoodLiked.like, FoodTexture.crunchy));
        assertThat(tasting.isSessionEligible()).isTrue();
    }
}
