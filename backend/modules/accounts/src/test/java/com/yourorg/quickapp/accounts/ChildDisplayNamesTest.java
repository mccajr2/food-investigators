package com.yourorg.quickapp.accounts;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ChildDisplayNamesTest {

    @Test
    void normalizeTrimsAndBlankBecomesNull() {
        assertThat(ChildDisplayNames.normalize(null)).isNull();
        assertThat(ChildDisplayNames.normalize("   ")).isNull();
        assertThat(ChildDisplayNames.normalize("  Alex  ")).isEqualTo("Alex");
    }

    @Test
    void normalizeRejectsOverLongAndControlChars() {
        assertThatThrownBy(() -> ChildDisplayNames.normalize("a".repeat(41)))
                .isInstanceOf(InvalidChildDisplayNameException.class)
                .hasMessageContaining("at most 40");
        assertThatThrownBy(() -> ChildDisplayNames.normalize("Alex" + (char) 7))
                .isInstanceOf(InvalidChildDisplayNameException.class)
                .hasMessageContaining("control");
        assertThatThrownBy(() -> ChildDisplayNames.normalize("Al" + (char) 7 + "ex"))
                .isInstanceOf(InvalidChildDisplayNameException.class)
                .hasMessageContaining("control");
    }
}
