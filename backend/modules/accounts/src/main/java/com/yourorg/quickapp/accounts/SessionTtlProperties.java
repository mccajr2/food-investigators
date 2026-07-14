package com.yourorg.quickapp.accounts;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.session-ttl")
public record SessionTtlProperties(Duration remember, Duration sessionOnly) {

    public SessionTtlProperties {
        if (remember == null) {
            remember = Duration.ofDays(30);
        }
        if (sessionOnly == null) {
            sessionOnly = Duration.ofHours(12);
        }
    }

    public Duration forRememberMe(boolean rememberMe) {
        return rememberMe ? remember : sessionOnly;
    }
}
