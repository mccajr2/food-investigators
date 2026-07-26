package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.GeminiProperties;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class GeminiSuggestionLlmClientTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Test
    void unconfiguredReturnsEmptyWithoutCallingNetwork() {
        GeminiSuggestionLlmClient client =
                new GeminiSuggestionLlmClient(
                        new GeminiProperties("", "gemini-2.0-flash", ""), jsonMapper);

        Optional<LlmSuggestionChoice> result =
                client.propose(
                        new SuggestionBrief(
                                3,
                                "steady",
                                List.of(),
                                List.of(),
                                1,
                                1,
                                0,
                                2,
                                0,
                                List.of(
                                        new SuggestionCandidate(
                                                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01"),
                                                "Apples",
                                                "apple",
                                                "not_recent"),
                                        new SuggestionCandidate(
                                                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02"),
                                                "Berries",
                                                "blueberry",
                                                "not_recent"))));

        assertThat(result).isEmpty();
    }

    @Test
    void parseChoiceReadsStructuredGeminiText() {
        GeminiSuggestionLlmClient client =
                new GeminiSuggestionLlmClient(
                        new GeminiProperties("key", "gemini-2.0-flash", ""), jsonMapper);
        UUID a = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
        UUID b = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02");
        String inner =
                "{\"foods\":[{\"foodId\":\""
                        + a
                        + "\",\"familiarity\":\"safe\"},{\"foodId\":\""
                        + b
                        + "\",\"familiarity\":\"familiar_but_new\"}],\"rationale\":\"Calm pair\"}";
        String wrapped =
                "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":"
                        + jsonMapper.writeValueAsString(inner)
                        + "}]}}]}";

        Optional<LlmSuggestionChoice> choice = client.parseChoice(wrapped);

        assertThat(choice).isPresent();
        assertThat(choice.get().foods())
                .containsExactly(
                        new LlmFoodPick(a, Familiarity.safe),
                        new LlmFoodPick(b, Familiarity.familiar_but_new));
        assertThat(choice.get().rationale()).isEqualTo("Calm pair");
    }
}
