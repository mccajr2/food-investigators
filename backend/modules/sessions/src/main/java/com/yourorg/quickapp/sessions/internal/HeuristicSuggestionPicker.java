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
        SuggestionCandidate first = brief.candidates().get(0);
        SuggestionCandidate second = brief.candidates().get(1);
        for (SuggestionCandidate candidate : brief.candidates()) {
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
                            "Steady rhythm with a gentle stretch when you're ready.";
                    default -> "A calm next night from foods that often work for you.";
                };
        return Optional.of(new LlmSuggestionChoice(List.copyOf(foods), rationale));
    }
}
