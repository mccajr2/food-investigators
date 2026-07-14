package com.yourorg.quickapp.accounts;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgresTestcontainersConfiguration.class)
class AuthControllerIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registerLoginMeLogoutAndUnauthorizedPaths() throws Exception {
        String email = "parent-" + System.nanoTime() + "@example.com";

        MvcResult registerResult =
                mockMvc.perform(
                                post("/api/auth/register")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"email":"%s","password":"password1","rememberMe":true}
                                                """
                                                        .formatted(email)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.token").isString())
                        .andExpect(jsonPath("$.user.email").value(email))
                        .andExpect(jsonPath("$.user.householdId").isString())
                        .andReturn();

        String registerToken = tokenFrom(registerResult);

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"email":"%s","password":"password1"}
                                        """
                                                .formatted(email)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"email":"%s","password":"wrong-password","rememberMe":false}
                                        """
                                                .formatted(email)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        MvcResult loginResult =
                mockMvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"email":"%s","password":"password1","rememberMe":false}
                                                """
                                                        .formatted(email)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.token").isString())
                        .andReturn();

        String loginToken = tokenFrom(loginResult);

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.householdId").isString());

        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        post("/api/auth/logout").header("Authorization", "Bearer " + registerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + registerToken))
                .andExpect(status().isUnauthorized());
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
