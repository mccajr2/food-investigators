package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.FoodIllustrationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FoodIllustrationProperties.class)
class FoodsModuleConfiguration {

    /**
     * Cloud S3/R2 adapter is deferred until an AWS SDK (or equivalent) is approved in the version
     * catalog. Unconfigured — and currently even when credentials are set — uses the in-memory
     * double so local/dev/tests keep working.
     */
    @Bean
    ObjectStorePort objectStorePort(FoodIllustrationProperties properties) {
        return new InMemoryObjectStore(properties.resolvedPublicBaseUrl());
    }
}
