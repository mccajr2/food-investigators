package com.yourorg.quickapp.foods.internal;

import com.yourorg.quickapp.foods.SessionCompletedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
class SessionCompletedExposureListener {

    private final FoodService foodService;

    SessionCompletedExposureListener(FoodService foodService) {
        this.foodService = foodService;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    void onSessionCompleted(SessionCompletedEvent event) {
        foodService.applySessionCompleted(event);
    }
}
