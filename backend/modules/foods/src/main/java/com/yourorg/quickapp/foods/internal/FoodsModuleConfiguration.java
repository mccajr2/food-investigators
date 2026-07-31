package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.FoodIllustrationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FoodIllustrationProperties.class)
class FoodsModuleConfiguration {

    @Bean(destroyMethod = "close")
    ObjectStorePort objectStorePort(FoodIllustrationProperties properties) {
        if (properties.configured()) {
            return S3CompatibleObjectStore.create(properties);
        }
        return new InMemoryObjectStore(properties.resolvedPublicBaseUrl());
    }
}
