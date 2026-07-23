package com.yourorg.quickapp.foods;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = FoodController.class)
public class FoodExceptionHandler {

    @ExceptionHandler(InvalidFoodIconKeyException.class)
    ResponseEntity<Map<String, String>> invalidIcon(InvalidFoodIconKeyException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid icon key"));
    }

    @ExceptionHandler(InvalidFoodPreferenceException.class)
    ResponseEntity<Map<String, String>> invalidPreference(InvalidFoodPreferenceException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateFoodNameException.class)
    ResponseEntity<Map<String, String>> duplicateName(DuplicateFoodNameException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "A food with that name already exists"));
    }

    @ExceptionHandler(SystemFoodImmutableException.class)
    ResponseEntity<Map<String, String>> systemImmutable(SystemFoodImmutableException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "System starter foods cannot be changed"));
    }

    @ExceptionHandler(FoodNotFoundException.class)
    ResponseEntity<Map<String, String>> notFound(FoodNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Food not found"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid request"));
    }
}
