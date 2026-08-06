package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.SessionFoodResponse;
import com.yourorg.quickapp.sessions.SessionResponse;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.Smell;
import com.yourorg.quickapp.sessions.TasteBasic;
import com.yourorg.quickapp.sessions.Temperature;
import com.yourorg.quickapp.sessions.Texture;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

class HistoryPdfRendererTest {

    @Test
    void sensorySummaryLineOmitsNullTemperatureAndSmell() {
        SessionFoodResponse bothNull =
                food(Liked.like, Texture.crunchy, null, null);
        assertThat(HistoryPdfRenderer.sensorySummaryLine(bothNull))
                .isEqualTo("    Liked: Like  Texture: Crunchy")
                .doesNotContain("Temperature")
                .doesNotContain("Smell");

        SessionFoodResponse withTemp =
                food(Liked.so_so, null, Temperature.warm, null);
        assertThat(HistoryPdfRenderer.sensorySummaryLine(withTemp))
                .contains("Temperature: Warm")
                .doesNotContain("Smell");

        SessionFoodResponse withSmell =
                food(Liked.no, Texture.soft, null, Smell.like);
        assertThat(HistoryPdfRenderer.sensorySummaryLine(withSmell))
                .contains("Smell: Like")
                .doesNotContain("Temperature");

        SessionFoodResponse both =
                food(Liked.like, Texture.chewy, Temperature.cold, Smell.no);
        assertThat(HistoryPdfRenderer.sensorySummaryLine(both))
                .contains("Temperature: Cold")
                .contains("Smell: No");
    }

    @Test
    void renderOmitsTemperatureAndSmellPlaceholdersWhenNull() throws Exception {
        SessionResponse session =
                new SessionResponse(
                        UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                        LocalDate.of(2026, 7, 21),
                        SessionStatus.completed,
                        List.of(
                                food(Liked.like, Texture.crunchy, null, null),
                                food(Liked.no, null, Temperature.warm, Smell.so_so)),
                        null,
                        Instant.parse("2026-07-15T00:00:00Z"),
                        Instant.parse("2026-07-21T00:00:00Z"));

        String text =
                pdfText(
                        HistoryPdfRenderer.render(
                                List.of(session),
                                null,
                                null,
                                Instant.parse("2026-07-22T00:00:00Z")));

        assertThat(text).contains("Liked: Like  Texture: Crunchy");
        assertThat(text).contains("Temperature: Warm");
        assertThat(text).contains("Smell: So-so");
        // No "-" placeholders for demoted fields on the null food.
        assertThat(text).doesNotContain("Temperature: -");
        assertThat(text).doesNotContain("Smell: -");
    }

    private static SessionFoodResponse food(
            Liked liked, Texture texture, Temperature temperature, Smell smell) {
        return new SessionFoodResponse(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04"),
                "Apples",
                "apple",
                null,
                Familiarity.safe,
                null,
                1,
                liked,
                texture,
                temperature,
                smell,
                List.of(TasteBasic.sweet),
                null,
                null,
                true);
    }

    private static String pdfText(byte[] pdf) throws Exception {
        try (PDDocument document = Loader.loadPDF(pdf)) {
            return new PDFTextStripper().getText(document);
        }
    }
}
