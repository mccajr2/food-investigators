package com.yourorg.quickapp.foods.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "food_illustrations")
class FoodIllustration {

    @Id
    @Column(name = "canonical_key", length = 64)
    private String canonicalKey;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "content_type", nullable = false, length = 128)
    private String contentType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FoodIllustration() {}

    static FoodIllustration create(
            String canonicalKey, String objectKey, String contentType, Instant now) {
        FoodIllustration row = new FoodIllustration();
        row.canonicalKey = canonicalKey;
        row.objectKey = objectKey;
        row.contentType = contentType;
        row.createdAt = now;
        row.updatedAt = now;
        return row;
    }

    void replace(String objectKey, String contentType, Instant now) {
        this.objectKey = objectKey;
        this.contentType = contentType;
        this.updatedAt = now;
    }

    String getCanonicalKey() {
        return canonicalKey;
    }

    String getObjectKey() {
        return objectKey;
    }

    String getContentType() {
        return contentType;
    }
}
