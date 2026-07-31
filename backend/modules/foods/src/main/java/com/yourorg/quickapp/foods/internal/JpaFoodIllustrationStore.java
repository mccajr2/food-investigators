package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.FoodIllustrationStore;
import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
class JpaFoodIllustrationStore implements FoodIllustrationStore {

    private final FoodIllustrationRepository illustrations;
    private final ObjectStorePort objects;
    private final Clock clock;

    JpaFoodIllustrationStore(
            FoodIllustrationRepository illustrations, ObjectStorePort objects, Clock clock) {
        this.illustrations = illustrations;
        this.objects = objects;
        this.clock = clock;
    }

    @Override
    @Transactional
    public String store(String canonicalKey, byte[] imageBytes, String contentType) {
        String key = requireCanonicalKey(canonicalKey);
        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("imageBytes must not be empty");
        }
        String type =
                StringUtils.hasText(contentType) ? contentType.trim() : "image/png";
        String objectKey = objectKeyFor(key, type);
        objects.put(objectKey, imageBytes, type);
        Instant now = clock.instant();
        FoodIllustration row =
                illustrations
                        .findById(key)
                        .map(
                                existing -> {
                                    existing.replace(objectKey, type, now);
                                    return existing;
                                })
                        .orElseGet(() -> FoodIllustration.create(key, objectKey, type, now));
        illustrations.save(row);
        return objects.publicUrl(objectKey);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findPublicUrl(String canonicalKey) {
        if (!StringUtils.hasText(canonicalKey)) {
            return Optional.empty();
        }
        return illustrations
                .findById(canonicalKey.trim())
                .map(row -> objects.publicUrl(row.getObjectKey()));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> findPublicUrls(Collection<String> canonicalKeys) {
        if (canonicalKeys == null || canonicalKeys.isEmpty()) {
            return Map.of();
        }
        List<String> keys =
                canonicalKeys.stream()
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .distinct()
                        .toList();
        if (keys.isEmpty()) {
            return Map.of();
        }
        Map<String, String> result = new HashMap<>();
        for (FoodIllustration row : illustrations.findByCanonicalKeyIn(keys)) {
            result.put(row.getCanonicalKey(), objects.publicUrl(row.getObjectKey()));
        }
        return Map.copyOf(result);
    }

    private static String requireCanonicalKey(String canonicalKey) {
        if (!StringUtils.hasText(canonicalKey)) {
            throw new IllegalArgumentException("canonicalKey must not be blank");
        }
        String key = canonicalKey.trim();
        if (key.length() > 64) {
            throw new IllegalArgumentException("canonicalKey must be at most 64 characters");
        }
        return key;
    }

    private static String objectKeyFor(String canonicalKey, String contentType) {
        String extension =
                contentType.toLowerCase().contains("jpeg")
                                || contentType.toLowerCase().contains("jpg")
                        ? ".jpg"
                        : contentType.toLowerCase().contains("webp") ? ".webp" : ".png";
        return "illustrations/" + canonicalKey + extension;
    }
}
