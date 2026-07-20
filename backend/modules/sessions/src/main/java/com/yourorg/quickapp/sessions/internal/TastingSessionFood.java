package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.Smell;
import com.yourorg.quickapp.sessions.Temperature;
import com.yourorg.quickapp.sessions.Texture;
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

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Liked liked;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Texture texture;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Temperature temperature;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Smell smell;

    @Column(name = "why_note", length = 500)
    private String whyNote;

    @Column(name = "change_note", length = 500)
    private String changeNote;

    @Column(name = "ate_enough")
    private Boolean ateEnough;

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

    void recordOutcome(
            Liked liked,
            Texture texture,
            Temperature temperature,
            Smell smell,
            String whyNote,
            String changeNote,
            boolean ateEnough) {
        this.liked = liked;
        this.texture = texture;
        this.temperature = temperature;
        this.smell = smell;
        this.whyNote = whyNote;
        this.changeNote = changeNote;
        this.ateEnough = ateEnough;
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

    Liked getLiked() {
        return liked;
    }

    Texture getTexture() {
        return texture;
    }

    Temperature getTemperature() {
        return temperature;
    }

    Smell getSmell() {
        return smell;
    }

    String getWhyNote() {
        return whyNote;
    }

    String getChangeNote() {
        return changeNote;
    }

    Boolean getAteEnough() {
        return ateEnough;
    }
}
