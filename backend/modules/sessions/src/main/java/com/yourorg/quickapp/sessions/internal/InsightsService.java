package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.FoodCatalog;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.SessionStatus;
import com.yourorg.quickapp.sessions.UnknownInsightTipException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InsightsService {

    private final TastingSessionRepository sessions;
    private final InsightTipDismissalRepository dismissals;
    private final FoodCatalog foodCatalog;
    private final Clock clock;

    InsightsService(
            TastingSessionRepository sessions,
            InsightTipDismissalRepository dismissals,
            FoodCatalog foodCatalog,
            Clock clock) {
        this.sessions = sessions;
        this.dismissals = dismissals;
        this.foodCatalog = foodCatalog;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public InsightsResponse get(UUID householdId) {
        List<TastingSession> completed =
                sessions.findByHouseholdIdAndStatusOrderByScheduledOnDescUpdatedAtDesc(
                        householdId, SessionStatus.completed);
        List<SnackPreferenceSnapshot> snacks = foodCatalog.listActiveSnackPreferences(householdId);
        Set<String> dismissed =
                InsightsCalculator.dismissedSet(dismissals.findByHouseholdId(householdId));
        return InsightsCalculator.compute(completed, snacks, dismissed);
    }

    @Transactional
    public void dismissTip(UUID householdId, String tipId) {
        if (!InsightsCalculator.KNOWN_TIP_IDS.contains(tipId)) {
            throw new UnknownInsightTipException(tipId);
        }
        if (dismissals.existsByHouseholdIdAndTipId(householdId, tipId)) {
            return;
        }
        Instant now = clock.instant();
        dismissals.save(InsightTipDismissal.of(householdId, tipId, now));
    }
}
