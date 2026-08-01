package com.yourorg.quickapp.accounts;

/** Shared limits/normalization for household child display first name. */
public final class ChildDisplayNames {

    public static final int MAX_LENGTH = 40;

    private ChildDisplayNames() {}

    /**
     * Trims; blank → null; rejects over-length and ISO control characters. Does not log the
     * raw name (privacy).
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        // Reject before trim — String.trim() strips code points ≤ U+0020, including controls.
        if (raw.chars().anyMatch(Character::isISOControl)) {
            throw new InvalidChildDisplayNameException(
                    "Child display name must not contain control characters");
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > MAX_LENGTH) {
            throw new InvalidChildDisplayNameException(
                    "Child display name must be at most " + MAX_LENGTH + " characters");
        }
        return trimmed;
    }
}
