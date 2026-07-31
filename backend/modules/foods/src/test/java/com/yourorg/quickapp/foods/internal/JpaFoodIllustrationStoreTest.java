package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JpaFoodIllustrationStoreTest {

    @Mock
    private FoodIllustrationRepository illustrations;

    @Mock
    private ObjectStorePort objects;

    private JpaFoodIllustrationStore store;
    private final Instant now = Instant.parse("2026-07-31T12:00:00Z");

    @BeforeEach
    void setUp() {
        store =
                new JpaFoodIllustrationStore(
                        illustrations, objects, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void storePutsObjectAndUpsertsRegistry() {
        when(illustrations.findById("custom_cucumber")).thenReturn(Optional.empty());
        when(illustrations.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(objects.publicUrl("illustrations/custom_cucumber.png"))
                .thenReturn("http://cdn.example/illustrations/custom_cucumber.png");

        String url = store.store("custom_cucumber", new byte[] {1, 2, 3}, "image/png");

        assertThat(url).isEqualTo("http://cdn.example/illustrations/custom_cucumber.png");
        verify(objects).put("illustrations/custom_cucumber.png", new byte[] {1, 2, 3}, "image/png");
        ArgumentCaptor<FoodIllustration> captor = ArgumentCaptor.forClass(FoodIllustration.class);
        verify(illustrations).save(captor.capture());
        assertThat(captor.getValue().getCanonicalKey()).isEqualTo("custom_cucumber");
        assertThat(captor.getValue().getObjectKey()).isEqualTo("illustrations/custom_cucumber.png");
    }

    @Test
    void findPublicUrlsReturnsSameUrlForSharedCanonicalKey() {
        FoodIllustration row =
                FoodIllustration.create(
                        "custom_cucumber",
                        "illustrations/custom_cucumber.png",
                        "image/png",
                        now);
        when(illustrations.findByCanonicalKeyIn(List.of("custom_cucumber")))
                .thenReturn(List.of(row));
        when(objects.publicUrl("illustrations/custom_cucumber.png"))
                .thenReturn("http://cdn.example/illustrations/custom_cucumber.png");

        Map<String, String> urls =
                store.findPublicUrls(List.of("custom_cucumber", "custom_cucumber"));

        assertThat(urls)
                .containsEntry(
                        "custom_cucumber",
                        "http://cdn.example/illustrations/custom_cucumber.png");
    }
}
