package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.SessionFoodResponse;
import com.yourorg.quickapp.sessions.SessionResponse;
import com.yourorg.quickapp.sessions.Smell;
import com.yourorg.quickapp.sessions.Temperature;
import com.yourorg.quickapp.sessions.Texture;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

final class HistoryPdfRenderer {

    private static final float MARGIN = 50f;
    private static final float LINE = 14f;
    private static final float TITLE_SIZE = 16f;
    private static final float BODY_SIZE = 11f;

    private HistoryPdfRenderer() {}

    static byte[] render(
            List<SessionResponse> sessions, LocalDate from, LocalDate to, Instant generatedAt) {
        try (PDDocument document = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            Writer writer = new Writer(document);
            writer.line(bold, TITLE_SIZE, "Food Investigators - tasting history");
            writer.line(
                    regular,
                    BODY_SIZE,
                    "Generated: " + generatedAt.atZone(ZoneOffset.UTC).toLocalDate());
            writer.line(regular, BODY_SIZE, "Range: " + rangeLabel(from, to));
            writer.blank();

            if (sessions.isEmpty()) {
                writer.line(regular, BODY_SIZE, "No completed tasting sessions in this range.");
            } else {
                for (SessionResponse session : sessions) {
                    writer.ensureSpace(8 * LINE);
                    writer.line(bold, BODY_SIZE, "Session: " + session.scheduledOn());
                    if (session.parentNote() != null && !session.parentNote().isBlank()) {
                        writer.line(
                                regular,
                                BODY_SIZE,
                                "  Parent notes: " + safe(session.parentNote()));
                    }
                    List<SessionFoodResponse> foods =
                            session.foods().stream()
                                    .sorted((a, b) -> Integer.compare(a.position(), b.position()))
                                    .toList();
                    for (SessionFoodResponse food : foods) {
                        writer.line(
                                regular,
                                BODY_SIZE,
                                "  Food "
                                        + food.position()
                                        + ": "
                                        + safe(food.name())
                                        + " ("
                                        + familiarityLabel(food.familiarity())
                                        + ")");
                        writer.line(
                                regular,
                                BODY_SIZE,
                                "    Variant: " + dash(food.variantNote()));
                        writer.line(
                                regular,
                                BODY_SIZE,
                                "    Liked: "
                                        + likedLabel(food.liked())
                                        + "  Texture: "
                                        + textureLabel(food.texture())
                                        + "  Temperature: "
                                        + temperatureLabel(food.temperature())
                                        + "  Smell: "
                                        + smellLabel(food.smell()));
                        writer.line(
                                regular,
                                BODY_SIZE,
                                "    Why: "
                                        + dash(food.whyNote())
                                        + "  Change: "
                                        + dash(food.changeNote())
                                        + "  Ate enough: "
                                        + ateEnoughLabel(food.ateEnough()));
                    }
                    writer.blank();
                }
            }

            writer.close();
            document.save(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Failed to render tasting history PDF", ex);
        }
    }

    static String rangeLabel(LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return "All completed sessions";
        }
        if (from != null && to != null) {
            return from + " to " + to;
        }
        if (from != null) {
            return "From " + from;
        }
        return "Through " + to;
    }

    private static String familiarityLabel(Familiarity value) {
        if (value == null) {
            return "-";
        }
        return switch (value) {
            case likes -> "Likes";
            case familiar_but_new -> "Familiar but new";
            case truly_new -> "Truly new";
        };
    }

    private static String likedLabel(Liked value) {
        if (value == null) {
            return "-";
        }
        return switch (value) {
            case like -> "Like";
            case so_so -> "So-so";
            case no -> "No";
        };
    }

    private static String textureLabel(Texture value) {
        if (value == null) {
            return "-";
        }
        return switch (value) {
            case soft -> "Soft";
            case crunchy -> "Crunchy";
            case chewy -> "Chewy";
            case wet -> "Wet";
        };
    }

    private static String temperatureLabel(Temperature value) {
        if (value == null) {
            return "-";
        }
        return switch (value) {
            case cold -> "Cold";
            case warm -> "Warm";
            case hot -> "Hot";
        };
    }

    private static String smellLabel(Smell value) {
        if (value == null) {
            return "-";
        }
        return switch (value) {
            case like -> "Like";
            case so_so -> "So-so";
            case no -> "No";
        };
    }

    private static String ateEnoughLabel(Boolean value) {
        if (value == null) {
            return "-";
        }
        return value ? "Yes" : "No";
    }

    private static String dash(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return safe(value);
    }

    private static String safe(String value) {
        if (value == null) {
            return "-";
        }
        // WinAnsi fonts reject some Unicode; keep packet ASCII-safe.
        return value.replace('\u2014', '-').replace('\u2013', '-');
    }

    private static final class Writer {
        private final PDDocument document;
        private PDPage page;
        private PDPageContentStream stream;
        private float y;

        Writer(PDDocument document) throws IOException {
            this.document = document;
            newPage();
        }

        void blank() throws IOException {
            y -= LINE;
            ensureSpace(LINE);
        }

        void line(PDType1Font font, float size, String text) throws IOException {
            ensureSpace(LINE);
            stream.beginText();
            stream.setFont(font, size);
            stream.newLineAtOffset(MARGIN, y);
            stream.showText(text);
            stream.endText();
            y -= LINE;
        }

        void ensureSpace(float needed) throws IOException {
            if (y - needed < MARGIN) {
                newPage();
            }
        }

        void close() throws IOException {
            if (stream != null) {
                stream.close();
            }
        }

        private void newPage() throws IOException {
            if (stream != null) {
                stream.close();
            }
            page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - MARGIN;
        }
    }
}
