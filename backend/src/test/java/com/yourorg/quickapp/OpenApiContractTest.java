package com.yourorg.quickapp;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class OpenApiContractTest {

    @Test
    void documentsAuthEndpointsAndDropsGreeting() throws IOException {
        Path openApi = resolveOpenApi();
        assertThat(openApi).exists();
        String yaml = Files.readString(openApi);

        assertThat(yaml).contains("/api/auth/register");
        assertThat(yaml).contains("/api/auth/login");
        assertThat(yaml).contains("/api/auth/logout");
        assertThat(yaml).contains("/api/auth/me");
        assertThat(yaml).contains("operationId: me");
        assertThat(yaml).contains("operationId: updateMe");
        assertThat(yaml).contains("RegisterRequest");
        assertThat(yaml).contains("UpdateMeRequest");
        assertThat(yaml).contains("UserResponse");
        assertThat(yaml).contains("AuthResponse");
        assertThat(yaml).contains("childDisplayName");
        assertThat(yaml).contains("maxLength: 40");
        assertThat(yaml).contains("bearerAuth");

        assertThat(yaml).doesNotContain("/api/greeting");
        assertThat(yaml).doesNotContain("GreetingResponse");
        assertThat(yaml).doesNotContain("getGreeting");
    }

    @Test
    void documentsFoodsEndpoints() throws IOException {
        String yaml = Files.readString(resolveOpenApi());

        assertThat(yaml).contains("/api/foods");
        assertThat(yaml).contains("/api/foods/{foodId}");
        assertThat(yaml).contains("/api/foods/{foodId}/archive");
        assertThat(yaml).contains("listFoods");
        assertThat(yaml).contains("createFood");
        assertThat(yaml).contains("updateFood");
        assertThat(yaml).contains("archiveFood");
        assertThat(yaml).contains("FoodResponse");
        assertThat(yaml).contains("CreateFoodRequest");
        assertThat(yaml).contains("UpdateFoodRequest");
        assertThat(yaml).contains("FoodIconKey");
        assertThat(yaml).contains("iconUrl");
        assertThat(yaml).contains("sessionEligible");
        assertThat(yaml).contains("tasteNote");
        assertThat(yaml).contains("includeArchived");
        assertThat(yaml).contains("custom_");
        assertThat(yaml).contains("custom_cucumber");
        assertThat(yaml).contains("A food with that name already exists");
        assertThat(yaml).contains("FoodExposureResponse");
        assertThat(yaml).contains("ExposureSource");
        assertThat(yaml).contains("attemptCount");
        assertThat(yaml).contains("lastTriedOn");
        assertThat(yaml).contains("lastLiked");
        assertThat(yaml).contains("outcome-driven exposure upserts");
        assertThat(yaml).contains("never auto-downgraded");
    }

    @Test
    void documentsSessionEndpoints() throws IOException {
        String yaml = Files.readString(resolveOpenApi());

        assertThat(yaml).contains("/api/sessions");
        assertThat(yaml).contains("/api/sessions/history");
        assertThat(yaml).contains("/api/sessions/history.pdf");
        assertThat(yaml).contains("/api/sessions/suggestions/next");
        assertThat(yaml).contains("/api/sessions/{sessionId}");
        assertThat(yaml).contains("/api/sessions/{sessionId}/cancel");
        assertThat(yaml).contains("/api/sessions/{sessionId}/complete");
        assertThat(yaml).contains("/api/sessions/{sessionId}/parent-note");
        assertThat(yaml).contains("listUpcomingSessions");
        assertThat(yaml).contains("listSessionHistory");
        assertThat(yaml).contains("exportSessionHistoryPdf");
        assertThat(yaml).contains("suggestNextSession");
        assertThat(yaml).contains("createSession");
        assertThat(yaml).contains("getSession");
        assertThat(yaml).contains("updateSession");
        assertThat(yaml).contains("cancelSession");
        assertThat(yaml).contains("completeSession");
        assertThat(yaml).contains("updateSessionParentNote");
        assertThat(yaml).contains("SessionResponse");
        assertThat(yaml).contains("SessionSuggestionResponse");
        assertThat(yaml).contains("SuggestedSessionFood");
        assertThat(yaml).contains("SuggestionSource");
        assertThat(yaml).contains("CreateSessionRequest");
        assertThat(yaml).contains("UpdateSessionRequest");
        assertThat(yaml).contains("CompleteSessionRequest");
        assertThat(yaml).contains("UpdateParentNoteRequest");
        assertThat(yaml).contains("FoodOutcomeRequest");
        assertThat(yaml).contains("SessionFoodRequest");
        assertThat(yaml).contains("SessionFoodResponse");
        assertThat(yaml).contains("Familiarity");
        assertThat(yaml).contains("SessionStatus");
        assertThat(yaml).contains("completed");
        assertThat(yaml).contains("Liked");
        assertThat(yaml).contains("Texture");
        assertThat(yaml).contains("Temperature");
        assertThat(yaml).contains("Smell");
        assertThat(yaml).contains("TasteBasic");
        assertThat(yaml).contains("tastes");
        assertThat(yaml).contains("sweet");
        assertThat(yaml).contains("salty");
        assertThat(yaml).contains("bitter");
        assertThat(yaml).contains("sour");
        assertThat(yaml).doesNotContain("- umami");
        assertThat(yaml).contains("Whether the child liked how the food smelled");
        assertThat(yaml).doesNotContain("- mild");
        assertThat(yaml).doesNotContain("- strong");
        assertThat(yaml).contains("whyNote");
        assertThat(yaml).contains("changeNote");
        assertThat(yaml).contains("ateEnough");
        assertThat(yaml).contains("parentNote");
        assertThat(yaml).contains("safe");
        assertThat(yaml).contains("familiar_but_new");
        assertThat(yaml).contains("truly_new");
        assertThat(yaml).contains("retrying");
        assertThat(yaml).contains("- ai");
        assertThat(yaml).contains("heuristic");
        assertThat(yaml).doesNotContain("- likes");
        assertThat(yaml).contains("variantNote");
        assertThat(yaml).contains("scheduledOn");
        assertThat(yaml).contains("application/pdf");
        assertThat(yaml).contains("tasting-history.pdf");
    }

    @Test
    void documentsInsightsEndpoints() throws IOException {
        String yaml = Files.readString(resolveOpenApi());

        assertThat(yaml).contains("/api/insights");
        assertThat(yaml).contains("/api/insights/tips/{tipId}/dismiss");
        assertThat(yaml).contains("getInsights");
        assertThat(yaml).contains("dismissInsightTip");
        assertThat(yaml).contains("InsightsResponse");
        assertThat(yaml).contains("InsightTip");
        assertThat(yaml).contains("completedSessionCount");
        assertThat(yaml).contains("ready");
        assertThat(yaml).contains("snackCount");
        assertThat(yaml).contains("topLikedTextures");
        assertThat(yaml).contains("topLikedTastes");
        assertThat(yaml).contains("lean_into_taste");
        assertThat(yaml).contains("lean_into_why_like");
        assertThat(yaml).contains("notice_why_dislike");
        assertThat(yaml).contains("RecentWhyNote");
        assertThat(yaml).contains("recentWhyNotes");
        assertThat(yaml).contains("familiaritySafe");
        assertThat(yaml).doesNotContain("familiarityLikes");
        assertThat(yaml).contains("hasParentNotes");
        assertThat(yaml).contains("slow_down_truly_new");
        assertThat(yaml).contains("keep_going");
    }

    @Test
    void readmeSmokeUsesAuthNotGreeting() throws IOException {
        Path readme = resolveReadme();
        assertThat(readme).exists();
        String text = Files.readString(readme);

        assertThat(text).contains("/api/auth/register");
        assertThat(text).contains("/api/auth/me");
        assertThat(text).contains("Authorization: Bearer");
        assertThat(text).doesNotContain("/api/greeting");
    }

    private static Path resolveOpenApi() {
        Path fromBackend = Path.of("..", "contracts", "openapi.yaml").normalize().toAbsolutePath();
        if (Files.exists(fromBackend)) {
            return fromBackend;
        }
        return Path.of("contracts", "openapi.yaml").toAbsolutePath();
    }

    private static Path resolveReadme() {
        Path fromBackend = Path.of("..", "README.md").normalize().toAbsolutePath();
        if (Files.exists(fromBackend)) {
            return fromBackend;
        }
        return Path.of("README.md").toAbsolutePath();
    }
}
