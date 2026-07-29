package com.yourorg.quickapp.sessions.internal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgresTestcontainersConfiguration.class)
class SessionSuggestionApiIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
    private static final String APPLES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04";
    private static final String STRAWBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05";
    private static final String BLUEBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SuggestionLlmPort suggestionLlmPort;

    @BeforeEach
    void resetLlm() {
        reset(suggestionLlmPort);
        when(suggestionLlmPort.propose(any())).thenReturn(Optional.empty());
    }

    @Test
    void suggestRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/sessions/suggestions/next"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void coldStartUsesHeuristicWithoutCallingLlm() throws Exception {
        String token = register("suggest-cold-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("heuristic"))
                .andExpect(jsonPath("$.foods.length()").value(2))
                .andExpect(jsonPath("$.foods[0].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[1].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[0].familiarity").isNotEmpty())
                .andExpect(jsonPath("$.scheduledOn").isNotEmpty());

        verifyNoInteractions(suggestionLlmPort);
    }

    @Test
    void readyHistoryFallsBackToHeuristicWhenLlmEmpty() throws Exception {
        String token = register("suggest-fallback-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("heuristic"))
                .andExpect(jsonPath("$.foods.length()").value(2));

        verify(suggestionLlmPort).propose(any());
    }

    @Test
    void readyHistoryUsesAiWhenLlmReturnsShortlistPicks() throws Exception {
        String token = register("suggest-ai-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);

        when(suggestionLlmPort.propose(any()))
                .thenAnswer(
                        invocation -> {
                            SuggestionBrief brief = invocation.getArgument(0);
                            SuggestionCandidate first = brief.candidates().get(0);
                            SuggestionCandidate second = brief.candidates().get(1);
                            return Optional.of(
                                    new LlmSuggestionChoice(
                                            List.of(
                                                    new LlmFoodPick(
                                                            first.foodId(), Familiarity.safe),
                                                    new LlmFoodPick(
                                                            second.foodId(),
                                                            Familiarity.familiar_but_new)),
                                            "Gentle stretch tonight"));
                        });

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("ai"))
                .andExpect(jsonPath("$.rationale").value("Gentle stretch tonight"))
                .andExpect(jsonPath("$.foods.length()").value(2))
                .andExpect(jsonPath("$.foods[0].familiarity").value("safe"))
                .andExpect(jsonPath("$.foods[1].familiarity").value("familiar_but_new"));
    }

    @Test
    void invalidAiPickFallsBackToHeuristic() throws Exception {
        String token = register("suggest-bad-ai-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);

        UUID offList = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        when(suggestionLlmPort.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(offList, Familiarity.safe),
                                                new LlmFoodPick(
                                                        UUID.fromString(APPLES), Familiarity.safe)),
                                        "bad")));

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("heuristic"))
                .andExpect(jsonPath("$.foods.length()").value(2));
    }

    @Test
    void suggestionFoodsAreHouseholdScopedAndApproveCreatesSession() throws Exception {
        String tokenA = register("suggest-scope-a-" + System.nanoTime() + "@example.com");
        String tokenB = register("suggest-scope-b-" + System.nanoTime() + "@example.com");

        MvcResult foodResult =
                mockMvc.perform(
                                post("/api/foods")
                                        .header("Authorization", "Bearer " + tokenA)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {
                                                  "name":"Household A only tasting",
                                                  "iconKey":"custom_household_a_tasting",
                                                  "sessionEligible":true
                                                }
                                                """))
                        .andExpect(status().isCreated())
                        .andReturn();
        String privateFoodId = idFrom(foodResult);

        MvcResult suggestionResult =
                mockMvc.perform(
                                get("/api/sessions/suggestions/next")
                                        .header("Authorization", "Bearer " + tokenB))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.source").value("heuristic"))
                        .andExpect(jsonPath("$.foods.length()").value(2))
                        .andReturn();
        String body = suggestionResult.getResponse().getContentAsString();
        org.assertj.core.api.Assertions.assertThat(body).doesNotContain(privateFoodId);

        String scheduledOn = jsonStringField(body, "scheduledOn");
        Matcher foodIds = Pattern.compile("\"foodId\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        org.assertj.core.api.Assertions.assertThat(foodIds.find()).isTrue();
        String firstFood = foodIds.group(1);
        org.assertj.core.api.Assertions.assertThat(foodIds.find()).isTrue();
        String secondFood = foodIds.group(1);

        Matcher familiarities =
                Pattern.compile("\"familiarity\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        org.assertj.core.api.Assertions.assertThat(familiarities.find()).isTrue();
        String fam1 = familiarities.group(1);
        org.assertj.core.api.Assertions.assertThat(familiarities.find()).isTrue();
        String fam2 = familiarities.group(1);

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + tokenB)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                scheduledOn,
                                                firstFood,
                                                fam1,
                                                null,
                                                secondFood,
                                                fam2,
                                                null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("planned"))
                .andExpect(jsonPath("$.scheduledOn").value(scheduledOn));
    }

    private void planAndComplete(String token, String scheduledOn, String food1, String food2)
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
                                                        "safe",
                                                        null,
                                                        food2,
                                                        "safe",
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
                                            {"position":1,"liked":"like","texture":"soft","ateEnough":true},
                                            {"position":2,"liked":"like","texture":"soft","ateEnough":true}
                                          ]
                                        }
                                        """))
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

    private static String tokenFrom(MvcResult result) throws Exception {
        return matchGroup(TOKEN_PATTERN, result.getResponse().getContentAsString(), "token");
    }

    private static String idFrom(MvcResult result) throws Exception {
        return matchGroup(ID_PATTERN, result.getResponse().getContentAsString(), "id");
    }

    private static String jsonStringField(String body, String field) {
        Pattern pattern = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]+)\"");
        return matchGroup(pattern, body, field);
    }

    private static String matchGroup(Pattern pattern, String body, String label) {
        Matcher matcher = pattern.matcher(body);
        if (!matcher.find()) {
            throw new IllegalStateException("No " + label + " in response: " + body);
        }
        return matcher.group(1);
    }
}
