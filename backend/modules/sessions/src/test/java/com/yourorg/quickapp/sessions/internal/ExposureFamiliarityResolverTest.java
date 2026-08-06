package com.yourorg.quickapp.sessions.internal;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.foods.ExposureSnapshot;
import com.yourorg.quickapp.foods.FoodFamiliarity;
import com.yourorg.quickapp.sessions.Familiarity;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ExposureFamiliarityResolverTest {

    private final UUID apples = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
    private final UUID bananas = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02");

    @Test
    void blankRequestUsesBlankSafeExposure() {
        List<ExposureSnapshot> exposures =
                List.of(
                        new ExposureSnapshot(apples, "Apples", "", FoodFamiliarity.safe),
                        new ExposureSnapshot(
                                apples, "Apples", "sauce", FoodFamiliarity.retrying));

        ExposureFamiliarityResolver.Resolved resolved =
                ExposureFamiliarityResolver.resolve(
                        apples, null, exposures, Familiarity.familiar_but_new);

        assertThat(resolved.familiarity()).isEqualTo(Familiarity.safe);
        assertThat(resolved.variantNote()).isNull();
    }

    @Test
    void blankRequestFallsBackToNamedSafePresentation() {
        List<ExposureSnapshot> exposures =
                List.of(
                        new ExposureSnapshot(
                                bananas, "Bananas", "chips", FoodFamiliarity.safe));

        ExposureFamiliarityResolver.Resolved resolved =
                ExposureFamiliarityResolver.resolve(
                        bananas, "", exposures, Familiarity.familiar_but_new);

        assertThat(resolved.familiarity()).isEqualTo(Familiarity.safe);
        assertThat(resolved.variantNote()).isEqualTo("chips");
    }

    @Test
    void exactVariantMatchWins() {
        List<ExposureSnapshot> exposures =
                List.of(
                        new ExposureSnapshot(apples, "Apples", "", FoodFamiliarity.safe),
                        new ExposureSnapshot(
                                apples, "Apples", "sauce", FoodFamiliarity.retrying));

        ExposureFamiliarityResolver.Resolved resolved =
                ExposureFamiliarityResolver.resolve(
                        apples, "Sauce", exposures, Familiarity.safe);

        assertThat(resolved.familiarity()).isEqualTo(Familiarity.retrying);
        assertThat(resolved.variantNote()).isEqualTo("sauce");
    }

    @Test
    void newPresentationOfSafeFoodIsFamiliarButNew() {
        List<ExposureSnapshot> exposures =
                List.of(new ExposureSnapshot(apples, "Apples", "", FoodFamiliarity.safe));

        ExposureFamiliarityResolver.Resolved resolved =
                ExposureFamiliarityResolver.resolve(
                        apples, "organic", exposures, Familiarity.truly_new);

        assertThat(resolved.familiarity()).isEqualTo(Familiarity.familiar_but_new);
        assertThat(resolved.variantNote()).isEqualTo("organic");
    }

    @Test
    void noExposureUsesFallback() {
        ExposureFamiliarityResolver.Resolved resolved =
                ExposureFamiliarityResolver.resolve(
                        apples, null, List.of(), Familiarity.familiar_but_new);

        assertThat(resolved.familiarity()).isEqualTo(Familiarity.familiar_but_new);
        assertThat(resolved.variantNote()).isNull();
    }

    @Test
    void soleNonSafeExposureUsedWhenBlankRequest() {
        List<ExposureSnapshot> exposures =
                List.of(
                        new ExposureSnapshot(
                                apples, "Apples", "chips", FoodFamiliarity.familiar_but_new));

        ExposureFamiliarityResolver.Resolved resolved =
                ExposureFamiliarityResolver.resolve(
                        apples, null, exposures, Familiarity.truly_new);

        assertThat(resolved.familiarity()).isEqualTo(Familiarity.familiar_but_new);
        assertThat(resolved.variantNote()).isEqualTo("chips");
    }
}
