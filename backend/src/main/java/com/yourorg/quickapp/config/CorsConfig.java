package com.yourorg.quickapp.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Allows the Vite dev server (and same-host preview) to call the API with Bearer
 * tokens when {@code VITE_API_BASE_URL} points at the backend instead of the proxy.
 * Extra origins come from {@code APP_CORS_ALLOWED_ORIGINS} (prod web URL later).
 */
@Configuration
public class CorsConfig {

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:}") String extraOriginsCsv) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(CorsOrigins.merge(extraOriginsCsv));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
