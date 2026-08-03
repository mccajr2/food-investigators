package com.yourorg.quickapp.sessions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import java.time.LocalDate;
import java.time.ZoneId;
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
class FamiliarityFromOutcomesIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
    private static final String APPLES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04";
    private static final String STRAWBERRIES = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void completeUpsertsSafeAndRetryingExposuresFromOutcomes() throws Exception {
        String token = register("outcome-exp-" + System.nanoTime() + "@example.com");
        String otherToken = register("outcome-other-" + System.nanoTime() + "@example.com");
        String day0 = day(0);

        String sessionId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"%s",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"truly_new","variantNote":"  Honeycrisp "},
                                                            {"foodId":"%s","familiarity":"truly_new"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(
                                                                        day0, APPLES, STRAWBERRIES)))
                                .andExpect(status().isCreated())
                                .andReturn());

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(completeBody("like", true, "no", true)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(completeBody("like", true, "no", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"));

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].familiarity"
                                                .formatted(APPLES))
                                .value("safe"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].source"
                                                .formatted(APPLES))
                                .value("outcome"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].attemptCount"
                                                .formatted(APPLES))
                                .value(1))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].lastTriedOn"
                                                .formatted(APPLES))
                                .value(day0))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].lastLiked"
                                                .formatted(APPLES))
                                .value("like"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == '')].familiarity"
                                                .formatted(STRAWBERRIES))
                                .value("retrying"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == '')].source"
                                                .formatted(STRAWBERRIES))
                                .value("outcome"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == '')].attemptCount"
                                                .formatted(STRAWBERRIES))
                                .value(1));

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].exposures.length()".formatted(APPLES)).value(0))
                .andExpect(
                        jsonPath("$[?(@.id == '%s')].exposures.length()".formatted(STRAWBERRIES))
                                .value(0));
    }

    @Test
    void completePreservesExistingSafeOnBadOutcome() throws Exception {
        String token = register("outcome-safe-" + System.nanoTime() + "@example.com");
        String day0 = day(0);

        mockMvc.perform(
                        put("/api/foods/" + APPLES + "/exposures")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"variantKey":"Honeycrisp","familiarity":"safe"}
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.familiarity").value("safe"))
                .andExpect(jsonPath("$.source").value("manual"));

        String sessionId =
                idFrom(
                        mockMvc.perform(
                                        post("/api/sessions")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        """
                                                        {
                                                          "scheduledOn":"%s",
                                                          "foods":[
                                                            {"foodId":"%s","familiarity":"safe","variantNote":"Honeycrisp"},
                                                            {"foodId":"%s","familiarity":"truly_new"}
                                                          ]
                                                        }
                                                        """
                                                                .formatted(
                                                                        day0, APPLES, STRAWBERRIES)))
                                .andExpect(status().isCreated())
                                .andReturn());

        mockMvc.perform(
                        post("/api/sessions/" + sessionId + "/complete")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(completeBody("so_so", false, "like", true)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].familiarity"
                                                .formatted(APPLES))
                                .value("safe"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].source"
                                                .formatted(APPLES))
                                .value("manual"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].attemptCount"
                                                .formatted(APPLES))
                                .value(1))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].lastLiked"
                                                .formatted(APPLES))
                                .value("so_so"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == '')].familiarity"
                                                .formatted(STRAWBERRIES))
                                .value("safe"))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == '')].source"
                                                .formatted(STRAWBERRIES))
                                .value("outcome"));
    }

    private static String completeBody(
            String liked1, boolean ateEnough1, String liked2, boolean ateEnough2) {
        return """
                {
                  "foods":[
                    {"position":1,"liked":"%s","ateEnough":%s},
                    {"position":2,"liked":"%s","ateEnough":%s}
                  ]
                }
                """
                .formatted(liked1, ateEnough1, liked2, ateEnough2);
    }

    private static String day(int offsetDays) {
        return LocalDate.now(ZoneId.of("America/New_York")).plusDays(offsetDays).toString();
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
        Matcher matcher = TOKEN_PATTERN.matcher(result.getResponse().getContentAsString());
        if (!matcher.find()) {
            throw new IllegalStateException("token missing from response");
        }
        return matcher.group(1);
    }

    private static String idFrom(MvcResult result) throws Exception {
        Matcher matcher = ID_PATTERN.matcher(result.getResponse().getContentAsString());
        if (!matcher.find()) {
            throw new IllegalStateException("id missing from response");
        }
        return matcher.group(1);
    }
}
