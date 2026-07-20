package com.yourorg.quickapp.foods;

public class DuplicateFoodNameException extends RuntimeException {
    public DuplicateFoodNameException(String name) {
        super("A food named \"" + name + "\" already exists");
    }
}
