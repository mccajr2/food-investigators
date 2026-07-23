package com.yourorg.quickapp.sessions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
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
class SessionsApiIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
    private static final String APPLES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04";
    private static final String STRAWBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05";
    private static final String BLUEBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13";
    private static final String BAGEL = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createListGetUpdateCancelAndScoping() throws Exception {
        String token = register("sessions-" + System.nanoTime() + "@example.com");
        String day0 = day(0);
        String day2 = day(2);
        String day3 = day(3);

        mockMvc.perform(get("/api/sessions")).andExpect(status().isUnauthorized());

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(createBody(day0, APPLES, "likes", "Honeycrisp", STRAWBERRIES, "truly_new", null)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.status").value("planned"))
                        .andExpect(jsonPath("$.scheduledOn").value(day0))
                        .andExpect(jsonPath("$.foods.length()").value(2))
                        .andExpect(jsonPath("$.foods[0].name").value("Apples"))
                        .andExpect(jsonPath("$.foods[0].variantNote").value("Honeycrisp"))
                        .andExpect(jsonPath("$.foods[1].familiarity").value("truly_new"))
                        .andReturn();

        String sessionId = idFrom(createResult);

        mockMvc.perform(get("/api/sessions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(sessionId));

        mockMvc.perform(get("/api/sessions/" + sessionId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionId));

        mockMvc.perform(
                        put("/api/sessions/" + sessionId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                day2,
                                                STRAWBERRIES,
                                                "familiar_but_new",
                                                "TJ's",
                                                BLUEBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduledOn").value(day2))
                .andExpect(jsonPath("$.foods[0].foodId").value(STRAWBERRIES))
                .andExpect(jsonPath("$.foods[0].variantNote").value("TJ's"))
                .andExpect(jsonPath("$.foods[1].foodId").value(BLUEBERRIES));

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/cancel")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cancelled"));

        mockMvc.perform(get("/api/sessions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(
                        put("/api/sessions/" + sessionId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                day3, APPLES, "likes", null, STRAWBERRIES, "likes", null)))
                .andExpect(status().isConflict());

        String tokenB = register("sessions-b-" + System.nanoTime() + "@example.com");
        mockMvc.perform(get("/api/sessions/" + sessionId).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void createRejectsInvalidFoodCountAndUnknownFood() throws Exception {
        String token = register("sessions-bad-" + System.nanoTime() + "@example.com");
        String day0 = day(0);

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "scheduledOn":"%s",
                                          "foods":[
                                            {"foodId":"%s","familiarity":"likes"}
                                          ]
                                        }
                                        """
                                                .formatted(day0, APPLES)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                day0,
                                                APPLES,
                                                "likes",
                                                null,
                                                "ffffffff-ffff-ffff-ffff-ffffffffffff",
                                                "likes",
                                                null)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "scheduledOn":"%s",
                                          "foods":[
                                            {"foodId":"%s","familiarity":"nope"},
                                            {"foodId":"%s","familiarity":"likes"}
                                          ]
                                        }
                                        """
                                                .formatted(day0, APPLES, STRAWBERRIES)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createRejectsSnackFood() throws Exception {
        String token = register("sessions-snack-" + System.nanoTime() + "@example.com");
        String day0 = day(0);

        MvcResult snackResult =
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
                        .andExpect(status().isCreated())
                        .andReturn();
        String snackId = idFrom(snackResult);

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                day0,
                                                snackId,
                                                "likes",
                                                null,
                                                STRAWBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isBadRequest());

        MvcResult planned =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                createBody(
                                                        day0,
                                                        APPLES,
                                                        "likes",
                                                        null,
                                                        STRAWBERRIES,
                                                        "likes",
                                                        null)))
                        .andExpect(status().isCreated())
                        .andReturn();
        String sessionId = idFrom(planned);

        mockMvc.perform(
                        put("/api/sessions/" + sessionId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                day(1),
                                                snackId,
                                                "likes",
                                                null,
                                                BLUEBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void planGuardsRejectPastDateDayConflictsAndSameFoodVariants() throws Exception {
        String token = register("sessions-guards-" + System.nanoTime() + "@example.com");
        String today = day(0);
        String tomorrow = day(1);
        String dayAfter = day(2);
        String yesterday = day(-1);

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                yesterday,
                                                APPLES,
                                                "likes",
                                                null,
                                                STRAWBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Scheduled date can't be in the past"));

        MvcResult createdToday =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                createBody(
                                                        today,
                                                        APPLES,
                                                        "likes",
                                                        null,
                                                        STRAWBERRIES,
                                                        "likes",
                                                        null)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.scheduledOn").value(today))
                        .andReturn();
        String todaySessionId = idFrom(createdToday);

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                today,
                                                APPLES,
                                                "likes",
                                                null,
                                                BLUEBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A session already exists on that date"));

        mockMvc.perform(
                        put("/api/sessions/" + todaySessionId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                yesterday,
                                                APPLES,
                                                "likes",
                                                null,
                                                STRAWBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Scheduled date can't be in the past"));

        String otherId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                tomorrow,
                                                                APPLES,
                                                                "likes",
                                                                null,
                                                                STRAWBERRIES,
                                                                "likes",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());

        mockMvc.perform(
                        put("/api/sessions/" + otherId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                today,
                                                APPLES,
                                                "likes",
                                                null,
                                                STRAWBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A session already exists on that date"));

        mockMvc.perform(
                        put("/api/sessions/" + otherId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                tomorrow,
                                                STRAWBERRIES,
                                                "likes",
                                                null,
                                                BLUEBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduledOn").value(tomorrow));

        mockMvc.perform(
                        post("/api/sessions/" + otherId + "/cancel")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                tomorrow,
                                                APPLES,
                                                "likes",
                                                null,
                                                STRAWBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isCreated());

        completeSession(token, todaySessionId, "like", true);

        mockMvc.perform(
                        put("/api/sessions/" + todaySessionId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                dayAfter,
                                                APPLES,
                                                "likes",
                                                null,
                                                STRAWBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Session cannot be edited"));

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                today,
                                                APPLES,
                                                "likes",
                                                null,
                                                STRAWBERRIES,
                                                "likes",
                                                null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A session already exists on that date"));

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                dayAfter,
                                                BAGEL,
                                                "likes",
                                                "Bagelsaurus",
                                                BAGEL,
                                                "familiar_but_new",
                                                "Iggy's")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.foods[0].foodId").value(BAGEL))
                .andExpect(jsonPath("$.foods[1].foodId").value(BAGEL))
                .andExpect(jsonPath("$.foods[0].variantNote").value("Bagelsaurus"))
                .andExpect(jsonPath("$.foods[1].variantNote").value("Iggy's"));

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                day(3),
                                                BAGEL,
                                                "likes",
                                                "Iggy's",
                                                BAGEL,
                                                "likes",
                                                "iggy's")))
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.message")
                                .value("Same food needs two different brand/variety notes"));

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                day(4),
                                                BAGEL,
                                                "likes",
                                                null,
                                                BAGEL,
                                                "likes",
                                                "Iggy's")))
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.message")
                                .value("Same food needs two different brand/variety notes"));
    }

    @Test
    void completePersistsOutcomesAndLeavesUpcomingList() throws Exception {
        String token = register("sessions-run-" + System.nanoTime() + "@example.com");
        String day0 = day(0);

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                createBody(
                                                        day0,
                                                        APPLES,
                                                        "likes",
                                                        null,
                                                        STRAWBERRIES,
                                                        "truly_new",
                                                        null)))
                        .andExpect(status().isCreated())
                        .andReturn();
        String sessionId = idFrom(createResult);

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "foods":[
                                            {
                                              "position":1,
                                              "liked":"like",
                                              "texture":"crunchy",
                                              "temperature":"cold",
                                              "smell":"like",
                                              "whyNote":"crunchy",
                                              "changeNote":"less peel",
                                              "ateEnough":true
                                            },
                                            {
                                              "position":2,
                                              "liked":"no",
                                              "texture":"wet",
                                              "temperature":"warm",
                                              "ateEnough":false
                                            }
                                          ]
                                        }
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.parentNote").value(nullValue()))
                .andExpect(jsonPath("$.foods[0].liked").value("like"))
                .andExpect(jsonPath("$.foods[0].texture").value("crunchy"))
                .andExpect(jsonPath("$.foods[0].whyNote").value("crunchy"))
                .andExpect(jsonPath("$.foods[0].changeNote").value("less peel"))
                .andExpect(jsonPath("$.foods[0].ateEnough").value(true))
                .andExpect(jsonPath("$.foods[1].liked").value("no"))
                .andExpect(jsonPath("$.foods[1].ateEnough").value(false));

        mockMvc.perform(get("/api/sessions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "foods":[
                                            {"position":1,"ateEnough":true},
                                            {"position":2,"ateEnough":true}
                                          ]
                                        }
                                        """))
                .andExpect(status().isConflict());
    }

    @Test
    void completeRejectsUnknownSmellWithBadRequestNotUnauthorized() throws Exception {
        String token = register("sessions-smell-" + System.nanoTime() + "@example.com");
        String sessionId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                day(0),
                                                                APPLES,
                                                                "likes",
                                                                null,
                                                                STRAWBERRIES,
                                                                "truly_new",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "foods":[
                                            {"position":1,"smell":"mild","ateEnough":true},
                                            {"position":2,"ateEnough":false}
                                          ]
                                        }
                                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid request"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void listHistoryReturnsCompletedNewestFirstAndSkipsPlannedOrCancelled() throws Exception {
        String token = register("sessions-history-" + System.nanoTime() + "@example.com");
        String olderDay = day(0);
        String newerDay = day(1);
        String cancelledDay = day(2);
        String plannedDay = day(3);

        mockMvc.perform(get("/api/sessions/history")).andExpect(status().isUnauthorized());

        String olderId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                olderDay,
                                                                APPLES,
                                                                "likes",
                                                                null,
                                                                STRAWBERRIES,
                                                                "truly_new",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String newerId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                newerDay,
                                                                APPLES,
                                                                "likes",
                                                                "Honeycrisp",
                                                                BLUEBERRIES,
                                                                "familiar_but_new",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String cancelledId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                cancelledDay,
                                                                STRAWBERRIES,
                                                                "likes",
                                                                null,
                                                                BLUEBERRIES,
                                                                "likes",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String plannedId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                plannedDay,
                                                                APPLES,
                                                                "likes",
                                                                null,
                                                                STRAWBERRIES,
                                                                "truly_new",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());

        completeSession(token, olderId, "like", true);
        completeSession(token, newerId, "so_so", false);

        mockMvc.perform(
                        post("/api/sessions/" + cancelledId + "/cancel")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/sessions/history").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(newerId))
                .andExpect(jsonPath("$[0].status").value("completed"))
                .andExpect(jsonPath("$[0].scheduledOn").value(newerDay))
                .andExpect(jsonPath("$[0].foods[0].variantNote").value("Honeycrisp"))
                .andExpect(jsonPath("$[0].foods[0].liked").value("so_so"))
                .andExpect(jsonPath("$[0].foods[0].ateEnough").value(false))
                .andExpect(jsonPath("$[1].id").value(olderId))
                .andExpect(jsonPath("$[1].foods[0].liked").value("like"))
                .andExpect(jsonPath("$[1].foods[0].ateEnough").value(true));

        mockMvc.perform(get("/api/sessions/" + newerId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.foods[0].liked").value("so_so"));

        mockMvc.perform(get("/api/sessions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(plannedId));

        String otherToken = register("sessions-history-other-" + System.nanoTime() + "@example.com");
        mockMvc.perform(get("/api/sessions/history").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/sessions/" + newerId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void exportHistoryPdfReturnsPdfFilteredByDateAndRejectsBadRange() throws Exception {
        String token = register("sessions-pdf-" + System.nanoTime() + "@example.com");
        String olderDay = day(0);
        String newerDay = day(1);

        mockMvc.perform(get("/api/sessions/history.pdf")).andExpect(status().isUnauthorized());

        String olderId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                olderDay,
                                                                APPLES,
                                                                "likes",
                                                                null,
                                                                STRAWBERRIES,
                                                                "truly_new",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String newerId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                newerDay,
                                                                APPLES,
                                                                "likes",
                                                                "Honeycrisp",
                                                                BLUEBERRIES,
                                                                "familiar_but_new",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());

        completeSession(token, olderId, "like", true);
        completeSession(token, newerId, "so_so", false);

        MvcResult fullResult =
                mockMvc.perform(
                                get("/api/sessions/history.pdf")
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andExpect(header().string("Content-Type", "application/pdf"))
                        .andExpect(
                                header().string(
                                                "Content-Disposition",
                                                "attachment; filename=\"tasting-history.pdf\""))
                        .andReturn();
        byte[] fullPdf = fullResult.getResponse().getContentAsByteArray();
        assertThat(fullPdf).startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));

        MvcResult filteredResult =
                mockMvc.perform(
                                get("/api/sessions/history.pdf")
                                        .param("from", newerDay)
                                        .param("to", newerDay)
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn();
        byte[] filteredPdf = filteredResult.getResponse().getContentAsByteArray();
        assertThat(filteredPdf).startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));

        MvcResult emptyResult =
                mockMvc.perform(
                                get("/api/sessions/history.pdf")
                                        .param("from", "2020-01-01")
                                        .param("to", "2020-01-31")
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn();
        assertThat(emptyResult.getResponse().getContentAsByteArray())
                .startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));

        mockMvc.perform(
                        get("/api/sessions/history.pdf")
                                .param("from", day(10))
                                .param("to", day(0))
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        mockMvc.perform(
                        get("/api/sessions/history.pdf")
                                .param("from", "not-a-date")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void parentNotePatchOnCompletedAppearsInHistoryAndPdf() throws Exception {
        String token = register("sessions-parent-note-" + System.nanoTime() + "@example.com");
        String day0 = day(0);
        String day1 = day(1);

        String plannedId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                day0,
                                                                APPLES,
                                                                "likes",
                                                                null,
                                                                STRAWBERRIES,
                                                                "truly_new",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());

        mockMvc.perform(
                        patch("/api/sessions/" + plannedId + "/parent-note")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"parentNote\":\"too early\"}"))
                .andExpect(status().isConflict())
                .andExpect(
                        jsonPath("$.message")
                                .value("Parent notes can only be saved on completed sessions"));

        completeSession(token, plannedId, "like", true);

        mockMvc.perform(
                        patch("/api/sessions/" + plannedId + "/parent-note")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"parentNote\":\"  tired after school  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.parentNote").value("tired after school"))
                .andExpect(jsonPath("$.foods[0].liked").value("like"));

        mockMvc.perform(get("/api/sessions/" + plannedId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parentNote").value("tired after school"));

        mockMvc.perform(get("/api/sessions/history").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(plannedId))
                .andExpect(jsonPath("$[0].parentNote").value("tired after school"));

        mockMvc.perform(
                        patch("/api/sessions/" + plannedId + "/parent-note")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"parentNote\":\"   \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parentNote").value(nullValue()));

        mockMvc.perform(
                        patch("/api/sessions/" + plannedId + "/parent-note")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"parentNote\":\"clinic was loud\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parentNote").value("clinic was loud"));

        String cancelledId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        createBody(
                                                                day1,
                                                                APPLES,
                                                                "likes",
                                                                null,
                                                                BLUEBERRIES,
                                                                "likes",
                                                                null)))
                                .andExpect(status().isCreated())
                                .andReturn());
        mockMvc.perform(
                        post("/api/sessions/" + cancelledId + "/cancel")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(
                        patch("/api/sessions/" + cancelledId + "/parent-note")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"parentNote\":\"nope\"}"))
                .andExpect(status().isConflict());

        String otherToken =
                register("sessions-parent-note-other-" + System.nanoTime() + "@example.com");
        mockMvc.perform(
                        patch("/api/sessions/" + plannedId + "/parent-note")
                                .header("Authorization", "Bearer " + otherToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"parentNote\":\"stolen\"}"))
                .andExpect(status().isNotFound());

        MvcResult pdfResult =
                mockMvc.perform(
                                get("/api/sessions/history.pdf")
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn();
        String pdfText = pdfText(pdfResult.getResponse().getContentAsByteArray());
        assertThat(pdfText).contains("Parent notes: clinic was loud");
        assertThat(pdfText.split("Parent notes:", -1)).hasSize(2);
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
            return "{\"foodId\":\"%s\",\"familiarity\":\"%s\"}"
                    .formatted(foodId, familiarity);
        }
        return "{\"foodId\":\"%s\",\"familiarity\":\"%s\",\"variantNote\":\"%s\"}"
                .formatted(foodId, familiarity, variantNote.replace("\"", "\\\""));
    }

    private void completeSession(String token, String sessionId, String liked, boolean ateEnough)
            throws Exception {
        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "foods":[
                                            {"position":1,"liked":"%s","ateEnough":%s},
                                            {"position":2,"liked":"no","ateEnough":true}
                                          ]
                                        }
                                        """
                                                .formatted(liked, ateEnough)))
                .andExpect(status().isOk());
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

    private static String pdfText(byte[] pdf) throws Exception {
        try (PDDocument document = Loader.loadPDF(pdf)) {
            return new PDFTextStripper().getText(document);
        }
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
