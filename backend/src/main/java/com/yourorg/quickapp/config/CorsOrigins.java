package com.yourorg.quickapp.config;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Merges always-on local Vite origins with optional comma-separated extras from
 * {@code APP_CORS_ALLOWED_ORIGINS} / {@code app.cors.allowed-origins}.
 */
public final class CorsOrigins {

    static final List<String> LOCAL_VITE_ORIGINS =
            List.of(
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:4173",
                    "http://127.0.0.1:4173");

    private CorsOrigins() {}

    public static List<String> merge(String extraCsv) {
        Set<String> origins = new LinkedHashSet<>(LOCAL_VITE_ORIGINS);
        if (extraCsv != null && !extraCsv.isBlank()) {
            for (String part : extraCsv.split(",")) {
                String origin = part.trim();
                if (!origin.isEmpty()) {
                    origins.add(origin);
                }
            }
        }
        return List.copyOf(new ArrayList<>(origins));
    }
}
