package com.yourorg.quickapp.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CorsOriginsTest {

    @Test
    void alwaysIncludesLocalViteOrigins() {
        assertThat(CorsOrigins.merge(null)).containsExactlyElementsOf(CorsOrigins.LOCAL_VITE_ORIGINS);
        assertThat(CorsOrigins.merge("")).containsExactlyElementsOf(CorsOrigins.LOCAL_VITE_ORIGINS);
    }

    @Test
    void appendsExtraOriginsWithoutDuplicates() {
        assertThat(
                        CorsOrigins.merge(
                                " https://food-investigators.onrender.com , http://localhost:5173 "))
                .containsExactly(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:4173",
                        "http://127.0.0.1:4173",
                        "https://food-investigators.onrender.com");
    }
}
