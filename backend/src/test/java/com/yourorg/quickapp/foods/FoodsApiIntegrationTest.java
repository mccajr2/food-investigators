package com.yourorg.quickapp.foods;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class FoodsApiIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
    private static final String SYSTEM_APPLES_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FoodIllustrationStore illustrations;

    @Test
    void sharedCanonicalKeyReturnsSameIconUrlAcrossHouseholds() throws Exception {
        String expectedUrl =
                illustrations.store(
                        "custom_shared_pickle",
                        new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47},
                        "image/png");

        String tokenA = register("illust-a-" + System.nanoTime() + "@example.com");
        String tokenB = register("illust-b-" + System.nanoTime() + "@example.com");

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + tokenA)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Pickle A","iconKey":"custom_shared_pickle"}
                                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.iconUrl").value(expectedUrl));

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + tokenB)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Pickle B","iconKey":"custom_shared_pickle"}
                                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.iconUrl").value(expectedUrl));

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$[?(@.iconKey == 'custom_shared_pickle')].iconUrl")
                                .value(expectedUrl));
        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$[?(@.iconKey == 'custom_shared_pickle')].iconUrl")
                                .value(expectedUrl));
    }

    @Test
    void listCreateUpdateArchiveAndSystemImmutability() throws Exception {
        String token = register("foods-" + System.nanoTime() + "@example.com");

        mockMvc.perform(get("/api/foods")).andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Apples')].system").value(true))
                .andExpect(jsonPath("$.length()").value(26))
                .andExpect(jsonPath("$[?(@.iconKey == 'cheese_pizza')].name").value("Cheese pizza"))
                .andExpect(jsonPath("$[?(@.iconKey == 'soft_pretzel')].name").value("Soft pretzels"))
                .andExpect(jsonPath("$[?(@.iconKey == 'raspberry')].name").value("Raspberries"))
                .andExpect(jsonPath("$[?(@.iconKey == 'broccoli')].name").value("Broccoli"))
                .andExpect(jsonPath("$[?(@.iconKey == 'dark_chocolate')].name").value("Dark chocolate"))
                .andExpect(jsonPath("$[?(@.iconKey == 'spinach')].name").value("Spinach"));

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/foods")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"name":"Cucumber","iconKey":"custom_cucumber"}
                                                """))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.name").value("Cucumber"))
                        .andExpect(jsonPath("$.iconKey").value("custom_cucumber"))
                        .andExpect(jsonPath("$.system").value(false))
                        .andExpect(jsonPath("$.householdId").isString())
                        .andExpect(jsonPath("$.archivedAt").doesNotExist())
                        .andReturn();

        String foodId = idFrom(createResult);

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(27))
                .andExpect(jsonPath("$[?(@.id == '%s')].name".formatted(foodId)).value("Cucumber"));

        mockMvc.perform(
                        put("/api/foods/" + foodId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Updated mash","iconKey":"sweet_potato"}
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated mash"))
                .andExpect(jsonPath("$.iconKey").value("sweet_potato"));

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Bad","iconKey":"not_a_real_icon"}
                                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid icon key"));

        mockMvc.perform(
                        put("/api/foods/" + foodId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"iconKey":"not_a_real_icon"}
                                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid icon key"));

        mockMvc.perform(
                        put("/api/foods/" + SYSTEM_APPLES_ID)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Hacked"}
                                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("System starter foods cannot be changed"));

        mockMvc.perform(
                        post("/api/foods/" + SYSTEM_APPLES_ID + "/archive")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        post("/api/foods/" + foodId + "/archive")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isString());

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(26))
                .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(foodId)).isEmpty());

        mockMvc.perform(
                        get("/api/foods")
                                .param("includeArchived", "true")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(27))
                .andExpect(jsonPath("$[?(@.id == '%s')].archivedAt".formatted(foodId)).isNotEmpty());
    }

    @Test
    void householdCannotSeeOrMutateOtherHouseholdFood() throws Exception {
        String tokenA = register("foods-a-" + System.nanoTime() + "@example.com");
        String tokenB = register("foods-b-" + System.nanoTime() + "@example.com");

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/foods")
                                        .header("Authorization", "Bearer " + tokenA)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"name":"Only A","iconKey":"banana"}
                                                """))
                        .andExpect(status().isCreated())
                        .andReturn();
        String foodId = idFrom(createResult);

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(26))
                .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(foodId)).isEmpty());

        mockMvc.perform(
                        put("/api/foods/" + foodId)
                                .header("Authorization", "Bearer " + tokenB)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Stolen"}
                                        """))
                .andExpect(status().isNotFound());

        mockMvc.perform(
                        post("/api/foods/" + foodId + "/archive")
                                .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void createAndRenameRejectDuplicateVisibleNames() throws Exception {
        String token = register("foods-dup-" + System.nanoTime() + "@example.com");

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Watermelon","iconKey":"custom_watermelon"}
                                        """))
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"watermelon","iconKey":"custom_watermelon"}
                                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A food with that name already exists"));

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Apples","iconKey":"apple"}
                                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A food with that name already exists"));

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/foods")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"name":"Cucumber","iconKey":"custom_cucumber"}
                                                """))
                        .andExpect(status().isCreated())
                        .andReturn();
        String foodId = idFrom(createResult);

        mockMvc.perform(
                        put("/api/foods/" + foodId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"WATERMELON"}
                                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A food with that name already exists"));

        mockMvc.perform(
                        post("/api/foods/" + foodId + "/archive")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(
                        post("/api/foods")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Cucumber","iconKey":"custom_cucumber"}
                                        """))
                .andExpect(status().isCreated());
    }

    @Test
    void createAndUpdateSnackPreferencesAndRejectSystemSnack() throws Exception {
        String token = register("foods-snack-" + System.nanoTime() + "@example.com");

        mockMvc.perform(
                        post("/api/foods")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "name":"Chips",
                                          "iconKey":"custom_chips",
                                          "sessionEligible":false,
                                          "liked":"like",
                                          "texture":"crunchy",
                                          "tasteNote":"salt"
                                        }
                                        """))
                .andExpect(status().isUnauthorized());

        MvcResult createResult =
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
                                                  "texture":"crunchy",
                                                  "tasteNote":"  salt & vinegar  "
                                                }
                                                """))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.name").value("Salt chips"))
                        .andExpect(jsonPath("$.sessionEligible").value(false))
                        .andExpect(jsonPath("$.liked").value("like"))
                        .andExpect(jsonPath("$.texture").value("crunchy"))
                        .andExpect(jsonPath("$.tasteNote").value("salt & vinegar"))
                        .andExpect(jsonPath("$.exposures.length()").value(1))
                        .andExpect(jsonPath("$.exposures[0].variantKey").value(""))
                        .andExpect(jsonPath("$.exposures[0].familiarity").value("safe"))
                        .andReturn();
        String snackId = idFrom(createResult);

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].sessionEligible".formatted(snackId)).value(false))
                .andExpect(jsonPath("$[?(@.id == '%s')].tasteNote".formatted(snackId)).value("salt & vinegar"))
                .andExpect(
                        jsonPath("$[?(@.id == '%s')].exposures[0].familiarity".formatted(snackId))
                                .value("safe"));

        mockMvc.perform(
                        put("/api/foods/" + snackId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "liked":"so_so",
                                          "texture":"chewy",
                                          "tasteNote":"   "
                                        }
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionEligible").value(false))
                .andExpect(jsonPath("$.liked").value("so_so"))
                .andExpect(jsonPath("$.texture").value("chewy"))
                .andExpect(jsonPath("$.tasteNote").value(nullValue()));

        String tooLong = "x".repeat(101);
        mockMvc.perform(
                        put("/api/foods/" + snackId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"tasteNote":"%s"}
                                        """
                                                .formatted(tooLong)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid request"));

        MvcResult tastingResult =
                mockMvc.perform(
                                post("/api/foods")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                """
                                                {"name":"Cucumber","iconKey":"custom_cucumber"}
                                                """))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.sessionEligible").value(true))
                        .andExpect(jsonPath("$.liked").value(nullValue()))
                        .andExpect(jsonPath("$.texture").value(nullValue()))
                        .andExpect(jsonPath("$.tasteNote").value(nullValue()))
                        .andReturn();
        String tastingId = idFrom(tastingResult);

        mockMvc.perform(
                        put("/api/foods/" + tastingId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "sessionEligible":false,
                                          "liked":"no",
                                          "texture":"wet",
                                          "tasteNote":"sour"
                                        }
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionEligible").value(false))
                .andExpect(jsonPath("$.liked").value("no"))
                .andExpect(jsonPath("$.texture").value("wet"))
                .andExpect(jsonPath("$.tasteNote").value("sour"));

        mockMvc.perform(
                        put("/api/foods/" + SYSTEM_APPLES_ID)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"sessionEligible":false,"liked":"like"}
                                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("System starter foods cannot be changed"));
    }

    @Test
    void upsertClearExposureOnSystemFoodAndIsolateHouseholds() throws Exception {
        String tokenA = register("exp-a-" + System.nanoTime() + "@example.com");
        String tokenB = register("exp-b-" + System.nanoTime() + "@example.com");

        mockMvc.perform(
                        put("/api/foods/" + SYSTEM_APPLES_ID + "/exposures")
                                .header("Authorization", "Bearer " + tokenA)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"variantKey":"  Bagelsaurus  ","familiarity":"safe"}
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foodId").value(SYSTEM_APPLES_ID))
                .andExpect(jsonPath("$.variantKey").value("bagelsaurus"))
                .andExpect(jsonPath("$.familiarity").value("safe"))
                .andExpect(jsonPath("$.source").value("manual"));

        mockMvc.perform(
                        put("/api/foods/" + SYSTEM_APPLES_ID + "/exposures")
                                .header("Authorization", "Bearer " + tokenA)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"variantKey":"BAGELSAURUS","familiarity":"retrying"}
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.variantKey").value("bagelsaurus"))
                .andExpect(jsonPath("$.familiarity").value("retrying"));

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'bagelsaurus')].familiarity"
                                                .formatted(SYSTEM_APPLES_ID))
                                .value("retrying"));

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$[?(@.id == '%s')].exposures.length()".formatted(SYSTEM_APPLES_ID))
                                .value(0));

        mockMvc.perform(
                        delete("/api/foods/" + SYSTEM_APPLES_ID + "/exposures")
                                .header("Authorization", "Bearer " + tokenA)
                                .param("variantKey", "Bagelsaurus"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$[?(@.id == '%s')].exposures.length()".formatted(SYSTEM_APPLES_ID))
                                .value(0));

        mockMvc.perform(
                        put("/api/foods/" + SYSTEM_APPLES_ID + "/exposures")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"familiarity\":\"safe\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bootstrapSafesMatchInventSnackCapAndAuth() throws Exception {
        String token = register("bootstrap-" + System.nanoTime() + "@example.com");

        mockMvc.perform(
                        post("/api/foods/bootstrap-safes")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"items":[{"name":"Cucumber","sessionEligible":true}]}
                                        """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        post("/api/foods/bootstrap-safes")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"items\":[]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(
                        post("/api/foods/bootstrap-safes")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "items": [
                                            {"name":"Apples","variantKey":"Honeycrisp","sessionEligible":true},
                                            {"name":"Cucumber","sessionEligible":true},
                                            {"name":"Goldfish","sessionEligible":false}
                                          ]
                                        }
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].foodId").value(SYSTEM_APPLES_ID))
                .andExpect(jsonPath("$[0].variantKey").value("honeycrisp"))
                .andExpect(jsonPath("$[0].familiarity").value("safe"))
                .andExpect(jsonPath("$[0].source").value("signup"))
                .andExpect(jsonPath("$[1].familiarity").value("safe"))
                .andExpect(jsonPath("$[1].source").value("signup"))
                .andExpect(jsonPath("$[2].familiarity").value("safe"))
                .andExpect(jsonPath("$[2].source").value("signup"));

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Apples')].system").value(true))
                .andExpect(
                        jsonPath(
                                        "$[?(@.id == '%s')].exposures[?(@.variantKey == 'honeycrisp')].source"
                                                .formatted(SYSTEM_APPLES_ID))
                                .value("signup"))
                .andExpect(jsonPath("$[?(@.name == 'Cucumber')].system").value(false))
                .andExpect(jsonPath("$[?(@.name == 'Cucumber')].sessionEligible").value(true))
                .andExpect(jsonPath("$[?(@.name == 'Cucumber')].iconKey").value("custom_cucumber"))
                .andExpect(
                        jsonPath("$[?(@.name == 'Cucumber')].exposures[0].source").value("signup"))
                .andExpect(jsonPath("$[?(@.name == 'Goldfish')].sessionEligible").value(false))
                .andExpect(
                        jsonPath("$[?(@.name == 'Goldfish')].exposures[0].source").value("signup"));

        // Matching Apples must not create a second household "Apples" row.
        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Apples' && @.system == false)]").isEmpty());

        mockMvc.perform(
                        post("/api/foods/bootstrap-safes")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {
                                          "items": [
                                            {"name":"Bagel","variantKey":"a"},
                                            {"name":"bagel","variantKey":"A"}
                                          ]
                                        }
                                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Duplicate")));

        StringBuilder tooMany = new StringBuilder("{\"items\":[");
        for (int i = 0; i < 11; i++) {
            if (i > 0) {
                tooMany.append(',');
            }
            tooMany.append("{\"name\":\"Food").append(i).append("\"}");
        }
        tooMany.append("]}");
        mockMvc.perform(
                        post("/api/foods/bootstrap-safes")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(tooMany.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("10")));
    }

    @Test
    void stretchTargetsListAddInventRemoveCapAndAuth() throws Exception {
        String token = register("stretch-" + System.nanoTime() + "@example.com");
        String broccoliId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa24";

        mockMvc.perform(get("/api/foods/stretch-targets")).andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/foods/stretch-targets").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(
                        post("/api/foods/stretch-targets")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"foodId":"%s","variantKey":"  Steamed  "}
                                        """
                                                .formatted(broccoliId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.foodId").value(broccoliId))
                .andExpect(jsonPath("$.foodName").value("Broccoli"))
                .andExpect(jsonPath("$.variantKey").value("steamed"));

        mockMvc.perform(
                        post("/api/foods/stretch-targets")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"Ground beef","variantKey":"taco night"}
                                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.foodName").value("Ground beef"))
                .andExpect(jsonPath("$.variantKey").value("taco night"))
                .andExpect(jsonPath("$.foodId").isString());

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Ground beef')].sessionEligible").value(true))
                .andExpect(jsonPath("$[?(@.name == 'Ground beef')].exposures.length()").value(0));

        mockMvc.perform(get("/api/foods/stretch-targets").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].foodName").value("Broccoli"))
                .andExpect(jsonPath("$[1].foodName").value("Ground beef"));

        mockMvc.perform(
                        post("/api/foods/stretch-targets")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"foodId":"%s","variantKey":"steamed"}
                                        """
                                                .formatted(broccoliId)))
                .andExpect(status().isConflict())
                .andExpect(
                        jsonPath("$.message")
                                .value("That stretch target is already on the list"));

        mockMvc.perform(
                        delete("/api/foods/stretch-targets/" + broccoliId)
                                .header("Authorization", "Bearer " + token)
                                .param("variantKey", "Steamed"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/foods/stretch-targets").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].foodName").value("Ground beef"));

        for (int i = 0; i < 4; i++) {
            mockMvc.perform(
                            post("/api/foods/stretch-targets")
                                    .header("Authorization", "Bearer " + token)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"name":"Stretch food %d"}
                                            """
                                                    .formatted(i)))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(
                        post("/api/foods/stretch-targets")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"One too many\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("5")));
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
