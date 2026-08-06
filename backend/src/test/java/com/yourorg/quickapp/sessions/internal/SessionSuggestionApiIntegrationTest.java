package com.yourorg.quickapp.sessions.internal;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.assertj.core.api.Assertions;
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
    private static final String BAGEL = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08";

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
                .andExpect(jsonPath("$.foods[0].proposedName").value(nullValue()))
                .andExpect(jsonPath("$.foods[1].proposedName").value(nullValue()))
                .andExpect(jsonPath("$.foods[0].familiarity").isNotEmpty())
                .andExpect(jsonPath("$.scheduledOn").isNotEmpty())
                .andExpect(jsonPath("$.pacingNote").value(PacingEvidencePack.forHint("steady").pacingNote()))
                .andExpect(jsonPath("$.citations[0].title").value(
                        PacingEvidencePack.forHint("steady").citations().getFirst().title()));

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
                .andExpect(jsonPath("$.foods.length()").value(2))
                .andExpect(jsonPath("$.foods[0].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[1].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[0].proposedName").value(nullValue()))
                .andExpect(jsonPath("$.foods[1].proposedName").value(nullValue()))
                .andExpect(
                        jsonPath("$.pacingNote")
                                .value(PacingEvidencePack.forHint("gentle_stretch").pacingNote()))
                .andExpect(
                        jsonPath("$.citations[0].title")
                                .value(
                                        PacingEvidencePack.forHint("gentle_stretch")
                                                .citations()
                                                .getFirst()
                                                .title()));

        verify(suggestionLlmPort).propose(any());
    }

    @Test
    void heuristicPairsSafeAnchorWithReadyStretchDestination() throws Exception {
        String broccoli = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa24";
        String token = register("suggest-stretch-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);
        upsertSafeExposure(token, APPLES);

        mockMvc.perform(
                        post("/api/foods/stretch-targets")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"foodId\":\"%s\"}".formatted(broccoli)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.foodName").value("Broccoli"));

        MvcResult suggested =
                mockMvc.perform(
                                get("/api/sessions/suggestions/next")
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.source").value("heuristic"))
                        .andExpect(jsonPath("$.foods.length()").value(2))
                        .andReturn();
        String body = suggested.getResponse().getContentAsString();
        Assertions.assertThat(body).contains(broccoli);
        Assertions.assertThat(body).contains(APPLES);
        Assertions.assertThat(body).containsIgnoringCase("Broccoli");
        Assertions.assertThat(body).containsIgnoringCase("step toward");
    }

    @Test
    void suggestReturnsPacingPackForPullBackGentleStretchAndSteady() throws Exception {
        PacingEvidencePack.Entry steady = PacingEvidencePack.forHint("steady");
        PacingEvidencePack.Entry gentle = PacingEvidencePack.forHint("gentle_stretch");
        PacingEvidencePack.Entry pullBack = PacingEvidencePack.forHint("pull_back");

        String steadyToken = register("suggest-pace-steady-" + System.nanoTime() + "@example.com");
        planAndComplete(steadyToken, day(0), APPLES, STRAWBERRIES);
        mockMvc.perform(
                        get("/api/sessions/suggestions/next")
                                .header("Authorization", "Bearer " + steadyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("heuristic"))
                .andExpect(jsonPath("$.pacingNote").value(steady.pacingNote()))
                .andExpect(jsonPath("$.citations[0].title").value(steady.citations().getFirst().title()))
                .andExpect(
                        jsonPath("$.citations[0].source")
                                .value(steady.citations().getFirst().source()));

        String gentleToken = register("suggest-pace-gentle-" + System.nanoTime() + "@example.com");
        planAndComplete(gentleToken, day(0), APPLES, STRAWBERRIES);
        planAndComplete(gentleToken, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(gentleToken, day(2), BLUEBERRIES, APPLES);
        mockMvc.perform(
                        get("/api/sessions/suggestions/next")
                                .header("Authorization", "Bearer " + gentleToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pacingNote").value(gentle.pacingNote()))
                .andExpect(jsonPath("$.citations[0].title").value(gentle.citations().getFirst().title()));

        String pullBackToken = register("suggest-pace-pull-" + System.nanoTime() + "@example.com");
        planAndCompleteTrulyNewRejected(pullBackToken, day(0), APPLES, STRAWBERRIES);
        planAndCompleteTrulyNewRejected(pullBackToken, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndCompleteTrulyNewRejected(pullBackToken, day(2), BLUEBERRIES, APPLES);
        mockMvc.perform(
                        get("/api/sessions/suggestions/next")
                                .header("Authorization", "Bearer " + pullBackToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pacingNote").value(pullBack.pacingNote()))
                .andExpect(
                        jsonPath("$.citations[0].title")
                                .value(pullBack.citations().getFirst().title()))
                .andExpect(
                        jsonPath("$.citations[0].source")
                                .value(pullBack.citations().getFirst().source()));
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
                .andExpect(jsonPath("$.foods[1].familiarity").value("familiar_but_new"))
                .andExpect(
                        jsonPath("$.pacingNote")
                                .value(PacingEvidencePack.forHint("gentle_stretch").pacingNote()));
    }

    @Test
    void suggestOverridesAiFamiliarityFromHouseholdSafeExposure() throws Exception {
        String token = register("suggest-safe-exp-" + System.nanoTime() + "@example.com");
        mockMvc.perform(
                        put("/api/foods/" + APPLES + "/exposures")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"variantKey\":\"\",\"familiarity\":\"safe\"}"))
                .andExpect(status().isOk());
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);

        when(suggestionLlmPort.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                new LlmFoodPick(
                                                        UUID.fromString(APPLES),
                                                        Familiarity.familiar_but_new),
                                                new LlmFoodPick(
                                                        UUID.fromString(STRAWBERRIES),
                                                        Familiarity.truly_new)),
                                        "Wrong labels")));

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("ai"))
                .andExpect(jsonPath("$.foods[0].foodId").value(APPLES))
                .andExpect(jsonPath("$.foods[0].familiarity").value("safe"))
                .andExpect(jsonPath("$.foods[1].foodId").value(STRAWBERRIES));
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

    private static UUID safeAnchorOnShortlist(SuggestionBrief brief) {
        java.util.Set<UUID> safeIds = new java.util.HashSet<>();
        for (var safe : brief.safeExposures()) {
            safeIds.add(safe.foodId());
        }
        return brief.candidates().stream()
                .map(SuggestionCandidate::foodId)
                .filter(safeIds::contains)
                .findFirst()
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "Expected a shortlist food with a safe exposure"));
    }

    private static Optional<LlmSuggestionChoice> inventChoice(
            SuggestionBrief brief, String inventName, String variant, String rationale) {
        UUID anchor = safeAnchorOnShortlist(brief);
        return Optional.of(
                new LlmSuggestionChoice(
                        List.of(
                                new LlmFoodPick(anchor, Familiarity.safe),
                                LlmFoodPick.invent(inventName, variant, Familiarity.truly_new)),
                        rationale));
    }

    @Test
    void aiInventWithSafeAnchorReturnsInventFieldsWithoutCreatingFood() throws Exception {
        String token = register("suggest-invent-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);
        // Mark a not-recent food safe so it stays on the shortlist for invent anchoring.
        upsertSafeExposure(token, BAGEL);

        when(suggestionLlmPort.propose(any()))
                .thenAnswer(
                        invocation ->
                                inventChoice(
                                        invocation.getArgument(0),
                                        "Pickles",
                                        "spears",
                                        "Salty stretch"));

        MvcResult foodsBefore =
                mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn();
        Assertions.assertThat(foodsBefore.getResponse().getContentAsString())
                .doesNotContain("\"name\":\"Pickles\"");

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("ai"))
                .andExpect(jsonPath("$.rationale").value("Salty stretch"))
                .andExpect(jsonPath("$.foods[0].foodId").value(BAGEL))
                .andExpect(jsonPath("$.foods[0].familiarity").value("safe"))
                .andExpect(jsonPath("$.foods[0].proposedName").value(nullValue()))
                .andExpect(jsonPath("$.foods[1].foodId").value(nullValue()))
                .andExpect(jsonPath("$.foods[1].proposedName").value("Pickles"))
                .andExpect(jsonPath("$.foods[1].proposedVariantNote").value("spears"))
                .andExpect(jsonPath("$.foods[1].familiarity").value("truly_new"))
                .andExpect(jsonPath("$.foods[1].name").value("Pickles"));

        MvcResult foodsAfter =
                mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn();
        Assertions.assertThat(foodsAfter.getResponse().getContentAsString())
                .doesNotContain("\"name\":\"Pickles\"");
    }

    @Test
    void inventApprovePathCreatesFoodExposureThenSession() throws Exception {
        String token = register("suggest-approve-invent-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);
        upsertSafeExposure(token, BAGEL);

        when(suggestionLlmPort.propose(any()))
                .thenAnswer(
                        invocation ->
                                inventChoice(
                                        invocation.getArgument(0),
                                        "Pickles",
                                        "spears",
                                        "Salty stretch"));

        MvcResult suggestion =
                mockMvc.perform(
                                get("/api/sessions/suggestions/next")
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.foods[0].foodId").value(BAGEL))
                        .andExpect(jsonPath("$.foods[1].foodId").value(nullValue()))
                        .andExpect(jsonPath("$.foods[1].proposedName").value("Pickles"))
                        .andReturn();
        String scheduledOn =
                jsonStringField(suggestion.getResponse().getContentAsString(), "scheduledOn");

        MvcResult createdFood =
                mockMvc.perform(
                                post("/api/foods")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {
                                                  "name":"Pickles",
                                                  "iconKey":"custom_pickles",
                                                  "sessionEligible":true
                                                }
                                                """))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.name").value("Pickles"))
                        .andReturn();
        String picklesId = idFrom(createdFood);

        mockMvc.perform(
                        put("/api/foods/" + picklesId + "/exposures")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"variantKey":"spears","familiarity":"truly_new"}
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foodId").value(picklesId))
                .andExpect(jsonPath("$.variantKey").value("spears"))
                .andExpect(jsonPath("$.familiarity").value("truly_new"))
                .andExpect(jsonPath("$.source").value("manual"));

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                scheduledOn,
                                                BAGEL,
                                                "safe",
                                                null,
                                                picklesId,
                                                "truly_new",
                                                "spears")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("planned"))
                .andExpect(jsonPath("$.scheduledOn").value(scheduledOn))
                .andExpect(jsonPath("$.foods[0].foodId").value(BAGEL))
                .andExpect(jsonPath("$.foods[1].foodId").value(picklesId))
                .andExpect(jsonPath("$.foods[1].variantNote").value("spears"));
    }

    @Test
    void inventNameMatchingCatalogBecomesCatalogPick() throws Exception {
        String token = register("suggest-invent-match-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);
        upsertSafeExposure(token, BAGEL);

        when(suggestionLlmPort.propose(any()))
                .thenAnswer(
                        invocation -> {
                            SuggestionBrief brief = invocation.getArgument(0);
                            UUID anchor = safeAnchorOnShortlist(brief);
                            SuggestionCandidate match =
                                    brief.candidates().stream()
                                            .filter(c -> !c.foodId().equals(anchor))
                                            .findFirst()
                                            .orElseThrow();
                            return Optional.of(
                                    new LlmSuggestionChoice(
                                            List.of(
                                                    new LlmFoodPick(anchor, Familiarity.safe),
                                                    LlmFoodPick.invent(
                                                            match.name(),
                                                            null,
                                                            Familiarity.familiar_but_new)),
                                            "Match catalog"));
                        });

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("ai"))
                .andExpect(jsonPath("$.foods[1].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[1].proposedName").value(nullValue()));
    }

    @Test
    void twoInventsFallsBackToHeuristic() throws Exception {
        String token = register("suggest-two-invent-" + System.nanoTime() + "@example.com");
        planAndComplete(token, day(0), APPLES, STRAWBERRIES);
        planAndComplete(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndComplete(token, day(2), BLUEBERRIES, APPLES);
        upsertSafeExposure(token, BAGEL);

        when(suggestionLlmPort.propose(any()))
                .thenReturn(
                        Optional.of(
                                new LlmSuggestionChoice(
                                        List.of(
                                                LlmFoodPick.invent(
                                                        "Pickles", null, Familiarity.truly_new),
                                                LlmFoodPick.invent(
                                                        "Olives", null, Familiarity.truly_new)),
                                        "too stretchy")));

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("heuristic"))
                .andExpect(jsonPath("$.foods[0].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[1].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[0].proposedName").value(nullValue()))
                .andExpect(jsonPath("$.foods[1].proposedName").value(nullValue()));
    }

    @Test
    void inventWithoutSafeExposuresFallsBackToHeuristic() throws Exception {
        String token = register("suggest-no-safe-" + System.nanoTime() + "@example.com");
        planAndCompleteSoft(token, day(0), APPLES, STRAWBERRIES);
        planAndCompleteSoft(token, day(1), STRAWBERRIES, BLUEBERRIES);
        planAndCompleteSoft(token, day(2), BLUEBERRIES, APPLES);

        when(suggestionLlmPort.propose(any()))
                .thenAnswer(
                        invocation -> {
                            SuggestionBrief brief = invocation.getArgument(0);
                            Assertions.assertThat(brief.safeExposures()).isEmpty();
                            SuggestionCandidate first = brief.candidates().get(0);
                            return Optional.of(
                                    new LlmSuggestionChoice(
                                            List.of(
                                                    new LlmFoodPick(
                                                            first.foodId(), Familiarity.safe),
                                                    LlmFoodPick.invent(
                                                            "Pickles",
                                                            null,
                                                            Familiarity.truly_new)),
                                            "invent"));
                        });

        mockMvc.perform(get("/api/sessions/suggestions/next").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("heuristic"))
                .andExpect(jsonPath("$.foods[0].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[1].foodId").isNotEmpty())
                .andExpect(jsonPath("$.foods[0].proposedName").value(nullValue()))
                .andExpect(jsonPath("$.foods[1].proposedName").value(nullValue()));
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
        Assertions.assertThat(body).doesNotContain(privateFoodId);

        String scheduledOn = jsonStringField(body, "scheduledOn");
        Matcher foodIds = Pattern.compile("\"foodId\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        Assertions.assertThat(foodIds.find()).isTrue();
        String firstFood = foodIds.group(1);
        Assertions.assertThat(foodIds.find()).isTrue();
        String secondFood = foodIds.group(1);

        Matcher familiarities =
                Pattern.compile("\"familiarity\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        Assertions.assertThat(familiarities.find()).isTrue();
        String fam1 = familiarities.group(1);
        Assertions.assertThat(familiarities.find()).isTrue();
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

    private void upsertSafeExposure(String token, String foodId) throws Exception {
        mockMvc.perform(
                        put("/api/foods/" + foodId + "/exposures")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"variantKey":"","familiarity":"safe"}
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.familiarity").value("safe"));
    }

    /** Completes truly_new foods with liked=no to trigger slow_down / pull_back pacing. */
    private void planAndCompleteTrulyNewRejected(
            String token, String scheduledOn, String food1, String food2) throws Exception {
        MvcResult created =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                createBody(
                                                        scheduledOn,
                                                        food1,
                                                        "truly_new",
                                                        null,
                                                        food2,
                                                        "truly_new",
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
                                            {"position":1,"liked":"no","ateEnough":false},
                                            {"position":2,"liked":"no","ateEnough":false}
                                          ]
                                        }
                                        """))
                .andExpect(status().isOk());
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

    /** Completes without like+ateEnough so outcome hooks do not create safe exposures. */
    private void planAndCompleteSoft(String token, String scheduledOn, String food1, String food2)
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
                                                        "truly_new",
                                                        null,
                                                        food2,
                                                        "truly_new",
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
                                            {"position":1,"liked":"so_so","ateEnough":false},
                                            {"position":2,"liked":"so_so","ateEnough":false}
                                          ]
                                        }
                                        """))
                .andExpect(status().isOk());
    }

    private static String day(int offsetDays) {
        return LocalDate.now(ZoneId.of("America/New_York")).plusDays(offsetDays).toString();
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
