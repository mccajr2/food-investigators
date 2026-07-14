package com.yourorg.quickapp.accounts;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgresTestcontainersConfiguration.class)
class AuthSessionTtlIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void rememberMeAndSessionOnlyUseDifferentServerTtls() throws Exception {
        String email = "ttl-" + System.nanoTime() + "@example.com";

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"email":"%s","password":"password1","rememberMe":true}
                                        """
                                                .formatted(email)))
                .andExpect(status().isCreated());

        Instant before = Instant.now().minusSeconds(5);

        MvcResult rememberLogin =
                mockMvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"email":"%s","password":"password1","rememberMe":true}
                                                """
                                                        .formatted(email)))
                        .andExpect(status().isOk())
                        .andReturn();

        MvcResult sessionLogin =
                mockMvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"email":"%s","password":"password1","rememberMe":false}
                                                """
                                                        .formatted(email)))
                        .andExpect(status().isOk())
                        .andReturn();

        Instant after = Instant.now().plusSeconds(5);
        Instant rememberExpires = expiresAt(tokenFrom(rememberLogin));
        Instant sessionExpires = expiresAt(tokenFrom(sessionLogin));

        assertThat(Duration.between(before, rememberExpires))
                .isGreaterThan(Duration.ofDays(29))
                .isLessThan(Duration.ofDays(31));
        assertThat(Duration.between(before, sessionExpires))
                .isGreaterThan(Duration.ofHours(11))
                .isLessThan(Duration.ofHours(13));
        assertThat(rememberExpires).isAfter(sessionExpires);
        assertThat(sessionExpires).isBefore(after.plus(Duration.ofHours(13)));
    }

    private Instant expiresAt(String token) {
        Map<String, Object> row =
                jdbcTemplate.queryForMap(
                        "select expires_at from sessions where token = ?", token);
        Object value = row.get("expires_at");
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant();
        }
        throw new IllegalStateException("Unexpected expires_at type: " + value);
    }

    private static String tokenFrom(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        Matcher matcher = TOKEN_PATTERN.matcher(body);
        if (!matcher.find()) {
            throw new IllegalStateException("No token in response: " + body);
        }
        return matcher.group(1);
    }
}
