package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

final class HeuristicSuggestionPicker {

    private HeuristicSuggestionPicker() {}

    static Optional<LlmSuggestionChoice> pick(SuggestionBrief brief) {
        if (brief.candidates().size() < 2) {
            return Optional.empty();
        }

        SuggestionCandidate destination = StretchPathSupport.findReadyDestinationCandidate(brief);
        SuggestionCandidate safeAnchor = StretchPathSupport.findSafeAnchorCandidate(brief);
        if (destination != null
                && safeAnchor != null
                && !destination.foodId().equals(safeAnchor.foodId())) {
            List<LlmFoodPick> foods = new ArrayList<>(2);
            foods.add(new LlmFoodPick(safeAnchor.foodId(), Familiarity.safe));
            foods.add(
                    new LlmFoodPick(
                            destination.foodId(),
                            SuggestionBriefBuilder.defaultFamiliarity(
                                    destination, brief.paceHint())));
            return Optional.of(
                    new LlmSuggestionChoice(
                            List.copyOf(foods),
                            "A step toward "
                                    + destination.name()
                                    + " — safe anchor plus that stretch when you're ready."));
        }

        List<SuggestionCandidate> ordered = StretchPathSupport.pathBiasedCandidates(brief);
        SuggestionCandidate first = ordered.get(0);
        SuggestionCandidate second = ordered.get(1);
        for (SuggestionCandidate candidate : ordered) {
            if (!candidate.foodId().equals(first.foodId())) {
                second = candidate;
                break;
            }
        }
        if (first.foodId().equals(second.foodId())) {
            return Optional.empty();
        }
        List<LlmFoodPick> foods = new ArrayList<>(2);
        foods.add(
                new LlmFoodPick(
                        first.foodId(),
                        SuggestionBriefBuilder.defaultFamiliarity(first, brief.paceHint())));
        Familiarity secondFamiliarity =
                SuggestionBriefBuilder.defaultFamiliarity(second, brief.paceHint());
        if ("pull_back".equals(brief.paceHint())
                && secondFamiliarity == Familiarity.truly_new) {
            secondFamiliarity = Familiarity.familiar_but_new;
        }
        foods.add(new LlmFoodPick(second.foodId(), secondFamiliarity));
        String rationale =
                switch (brief.paceHint()) {
                    case "pull_back" ->
                            "Keeping it gentle — lean on familiar foods for a bit.";
                    case "gentle_stretch" ->
                            brief.stretchTargets().isEmpty()
                                    ? "Steady rhythm with a gentle stretch when you're ready."
                                    : "Steady rhythm with a mild step toward your stretch target.";
                    default ->
                            brief.stretchTargets().isEmpty()
                                    ? "A calm next night from foods that often work for you."
                                    : "A calm next night steered toward your stretch target.";
                };
        return Optional.of(new LlmSuggestionChoice(List.copyOf(foods), rationale));
    }
}
