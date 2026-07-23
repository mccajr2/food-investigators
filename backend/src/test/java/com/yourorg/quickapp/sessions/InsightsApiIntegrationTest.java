package com.yourorg.quickapp.sessions;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
class InsightsApiIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern TIP_ID_PATTERN =
            Pattern.compile("\"tips\"\\s*:\\s*\\[\\s*\\{\\s*\"id\"\\s*:\\s*\"([^\"]+)\"");
    private static final String APPLES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04";
    private static final String STRAWBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05";
    private static final String BLUEBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void notReadyUntilThreeCompletedSessionsEvenWithSnacks() throws Exception {
        String token = register("insights-not-ready-" + System.nanoTime() + "@example.com");

        mockMvc.perform(get("/api/insights")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/insights/tips/keep_going/dismiss"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "name":"Salt chips",
                                          "iconKey":"custom_salt_chips",
                                          "sessionEligible":false,
                                          "liked":"like",
                                          "texture":"crunchy"
                                        }
                                        """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/insights").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedSessionCount").value(0))
                .andExpect(jsonPath("$.ready").value(false))
                .andExpect(jsonPath("$.snackCount").value(1))
                .andExpect(jsonPath("$.likedLike").value(1))
                .andExpect(jsonPath("$.tips.length()").value(0));

        planAndComplete(token, day(0), APPLES, STRAWBERRIES, "like", "soft");

        mockMvc.perform(get("/api/insights").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedSessionCount").value(1))
                .andExpect(jsonPath("$.ready").value(false))
                .andExpect(jsonPath("$.tips.length()").value(0));
    }

    @Test
    void readyAggregatesMergeSnacksDismissIsIdempotentAndHouseholdScoped() throws Exception {
        String token = register("insights-ready-" + System.nanoTime() + "@example.com");

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "name":"Vinegar chips",
                                          "iconKey":"custom_vinegar_chips",
                                          "sessionEligible":false,
                                          "liked":"like",
                                          "texture":"crunchy"
                                        }
                                        """))
                .andExpect(status().isCreated());

        planAndComplete(token, day(0), APPLES, STRAWBERRIES, "like", "soft");
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES, "like", "soft");
        planAndComplete(token, day(2), BLUEBERRIES, APPLES, "like", "chewy");

        MvcResult insightsResult =
                mockMvc.perform(get("/api/insights").header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.completedSessionCount").value(3))
                        .andExpect(jsonPath("$.ready").value(true))
                        .andExpect(jsonPath("$.snackCount").value(1))
                        .andExpect(jsonPath("$.likedLike").value(7))
                        .andExpect(jsonPath("$.topLikedTextures", hasItem("crunchy")))
                        .andExpect(jsonPath("$.topLikedTextures", hasItem("soft")))
                        .andExpect(jsonPath("$.tips.length()").value(3))
                        .andReturn();

        String tipId = firstTipId(insightsResult.getResponse().getContentAsString());

        mockMvc.perform(
                        post("/api/insights/tips/" + tipId + "/dismiss")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(
                        post("/api/insights/tips/" + tipId + "/dismiss")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/insights").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tips[*].id", not(hasItem(tipId))))
                .andExpect(jsonPath("$.tips.length()").value(3));

        mockMvc.perform(
                        post("/api/insights/tips/not_a_real_tip/dismiss")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unknown tip id: not_a_real_tip"));

        String otherToken = register("insights-other-" + System.nanoTime() + "@example.com");
        mockMvc.perform(get("/api/insights").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedSessionCount").value(0))
                .andExpect(jsonPath("$.ready").value(false))
                .andExpect(jsonPath("$.snackCount").value(0))
                .andExpect(jsonPath("$.tips.length()").value(0));

        mockMvc.perform(
                        post("/api/insights/tips/" + tipId + "/dismiss")
                                .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/insights").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tips[*].id", not(hasItem(tipId))));
    }

    private void planAndComplete(
            String token,
            String scheduledOn,
            String food1,
            String food2,
            String liked1,
            String texture1)
            throws Exception {
        MvcResult created =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                createBody(
                                                        scheduledOn,
                                                        food1,
                                                        "likes",
                                                        null,
                                                        food2,
                                                        "likes",
                                                        null)))
                        .andExpect(status().isCreated())
                        .andReturn();
        String sessionId = idFrom(created);

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "foods":[
                                            {"position":1,"liked":"%s","texture":"%s","ateEnough":true},
                                            {"position":2,"liked":"like","texture":"soft","ateEnough":true}
                                          ]
                                        }
                                        """
                                                .formatted(liked1, texture1)))
                .andExpect(status().isOk());
    }

    private static String day(int offsetDays) {
        return LocalDate.now(ZoneOffset.UTC).plusDays(offsetDays).toString();
    }

    private static String createBody(
            String scheduledOn,
            String foodId1,
            String familiarity1,
            String variant1,
            String foodId2,
            String familiarity2,
            String variant2) {
        return """
                {
                  "scheduledOn":"%s",
                  "foods":[
                    %s,
                    %s
                  ]
                }
                """
                .formatted(
                        scheduledOn,
                        foodJson(foodId1, familiarity1, variant1),
                        foodJson(foodId2, familiarity2, variant2));
    }

    private static String foodJson(String foodId, String familiarity, String variantNote) {
        if (variantNote == null) {
            return "{\"foodId\":\"%s\",\"familiarity\":\"%s\"}".formatted(foodId, familiarity);
        }
        return "{\"foodId\":\"%s\",\"familiarity\":\"%s\",\"variantNote\":\"%s\"}"
                .formatted(foodId, familiarity, variantNote.replace("\"", "\\\""));
    }

    private String register(String email) throws Exception {
        MvcResult result =
                mockMvc.perform(
                                post("/api/auth/register")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"email":"%s","password":"password1","rememberMe":true}
                                                """
                                                        .formatted(email)))
                        .andExpect(status().isCreated())
                        .andReturn();
        return tokenFrom(result);
    }

    private static String firstTipId(String body) {
        return matchGroup(TIP_ID_PATTERN, body, "tip id");
    }

    private static String tokenFrom(MvcResult result) throws Exception {
        return matchGroup(TOKEN_PATTERN, result.getResponse().getContentAsString(), "token");
    }

    private static String idFrom(MvcResult result) throws Exception {
        return matchGroup(ID_PATTERN, result.getResponse().getContentAsString(), "id");
    }

    private static String matchGroup(Pattern pattern, String body, String label) {
        Matcher matcher = pattern.matcher(body);
        if (!matcher.find()) {
            throw new IllegalStateException("No " + label + " in response: " + body);
        }
        return matcher.group(1);
    }
}
