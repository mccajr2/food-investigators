package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "tasting_session_foods")
class TastingSessionFood {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TastingSession session;

    @Column(name = "food_id", nullable = false)
    private UUID foodId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Familiarity familiarity;

    @Column(name = "variant_note", length = 200)
    private String variantNote;

    @Column(nullable = false)
    private int position;

    protected TastingSessionFood() {}

    static TastingSessionFood of(
            UUID foodId, Familiarity familiarity, String variantNote, int position) {
        TastingSessionFood row = new TastingSessionFood();
        row.id = UUID.randomUUID();
        row.foodId = foodId;
        row.familiarity = familiarity;
        row.variantNote = variantNote;
        row.position = position;
        return row;
    }

    void attach(TastingSession session) {
        this.session = session;
    }

    UUID getFoodId() {
        return foodId;
    }

    Familiarity getFamiliarity() {
        return familiarity;
    }

    String getVariantNote() {
        return variantNote;
    }

    int getPosition() {
        return position;
    }
}
