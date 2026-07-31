package com.yourorg.quickapp.foods.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

@ExtendWith(MockitoExtension.class)
class S3CompatibleObjectStoreTest {

    @Mock
    private S3Client client;

    @Test
    void putExistsAndPublicUrl() {
        S3CompatibleObjectStore store =
                new S3CompatibleObjectStore(
                        client, "food-art", "https://cdn.example.com/food-illustrations");
        byte[] png = new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47};
        String key = "illustrations/custom_cucumber.png";

        when(client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        when(client.headObject(any(HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder().build());

        store.put(key, png, "image/png");
        assertThat(store.exists(key)).isTrue();
        assertThat(store.publicUrl(key))
                .isEqualTo("https://cdn.example.com/food-illustrations/" + key);

        verify(client)
                .putObject(
                        eq(
                                PutObjectRequest.builder()
                                        .bucket("food-art")
                                        .key(key)
                                        .contentType("image/png")
                                        .build()),
                        any(RequestBody.class));
    }

    @Test
    void existsReturnsFalseWhenMissing() {
        S3CompatibleObjectStore store =
                new S3CompatibleObjectStore(client, "food-art", "https://cdn.example.com");
        when(client.headObject(any(HeadObjectRequest.class)))
                .thenThrow(NoSuchKeyException.builder().message("missing").build());

        assertThat(store.exists("illustrations/missing.png")).isFalse();
    }
}
