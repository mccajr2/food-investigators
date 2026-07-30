package com.yourorg.quickapp.sessions;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Calendar zone for “today” when validating/scheduling session dates. */
@ConfigurationProperties(prefix = "app.calendar")
public record CalendarProperties(String zone) {

    public CalendarProperties {
        if (zone == null || zone.isBlank()) {
            zone = "America/New_York";
        }
    }

    public ZoneId zoneId() {
        return ZoneId.of(zone);
    }
}
