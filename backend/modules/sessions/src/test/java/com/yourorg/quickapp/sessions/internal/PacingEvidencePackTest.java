package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class PacingEvidencePackTest {

    @Test
    void selectsPullBackEntry() {
        PacingEvidencePack.Entry entry = PacingEvidencePack.forHint("pull_back");

        assertThat(entry.paceHint()).isEqualTo("pull_back");
        assertThat(entry.pacingNote()).containsIgnoringCase("familiar");
        assertThat(entry.citations()).isNotEmpty();
        assertThat(entry.citations().getFirst().title()).isNotBlank();
        assertThat(entry.citations().getFirst().source()).isNotBlank();
        assertThat(entry.promptBullets())
                .anyMatch(b -> b.toLowerCase().contains("clinical"));
    }

    @Test
    void selectsGentleStretchAndSteady() {
        assertThat(PacingEvidencePack.forHint("gentle_stretch").pacingNote())
                .containsIgnoringCase("stretch");
        assertThat(PacingEvidencePack.forHint("steady").pacingNote())
                .containsIgnoringCase("calm");
    }

    @Test
    void unknownOrBlankHintFallsBackToSteady() {
        assertThat(PacingEvidencePack.forHint("unknown").paceHint()).isEqualTo("steady");
        assertThat(PacingEvidencePack.forHint("").paceHint()).isEqualTo("steady");
        assertThat(PacingEvidencePack.forHint(null).paceHint()).isEqualTo("steady");
    }

    @Test
    void contentStaysNonClinical() {
        for (String hint : List.of("pull_back", "gentle_stretch", "steady")) {
            PacingEvidencePack.Entry entry = PacingEvidencePack.forHint(hint);
            String parentFacing =
                    (entry.pacingNote() + " " + entry.citations()).toLowerCase();
            assertThat(parentFacing).doesNotContain("arfid");
            assertThat(parentFacing).doesNotContain("diagnos");
            assertThat(parentFacing).doesNotContain("disorder");
            assertThat(entry.promptBullets())
                    .anyMatch(b -> b.toLowerCase().contains("clinical"));
        }
    }
}
