package com.yourorg.quickapp.sessions;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.gemini")
public record GeminiProperties(String apiKey, String model, String apiBaseUrl) {

    public GeminiProperties {
        if (apiKey == null) {
            apiKey = "";
        }
        if (model == null || model.isBlank()) {
            model = "gemini-2.0-flash";
        }
        if (apiBaseUrl == null || apiBaseUrl.isBlank()) {
            apiBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
        }
    }

    public boolean configured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
