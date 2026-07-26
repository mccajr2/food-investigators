package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.GeminiProperties;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * Calls Gemini Flash with structured JSON. Uses JDK HttpClient — no extra Gemini SDK
 * dependency.
 */
@Component
class GeminiSuggestionLlmClient implements SuggestionLlmPort {

    private static final Logger log = LoggerFactory.getLogger(GeminiSuggestionLlmClient.class);

    private final GeminiProperties properties;
    private final JsonMapper jsonMapper;
    private final HttpClient httpClient;

    GeminiSuggestionLlmClient(GeminiProperties properties, JsonMapper jsonMapper) {
        this.properties = properties;
        this.jsonMapper = jsonMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    @Override
    public Optional<LlmSuggestionChoice> propose(SuggestionBrief brief) {
        if (!properties.configured()) {
            return Optional.empty();
        }
        try {
            String body = jsonMapper.writeValueAsString(buildRequest(brief));
            URI uri =
                    URI.create(
                            properties.apiBaseUrl()
                                    + "/models/"
                                    + properties.model()
                                    + ":generateContent?key="
                                    + properties.apiKey());
            HttpRequest request =
                    HttpRequest.newBuilder(uri)
                            .timeout(Duration.ofSeconds(30))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build();
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Gemini suggestion call failed with HTTP {}", response.statusCode());
                return Optional.empty();
            }
            return parseChoice(response.body());
        } catch (Exception ex) {
            log.warn("Gemini suggestion call failed: {}", ex.toString());
            return Optional.empty();
        }
    }

    private ObjectNode buildRequest(SuggestionBrief brief) {
        ObjectNode root = jsonMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        ObjectNode content = contents.addObject();
        content.put("role", "user");
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", promptFor(brief));

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.2);
        generationConfig.put("responseMimeType", "application/json");
        return root;
    }

    private String promptFor(SuggestionBrief brief) {
        try {
            ObjectNode payload = jsonMapper.createObjectNode();
            payload.put("completedSessionCount", brief.completedSessionCount());
            payload.put("paceHint", brief.paceHint());
            payload.set(
                    "topLikedTextures", jsonMapper.valueToTree(brief.topLikedTextures()));
            payload.set("topLikedTastes", jsonMapper.valueToTree(brief.topLikedTastes()));
            payload.put("familiaritySafe", brief.familiaritySafe());
            payload.put("familiarityFamiliarButNew", brief.familiarityFamiliarButNew());
            payload.put("familiarityTrulyNew", brief.familiarityTrulyNew());
            payload.put("ateEnoughYes", brief.ateEnoughYes());
            payload.put("ateEnoughNo", brief.ateEnoughNo());
            ArrayNode candidates = payload.putArray("candidates");
            for (SuggestionCandidate candidate : brief.candidates()) {
                ObjectNode node = candidates.addObject();
                node.put("foodId", candidate.foodId().toString());
                node.put("name", candidate.name());
                node.put("iconKey", candidate.iconKey());
                node.put("hint", candidate.hint());
            }
            return """
                    You help a parent plan a calm two-food tasting night for a picky eater.
                    Choose exactly TWO distinct foods from candidates only (use foodId values).
                    Assign familiarity for each: safe, familiar_but_new, truly_new, or retrying.
                    Respect paceHint: pull_back = stay gentle; gentle_stretch = one mild stretch OK; steady = balanced.
                    Reply with JSON only: {"foods":[{"foodId":"...","familiarity":"..."},{"foodId":"...","familiarity":"..."}],"rationale":"one short calm sentence"}
                    Context:
                    """
                    + jsonMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to build Gemini prompt", ex);
        }
    }

    Optional<LlmSuggestionChoice> parseChoice(String responseBody) {
        JsonNode root = jsonMapper.readTree(responseBody);
        JsonNode textNode =
                root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (!textNode.isTextual()) {
            return Optional.empty();
        }
        JsonNode parsed = jsonMapper.readTree(textNode.asText());
        JsonNode foodsNode = parsed.path("foods");
        if (!foodsNode.isArray() || foodsNode.size() != 2) {
            return Optional.empty();
        }
        List<LlmFoodPick> picks = new ArrayList<>(2);
        for (JsonNode foodNode : foodsNode) {
            UUID foodId = UUID.fromString(foodNode.path("foodId").asText());
            Familiarity familiarity =
                    Familiarity.valueOf(foodNode.path("familiarity").asText());
            picks.add(new LlmFoodPick(foodId, familiarity));
        }
        String rationale = parsed.path("rationale").asText(null);
        if (rationale != null && rationale.isBlank()) {
            rationale = null;
        }
        return Optional.of(new LlmSuggestionChoice(List.copyOf(picks), rationale));
    }
}
