package com.yourorg.quickapp.sessions;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = InsightsController.class)
public class InsightsExceptionHandler {

    @ExceptionHandler(UnknownInsightTipException.class)
    ResponseEntity<Map<String, String>> unknownTip(UnknownInsightTipException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
