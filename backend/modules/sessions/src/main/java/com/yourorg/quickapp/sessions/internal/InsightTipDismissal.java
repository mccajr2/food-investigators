package com.yourorg.quickapp.sessions.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "insight_tip_dismissals")
@IdClass(InsightTipDismissal.Pk.class)
class InsightTipDismissal {

    @Id
    @Column(name = "household_id", nullable = false)
    private UUID householdId;

    @Id
    @Column(name = "tip_id", nullable = false, length = 64)
    private String tipId;

    @Column(name = "dismissed_at", nullable = false)
    private Instant dismissedAt;

    protected InsightTipDismissal() {}

    static InsightTipDismissal of(UUID householdId, String tipId, Instant dismissedAt) {
        InsightTipDismissal row = new InsightTipDismissal();
        row.householdId = householdId;
        row.tipId = tipId;
        row.dismissedAt = dismissedAt;
        return row;
    }

    UUID getHouseholdId() {
        return householdId;
    }

    String getTipId() {
        return tipId;
    }

    Instant getDismissedAt() {
        return dismissedAt;
    }

    static final class Pk implements Serializable {
        private UUID householdId;
        private String tipId;

        protected Pk() {}

        Pk(UUID householdId, String tipId) {
            this.householdId = householdId;
            this.tipId = tipId;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (!(other instanceof Pk pk)) {
                return false;
            }
            return Objects.equals(householdId, pk.householdId) && Objects.equals(tipId, pk.tipId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(householdId, tipId);
        }
    }
}
