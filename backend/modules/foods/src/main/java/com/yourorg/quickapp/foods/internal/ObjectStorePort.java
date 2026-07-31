package com.yourorg.quickapp.foods.internal;

/** S3-compatible object store operations for food illustration bytes. */
interface ObjectStorePort {

    void put(String objectKey, byte[] bytes, String contentType);

    boolean exists(String objectKey);

    String publicUrl(String objectKey);
}
