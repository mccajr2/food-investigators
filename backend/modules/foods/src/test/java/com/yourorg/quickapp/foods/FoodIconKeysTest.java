package com.yourorg.quickapp.foods;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Set;
import org.junit.jupiter.api.Test;

class FoodIconKeysTest {

    private static final Set<String> SEEDED_ICON_KEYS =
            Set.of(
                    "bagel_cream_cheese",
                    "ramen",
                    "chicken_tenders",
                    "apple",
                    "strawberry",
                    "pancakes_choc_chip",
                    "yogurt_plain",
                    "bagel",
                    "toast",
                    "chicken_nuggets",
                    "applesauce",
                    "banana",
                    "blueberry",
                    "grape",
                    "pancakes_plain",
                    "waffle",
                    "yogurt_vanilla",
                    "carrot",
                    "corn",
                    "sweet_potato",
                    "cheese_pizza",
                    "soft_pretzel",
                    "raspberry");

    @Test
    void allowlistMatchesSeededStarterIcons() {
        assertThat(FoodIconKeys.ALL).containsExactlyInAnyOrderElementsOf(SEEDED_ICON_KEYS);
    }

    @Test
    void acceptsNewHeroStarterKeys() {
        FoodIconKeys.requireAllowed("cheese_pizza");
        FoodIconKeys.requireAllowed("soft_pretzel");
        FoodIconKeys.requireAllowed("raspberry");
    }

    @Test
    void acceptsCustomKeysGeneratedFromFoodNames() {
        assertThat(FoodIconKeys.isCustom("custom_cucumber")).isTrue();
        FoodIconKeys.requireAllowed("custom_cucumber");
        FoodIconKeys.requireAllowed("custom_green_beans");
    }

    @Test
    void requireAllowedRejectsUnknownKeys() {
        assertThatThrownBy(() -> FoodIconKeys.requireAllowed("not_a_real_icon"))
                .isInstanceOf(InvalidFoodIconKeyException.class);
        assertThatThrownBy(() -> FoodIconKeys.requireAllowed("custom_"))
                .isInstanceOf(InvalidFoodIconKeyException.class);
        assertThatThrownBy(() -> FoodIconKeys.requireAllowed("custom_Cucumber"))
                .isInstanceOf(InvalidFoodIconKeyException.class);
        FoodIconKeys.requireAllowed("carrot");
    }
}
