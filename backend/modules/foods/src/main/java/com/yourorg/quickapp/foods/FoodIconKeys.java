package com.yourorg.quickapp.foods;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Icon keys for starter foods (fixed allowlist) and household customs.
 *
 * <p>Custom keys use {@code custom_<slug>} (generated from the food name on the
 * client) so parents can add foods like cucumber without reusing an unrelated
 * starter illustration.
 */
public final class FoodIconKeys {

    public static final Set<String> ALL =
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

    private static final Pattern CUSTOM_KEY =
            Pattern.compile("^custom_[a-z0-9]+(?:_[a-z0-9]+){0,15}$");

    private FoodIconKeys() {}

    public static boolean isAllowed(String iconKey) {
        if (iconKey == null || iconKey.length() > 64) {
            return false;
        }
        return ALL.contains(iconKey) || isCustom(iconKey);
    }

    public static boolean isCustom(String iconKey) {
        return iconKey != null && CUSTOM_KEY.matcher(iconKey).matches();
    }

    public static void requireAllowed(String iconKey) {
        if (!isAllowed(iconKey)) {
            throw new InvalidFoodIconKeyException(iconKey);
        }
    }
}
