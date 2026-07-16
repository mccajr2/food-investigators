package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.yourorg.quickapp.foods.CatalogFood;
import java.time.Instant;
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

    private JpaFoodCatalog catalog;
    private final Instant now = Instant.parse("2026-07-15T00:00:00Z");
    private final UUID householdId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        catalog = new JpaFoodCatalog(foods);
    }

    @Test
    void findSelectableAcceptsSystemAndActiveHouseholdFoods() {
        UUID systemId = UUID.randomUUID();
        Food system = Food.system(systemId, "Apples", "apple", now);
        Food mine = Food.household(householdId, "Mash", "sweet_potato", now);
        when(foods.findById(systemId)).thenReturn(Optional.of(system));
        when(foods.findById(mine.getId())).thenReturn(Optional.of(mine));

        assertThat(catalog.findSelectable(householdId, systemId))
                .contains(new CatalogFood(systemId, "Apples", "apple"));
        assertThat(catalog.findSelectable(householdId, mine.getId()))
                .contains(new CatalogFood(mine.getId(), "Mash", "sweet_potato"));
    }

    @Test
    void findSelectableRejectsArchivedAndOtherHousehold() {
        Food archived = Food.household(householdId, "Old", "apple", now);
        archived.archive(now);
        UUID otherId = UUID.randomUUID();
        Food other = Food.household(UUID.randomUUID(), "Theirs", "banana", now);
        when(foods.findById(archived.getId())).thenReturn(Optional.of(archived));
        when(foods.findById(otherId)).thenReturn(Optional.of(other));

        assertThat(catalog.findSelectable(householdId, archived.getId())).isEmpty();
        assertThat(catalog.findSelectable(householdId, otherId)).isEmpty();
        assertThat(catalog.findVisible(householdId, archived.getId()))
                .contains(new CatalogFood(archived.getId(), "Old", "apple"));
    }
}
