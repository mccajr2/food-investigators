package com.yourorg.quickapp;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class OpenApiContractTest {

    @Test
    void documentsAuthEndpointsAndDropsGreeting() throws IOException {
        Path openApi = resolveOpenApi();
        assertThat(openApi).exists();
        String yaml = Files.readString(openApi);

        assertThat(yaml).contains("/api/auth/register");
        assertThat(yaml).contains("/api/auth/login");
        assertThat(yaml).contains("/api/auth/logout");
        assertThat(yaml).contains("/api/auth/me");
        assertThat(yaml).contains("RegisterRequest");
        assertThat(yaml).contains("AuthResponse");
        assertThat(yaml).contains("bearerAuth");

        assertThat(yaml).doesNotContain("/api/greeting");
        assertThat(yaml).doesNotContain("GreetingResponse");
        assertThat(yaml).doesNotContain("getGreeting");
    }

    @Test
    void readmeSmokeUsesAuthNotGreeting() throws IOException {
        Path readme = resolveReadme();
        assertThat(readme).exists();
        String text = Files.readString(readme);

        assertThat(text).contains("/api/auth/register");
        assertThat(text).contains("/api/auth/me");
        assertThat(text).contains("Authorization: Bearer");
        assertThat(text).doesNotContain("/api/greeting");
    }

    private static Path resolveOpenApi() {
        Path fromBackend = Path.of("..", "contracts", "openapi.yaml").normalize().toAbsolutePath();
        if (Files.exists(fromBackend)) {
            return fromBackend;
        }
        return Path.of("contracts", "openapi.yaml").toAbsolutePath();
    }

    private static Path resolveReadme() {
        Path fromBackend = Path.of("..", "README.md").normalize().toAbsolutePath();
        if (Files.exists(fromBackend)) {
            return fromBackend;
        }
        return Path.of("README.md").toAbsolutePath();
    }
}
