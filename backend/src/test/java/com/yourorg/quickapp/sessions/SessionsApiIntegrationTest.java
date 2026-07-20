package com.yourorg.quickapp.sessions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.nio.charset.StandardCharsets;
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
class SessionsApiIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
    private static final String APPLES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04";
    private static final String STRAWBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05";
    private static final String BLUEBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createListGetUpdateCancelAndScoping() throws Exception {
        String token = register("sessions-" + System.nanoTime() + "@example.com");

        mockMvc.perform(get("/api/sessions")).andExpect(status().isUnauthorized());

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {
                                                  "scheduledOn":"2026-07-20",
                                                  "foods":[
                                                    {"foodId":"%s","familiarity":"likes","variantNote":"Honeycrisp"},
                                                    {"foodId":"%s","familiarity":"truly_new"}
                                                  ]
                                                }
                                                """
                                                        .formatted(APPLES, STRAWBERRIES)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.status").value("planned"))
                        .andExpect(jsonPath("$.scheduledOn").value("2026-07-20"))
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
                                        """
                                        {
                                          "scheduledOn":"2026-07-22",
                                          "foods":[
                                            {"foodId":"%s","familiarity":"familiar_but_new","variantNote":"TJ's"},
                                            {"foodId":"%s","familiarity":"likes"}
                                          ]
                                        }
                                        """
                                                .formatted(STRAWBERRIES, BLUEBERRIES)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduledOn").value("2026-07-22"))
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
                                        """
                                        {
                                          "scheduledOn":"2026-07-23",
                                          "foods":[
                                            {"foodId":"%s","familiarity":"likes"},
                                            {"foodId":"%s","familiarity":"likes"}
                                          ]
                                        }
                                        """
                                                .formatted(APPLES, STRAWBERRIES)))
                .andExpect(status().isConflict());

        String tokenB = register("sessions-b-" + System.nanoTime() + "@example.com");
        mockMvc.perform(get("/api/sessions/" + sessionId).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void createRejectsInvalidFoodCountAndUnknownFood() throws Exception {
        String token = register("sessions-bad-" + System.nanoTime() + "@example.com");

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "scheduledOn":"2026-07-20",
                                          "foods":[
                                            {"foodId":"%s","familiarity":"likes"}
                                          ]
                                        }
                                        """
                                                .formatted(APPLES)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "scheduledOn":"2026-07-20",
                                          "foods":[
                                            {"foodId":"%s","familiarity":"likes"},
                                            {"foodId":"ffffffff-ffff-ffff-ffff-ffffffffffff","familiarity":"likes"}
                                          ]
                                        }
                                        """
                                                .formatted(APPLES)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(
                        post("/api/sessions")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "scheduledOn":"2026-07-20",
                                          "foods":[
                                            {"foodId":"%s","familiarity":"nope"},
                                            {"foodId":"%s","familiarity":"likes"}
                                          ]
                                        }
                                        """
                                                .formatted(APPLES, STRAWBERRIES)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void completePersistsOutcomesAndLeavesUpcomingList() throws Exception {
        String token = register("sessions-run-" + System.nanoTime() + "@example.com");

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/sessions")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {
                                                  "scheduledOn":"2026-07-21",
                                                  "foods":[
                                                    {"foodId":"%s","familiarity":"likes"},
                                                    {"foodId":"%s","familiarity":"truly_new"}
                                                  ]
                                                }
                                                """
                                                        .formatted(APPLES, STRAWBERRIES)))
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
                                              "smell":"mild",
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
    void listHistoryReturnsCompletedNewestFirstAndSkipsPlannedOrCancelled() throws Exception {
        String token = register("sessions-history-" + System.nanoTime() + "@example.com");

        mockMvc.perform(get("/api/sessions/history")).andExpect(status().isUnauthorized());

        String olderId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"2026-07-10",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"likes"},
                                                            {"foodId":"%s","familiarity":"truly_new"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(APPLES, STRAWBERRIES)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String newerId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"2026-07-21",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"likes","variantNote":"Honeycrisp"},
                                                            {"foodId":"%s","familiarity":"familiar_but_new"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(APPLES, BLUEBERRIES)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String cancelledId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"2026-07-15",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"likes"},
                                                            {"foodId":"%s","familiarity":"likes"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(STRAWBERRIES, BLUEBERRIES)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String plannedId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"2026-07-30",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"likes"},
                                                            {"foodId":"%s","familiarity":"truly_new"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(APPLES, STRAWBERRIES)))
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
                .andExpect(jsonPath("$[0].scheduledOn").value("2026-07-21"))
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

        mockMvc.perform(get("/api/sessions/history.pdf")).andExpect(status().isUnauthorized());

        String olderId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"2026-07-10",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"likes"},
                                                            {"foodId":"%s","familiarity":"truly_new"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(APPLES, STRAWBERRIES)))
                                .andExpect(status().isCreated())
                                .andReturn());
        String newerId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"2026-07-21",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"likes","variantNote":"Honeycrisp"},
                                                            {"foodId":"%s","familiarity":"familiar_but_new"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(APPLES, BLUEBERRIES)))
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
                                        .param("from", "2026-07-15")
                                        .param("to", "2026-07-31")
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn();
        byte[] filteredPdf = filteredResult.getResponse().getContentAsByteArray();
        assertThat(filteredPdf).startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));

        MvcResult emptyResult =
                mockMvc.perform(
                                get("/api/sessions/history.pdf")
                                        .param("from", "2026-01-01")
                                        .param("to", "2026-01-31")
                                        .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn();
        assertThat(emptyResult.getResponse().getContentAsByteArray())
                .startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));

        mockMvc.perform(
                        get("/api/sessions/history.pdf")
                                .param("from", "2026-07-31")
                                .param("to", "2026-07-01")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        mockMvc.perform(
                        get("/api/sessions/history.pdf")
                                .param("from", "not-a-date")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
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
