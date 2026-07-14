package com.yourorg.quickapp.accounts;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("Email already registered: " + email);
    }
}
