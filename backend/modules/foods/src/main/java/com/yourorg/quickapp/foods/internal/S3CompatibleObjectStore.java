package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.FoodIllustrationProperties;
import java.net.URI;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * S3-compatible adapter (Cloudflare R2, AWS S3, MinIO, …) using AWS SDK v2 + URLConnection HTTP
 * client (no Netty).
 */
final class S3CompatibleObjectStore implements ObjectStorePort {

    private final S3Client client;
    private final String bucket;
    private final String publicBaseUrl;

    S3CompatibleObjectStore(S3Client client, String bucket, String publicBaseUrl) {
        this.client = client;
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl;
    }

    static S3CompatibleObjectStore create(FoodIllustrationProperties properties) {
        S3Client client =
                S3Client.builder()
                        .endpointOverride(URI.create(properties.endpoint().trim()))
                        .region(Region.of(properties.region().trim()))
                        .credentialsProvider(
                                StaticCredentialsProvider.create(
                                        AwsBasicCredentials.create(
                                                properties.accessKey().trim(),
                                                properties.secretKey().trim())))
                        .httpClientBuilder(UrlConnectionHttpClient.builder())
                        .serviceConfiguration(
                                S3Configuration.builder().pathStyleAccessEnabled(true).build())
                        .build();
        return new S3CompatibleObjectStore(
                client, properties.bucket().trim(), properties.resolvedPublicBaseUrl());
    }

    @Override
    public void put(String objectKey, byte[] bytes, String contentType) {
        client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(bytes));
    }

    @Override
    public boolean exists(String objectKey) {
        try {
            client.headObject(
                    HeadObjectRequest.builder().bucket(bucket).key(objectKey).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return false;
            }
            throw e;
        }
    }

    @Override
    public String publicUrl(String objectKey) {
        return publicBaseUrl + "/" + objectKey;
    }

    @Override
    public void close() {
        client.close();
    }
}
