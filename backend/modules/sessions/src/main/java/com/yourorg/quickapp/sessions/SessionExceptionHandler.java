package com.yourorg.quickapp.sessions;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = SessionController.class)
public class SessionExceptionHandler {

    @ExceptionHandler(SessionNotFoundException.class)
    ResponseEntity<Map<String, String>> notFound(SessionNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Session not found"));
    }

    @ExceptionHandler(SessionNotEditableException.class)
    ResponseEntity<Map<String, String>> notEditable(SessionNotEditableException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Session cannot be edited"));
    }

    @ExceptionHandler(InvalidSessionFoodException.class)
    ResponseEntity<Map<String, String>> invalidFood(InvalidSessionFoodException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidSessionOutcomeException.class)
    ResponseEntity<Map<String, String>> invalidOutcome(InvalidSessionOutcomeException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidHistoryPdfRequestException.class)
    ResponseEntity<Map<String, String>> invalidHistoryPdf(InvalidHistoryPdfRequestException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid request"));
    }
}
