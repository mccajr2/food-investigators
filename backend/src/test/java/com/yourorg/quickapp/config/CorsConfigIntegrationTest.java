package com.yourorg.quickapp.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

@SpringBootTest
@Import(PostgresTestcontainersConfiguration.class)
@TestPropertySource(properties = "app.cors.allowed-origins=https://beta-web.example.com")
class CorsConfigIntegrationTest {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Test
    void includesConfiguredExtraOriginAlongsideLocalhost() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        CorsConfiguration config = corsConfigurationSource.getCorsConfiguration(request);
        assertThat(config).isNotNull();
        assertThat(config.getAllowedOrigins())
                .contains("http://localhost:5173", "https://beta-web.example.com");
    }
}
