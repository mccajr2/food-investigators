package com.yourorg.quickapp.sessions;

import java.util.List;

public record InsightsResponse(
        int completedSessionCount,
        boolean ready,
        int ateEnoughYes,
        int ateEnoughNo,
        int likedLike,
        int likedSoSo,
        int likedNo,
        int likedSkipped,
        List<String> topLikedTextures,
        int familiarityLikes,
        int familiarityFamiliarButNew,
        int familiarityTrulyNew,
        int snackCount,
        boolean hasParentNotes,
        List<InsightTip> tips) {}
