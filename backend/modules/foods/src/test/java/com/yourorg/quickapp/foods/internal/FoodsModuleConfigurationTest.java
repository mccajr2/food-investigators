package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.foods.FoodIllustrationProperties;
import org.junit.jupiter.api.Test;

class FoodsModuleConfigurationTest {

    @Test
    void unconfiguredUsesInMemoryDouble() {
        FoodIllustrationProperties properties =
                new FoodIllustrationProperties("", "", "", "", "auto", "");
        ObjectStorePort store = new FoodsModuleConfiguration().objectStorePort(properties);

        assertThat(store).isInstanceOf(InMemoryObjectStore.class);
        store.put("illustrations/x.png", new byte[] {1}, "image/png");
        assertThat(store.exists("illustrations/x.png")).isTrue();
        assertThat(store.publicUrl("illustrations/x.png"))
                .startsWith(FoodIllustrationProperties.DEFAULT_PUBLIC_BASE_URL);
    }

    @Test
    void configuredSelectsS3CompatibleStore() {
        FoodIllustrationProperties properties =
                new FoodIllustrationProperties(
                        "https://example.r2.cloudflarestorage.com",
                        "food-art",
                        "akid",
                        "secret",
                        "auto",
                        "https://cdn.example.com");
        ObjectStorePort store = new FoodsModuleConfiguration().objectStorePort(properties);

        assertThat(store).isInstanceOf(S3CompatibleObjectStore.class);
        assertThat(store.publicUrl("illustrations/x.png"))
                .isEqualTo("https://cdn.example.com/illustrations/x.png");
        store.close();
    }
}
