package com.yourorg.quickapp.foods;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/**
 * Shared illustration registry + object store. Households reuse the same {@code canonicalKey}
 * (typically a food {@code iconKey}) and resolve the same public URL.
 */
public interface FoodIllustrationStore {

    /**
     * Puts PNG (or other image) bytes and upserts {@code food_illustrations} for {@code
     * canonicalKey}. Returns the public URL clients can use as {@code iconUrl}.
     */
    String store(String canonicalKey, byte[] imageBytes, String contentType);

    /** Public URL when a registry row exists for this key; empty otherwise. */
    Optional<String> findPublicUrl(String canonicalKey);

    /** Batch lookup — missing keys are omitted from the map. */
    Map<String, String> findPublicUrls(Collection<String> canonicalKeys);
}
