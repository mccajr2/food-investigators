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
                        new GeminiProperties("", "gemini-3.5-flash", ""), jsonMapper);

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
                                                null,
                                                "not_recent"),
                                        new SuggestionCandidate(
                                                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02"),
                                                "Berries",
                                                "blueberry",
                                                null,
                                                "not_recent")),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of()));

        assertThat(result).isEmpty();
    }

    @Test
    void parseChoiceReadsStructuredGeminiText() {
        GeminiSuggestionLlmClient client =
                new GeminiSuggestionLlmClient(
                        new GeminiProperties("key", "gemini-3.5-flash", ""), jsonMapper);
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

    @Test
    void parseChoiceReadsInventPickWithoutFoodId() {
        GeminiSuggestionLlmClient client =
                new GeminiSuggestionLlmClient(
                        new GeminiProperties("key", "gemini-3.5-flash", ""), jsonMapper);
        UUID safeId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
        String inner =
                "{\"foods\":[{\"foodId\":\""
                        + safeId
                        + "\",\"familiarity\":\"safe\"},{\"proposedName\":\"Pickles\",\"proposedVariantNote\":\"spears\",\"familiarity\":\"truly_new\"}],\"rationale\":\"Salty stretch\"}";
        String wrapped =
                "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":"
                        + jsonMapper.writeValueAsString(inner)
                        + "}]}}]}";

        Optional<LlmSuggestionChoice> choice = client.parseChoice(wrapped);

        assertThat(choice).isPresent();
        assertThat(choice.get().foods().get(0)).isEqualTo(new LlmFoodPick(safeId, Familiarity.safe));
        assertThat(choice.get().foods().get(1).isInvent()).isTrue();
        assertThat(choice.get().foods().get(1).proposedName()).isEqualTo("Pickles");
        assertThat(choice.get().foods().get(1).proposedVariantNote()).isEqualTo("spears");
        assertThat(choice.get().foods().get(1).familiarity()).isEqualTo(Familiarity.truly_new);
    }

    @Test
    void promptIncludesPacingEvidenceBulletsAndNoClinicalInventInstruction() {
        GeminiSuggestionLlmClient client =
                new GeminiSuggestionLlmClient(
                        new GeminiProperties("key", "gemini-3.5-flash", ""), jsonMapper);
        SuggestionBrief brief =
                new SuggestionBrief(
                        3,
                        "pull_back",
                        List.of(),
                        List.of(),
                        2,
                        0,
                        1,
                        1,
                        1,
                        List.of(
                                new SuggestionCandidate(
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01"),
                                        "Apples",
                                        "apple",
                                        null,
                                        "safe_anchor"),
                                new SuggestionCandidate(
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02"),
                                        "Berries",
                                        "blueberry",
                                        null,
                                        "not_recent")),
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of());

        String prompt = client.promptFor(brief);

        PacingEvidencePack.Entry expected = PacingEvidencePack.forHint("pull_back");
        assertThat(prompt).contains("pacingEvidenceBullets");
        assertThat(prompt).contains(expected.pacingNote());
        for (String bullet : expected.promptBullets()) {
            assertThat(prompt).contains(bullet);
        }
        assertThat(prompt).containsIgnoringCase("clinical");
        assertThat(prompt).doesNotContain("ARFID");
        assertThat(prompt).contains("exposures");
        assertThat(prompt).containsIgnoringCase("safe exposure");
    }

    @Test
    void promptIncludesStretchTargetsAndPathRulesWhenPresent() {
        GeminiSuggestionLlmClient client =
                new GeminiSuggestionLlmClient(
                        new GeminiProperties("key", "gemini-3.5-flash", ""), jsonMapper);
        UUID beef = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa18");
        UUID apple = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
        SuggestionBrief brief =
                new SuggestionBrief(
                        3,
                        "gentle_stretch",
                        List.of(),
                        List.of(),
                        2,
                        0,
                        0,
                        2,
                        0,
                        List.of(
                                new SuggestionCandidate(apple, "Apples", "apple", null, "safe_anchor"),
                                new SuggestionCandidate(beef, "Carrot", "carrot", null, "not_recent")),
                        List.of(new com.yourorg.quickapp.foods.SafeExposureSnapshot(apple, "Apples", "")),
                        List.of(
                                new com.yourorg.quickapp.foods.ExposureSnapshot(
                                        apple,
                                        "Apples",
                                        "",
                                        com.yourorg.quickapp.foods.FoodFamiliarity.safe)),
                        List.of(
                                new com.yourorg.quickapp.foods.StretchTargetSnapshot(
                                        beef, "Ground beef", "taco")),
                        List.of());

        String prompt = client.promptFor(brief);

        assertThat(prompt).contains("stretchTargets");
        assertThat(prompt).contains("Ground beef");
        assertThat(prompt).contains("readyStretchDestinations");
        assertThat(prompt).containsIgnoringCase("intermediate");
        assertThat(prompt).containsIgnoringCase("readyStretchDestinations");
    }
}
