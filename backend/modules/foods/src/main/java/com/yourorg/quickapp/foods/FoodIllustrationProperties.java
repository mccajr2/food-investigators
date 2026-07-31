package com.yourorg.quickapp.foods;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Object-store settings for shared food illustrations (S3-compatible / R2). When not fully
 * configured, the foods module uses an in-memory double and {@code iconUrl} stays null unless
 * tests (or later on-demand) call {@link FoodIllustrationStore#store}.
 */
@ConfigurationProperties(prefix = "app.food-illustrations")
public record FoodIllustrationProperties(
        String endpoint,
        String bucket,
        String accessKey,
        String secretKey,
        String publicBaseUrl) {

    public static final String DEFAULT_PUBLIC_BASE_URL = "http://127.0.0.1/food-illustrations";

    public FoodIllustrationProperties {
        if (endpoint == null) {
            endpoint = "";
        }
        if (bucket == null) {
            bucket = "";
        }
        if (accessKey == null) {
            accessKey = "";
        }
        if (secretKey == null) {
            secretKey = "";
        }
        if (publicBaseUrl == null || publicBaseUrl.isBlank()) {
            publicBaseUrl = DEFAULT_PUBLIC_BASE_URL;
        }
    }

    /** True when cloud credentials are present (S3 adapter not wired until SDK is approved). */
    public boolean configured() {
        return !endpoint.isBlank()
                && !bucket.isBlank()
                && !accessKey.isBlank()
                && !secretKey.isBlank();
    }

    public String resolvedPublicBaseUrl() {
        return publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
    }
}
