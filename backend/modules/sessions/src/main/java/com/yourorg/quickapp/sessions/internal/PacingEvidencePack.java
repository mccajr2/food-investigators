package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.PacingCitation;
import java.util.List;
import java.util.Map;

/**
 * Curated static pacing evidence keyed by {@code paceHint}. Parent-facing note +
 * citations; internal prompt bullets for the LLM. Non-clinical, parent-led.
 */
final class PacingEvidencePack {

    record Entry(
            String paceHint,
            String pacingNote,
            List<PacingCitation> citations,
            List<String> promptBullets) {

        Entry {
            citations = List.copyOf(citations);
            promptBullets = List.copyOf(promptBullets);
        }
    }

    private static final Entry PULL_BACK =
            new Entry(
                    "pull_back",
                    "Ease off brand-new foods for a bit — familiar favorites keep tasting calm.",
                    List.of(
                            new PacingCitation(
                                    "Gentle pacing after tough new tries",
                                    "Feeding therapy guidance on repeated calm exposure")),
                    List.of(
                            "Prefer safe and familiar_but_new foods; avoid stacking truly_new.",
                            "Keep the night low-pressure; celebrate showing up more than stretching.",
                            "Do not invent clinical labels or treatment plans."));

    private static final Entry GENTLE_STRETCH =
            new Entry(
                    "gentle_stretch",
                    "A steady rhythm with room for one mild stretch when it feels right.",
                    List.of(
                            new PacingCitation(
                                    "One small stretch at a time",
                                    "Parent-led selective eating support practices")),
                    List.of(
                            "One mild stretch is OK alongside a safe anchor.",
                            "Prefer familiar_but_new over stacking multiple truly_new foods.",
                            "Do not invent clinical labels or treatment plans."));

    private static final Entry STEADY =
            new Entry(
                    "steady",
                    "Keep a calm, balanced night — foods that often work, without rushing.",
                    List.of(
                            new PacingCitation(
                                    "Calm tasting rhythm",
                                    "Family mealtime and exposure guidance for picky eating")),
                    List.of(
                            "Balance familiar anchors with gentle variety.",
                            "Stay parent-led: propose, never pressure.",
                            "Do not invent clinical labels or treatment plans."));

    private static final Map<String, Entry> BY_HINT =
            Map.of(
                    PULL_BACK.paceHint(), PULL_BACK,
                    GENTLE_STRETCH.paceHint(), GENTLE_STRETCH,
                    STEADY.paceHint(), STEADY);

    private PacingEvidencePack() {}

    static Entry forHint(String paceHint) {
        if (paceHint == null || paceHint.isBlank()) {
            return STEADY;
        }
        return BY_HINT.getOrDefault(paceHint.trim(), STEADY);
    }
}
