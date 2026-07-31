package com.yourorg.quickapp.foods.internal;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Local/test double used when cloud object-store credentials are absent (and until an S3 SDK
 * adapter is added).
 */
final class InMemoryObjectStore implements ObjectStorePort {

    private final Map<String, StoredObject> objects = new ConcurrentHashMap<>();
    private final String publicBaseUrl;

    InMemoryObjectStore(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }

    @Override
    public void put(String objectKey, byte[] bytes, String contentType) {
        objects.put(objectKey, new StoredObject(bytes.clone(), contentType));
    }

    @Override
    public boolean exists(String objectKey) {
        return objects.containsKey(objectKey);
    }

    @Override
    public String publicUrl(String objectKey) {
        return publicBaseUrl + "/" + objectKey;
    }

    private record StoredObject(byte[] bytes, String contentType) {}
}
