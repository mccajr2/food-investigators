package com.yourorg.quickapp.foods;

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

    @Test
    void listCreateUpdateArchiveAndSystemImmutability() throws Exception {
        String token = register("foods-" + System.nanoTime() + "@example.com");

        mockMvc.perform(get("/api/foods")).andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Apples')].system").value(true))
                .andExpect(jsonPath("$.length()").value(23))
                .andExpect(jsonPath("$[?(@.iconKey == 'cheese_pizza')].name").value("Cheese pizza"))
                .andExpect(jsonPath("$[?(@.iconKey == 'soft_pretzel')].name").value("Soft pretzels"))
                .andExpect(jsonPath("$[?(@.iconKey == 'raspberry')].name").value("Raspberries"));

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
                .andExpect(jsonPath("$.length()").value(24))
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
                .andExpect(jsonPath("$.length()").value(23))
                .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(foodId)).isEmpty());

        mockMvc.perform(
                        get("/api/foods")
                                .param("includeArchived", "true")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(24))
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
                .andExpect(jsonPath("$.length()").value(23))
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
