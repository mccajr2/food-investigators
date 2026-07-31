package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.foods.FoodIllustrationProperties;
import org.junit.jupiter.api.Test;

class InMemoryObjectStoreTest {

    @Test
    void putExistsAndPublicUrl() {
        InMemoryObjectStore store =
                new InMemoryObjectStore(FoodIllustrationProperties.DEFAULT_PUBLIC_BASE_URL);
        byte[] png = new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47};
        String key = "illustrations/custom_cucumber.png";

        store.put(key, png, "image/png");

        assertThat(store.exists(key)).isTrue();
        assertThat(store.exists("missing")).isFalse();
        assertThat(store.publicUrl(key))
                .isEqualTo(
                        FoodIllustrationProperties.DEFAULT_PUBLIC_BASE_URL
                                + "/illustrations/custom_cucumber.png");
    }
}
