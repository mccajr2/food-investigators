package com.yourorg.quickapp.foods;

public class DuplicateStretchTargetException extends RuntimeException {

    public DuplicateStretchTargetException() {
        super("Stretch target already exists");
    }
}
