package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsightTip;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.Texture;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Pure aggregation + tip evaluation for Insights (unit-testable without Spring). */
final class InsightsCalculator {

    static final int READY_SESSION_THRESHOLD = 3;
    static final int MAX_TIPS = 3;
    static final String TIP_SLOW_DOWN_TRULY_NEW = "slow_down_truly_new";
    static final String TIP_LEAN_INTO_TEXTURE = "lean_into_texture";
    static final String TIP_CELEBRATE_ATE_ENOUGH = "celebrate_ate_enough";
    static final String TIP_MIX_FAMILIARITY = "mix_familiarity";
    static final String TIP_KEEP_GOING = "keep_going";

    static final Set<String> KNOWN_TIP_IDS =
            Set.of(
                    TIP_SLOW_DOWN_TRULY_NEW,
                    TIP_LEAN_INTO_TEXTURE,
                    TIP_CELEBRATE_ATE_ENOUGH,
                    TIP_MIX_FAMILIARITY,
                    TIP_KEEP_GOING);

    private InsightsCalculator() {}

    static InsightsResponse compute(
            List<TastingSession> completedSessions,
            List<SnackPreferenceSnapshot> snacks,
            Set<String> dismissedTipIds) {
        Aggregate agg = Aggregate.from(completedSessions, snacks);
        boolean ready = agg.completedSessionCount >= READY_SESSION_THRESHOLD;
        List<InsightTip> tips = ready ? selectTips(agg, dismissedTipIds) : List.of();
        return new InsightsResponse(
                agg.completedSessionCount,
                ready,
                agg.ateEnoughYes,
                agg.ateEnoughNo,
                agg.likedLike,
                agg.likedSoSo,
                agg.likedNo,
                agg.likedSkipped,
                List.copyOf(agg.topLikedTextures),
                agg.familiarityLikes,
                agg.familiarityFamiliarButNew,
                agg.familiarityTrulyNew,
                agg.snackCount,
                agg.hasParentNotes,
                tips);
    }

    private static List<InsightTip> selectTips(Aggregate agg, Set<String> dismissed) {
        List<InsightTip> tips = new ArrayList<>(MAX_TIPS);
        maybeAdd(tips, dismissed, slowDownTrulyNew(agg));
        maybeAdd(tips, dismissed, leanIntoTexture(agg));
        maybeAdd(tips, dismissed, celebrateAteEnough(agg));
        maybeAdd(tips, dismissed, mixFamiliarity(agg));
        while (tips.size() < MAX_TIPS) {
            InsightTip keepGoing = keepGoing();
            if (dismissed.contains(keepGoing.id()) || tipAlreadyPresent(tips, keepGoing.id())) {
                break;
            }
            tips.add(keepGoing);
        }
        return List.copyOf(tips);
    }

    private static void maybeAdd(List<InsightTip> tips, Set<String> dismissed, InsightTip tip) {
        if (tips.size() >= MAX_TIPS || tip == null) {
            return;
        }
        if (dismissed.contains(tip.id()) || tipAlreadyPresent(tips, tip.id())) {
            return;
        }
        tips.add(tip);
    }

    private static boolean tipAlreadyPresent(List<InsightTip> tips, String id) {
        return tips.stream().anyMatch(tip -> tip.id().equals(id));
    }

    private static InsightTip slowDownTrulyNew(Aggregate agg) {
        if (agg.trulyNewOutcomes < 2) {
            return null;
        }
        double shareNo = (double) agg.trulyNewLikedNo / (double) agg.trulyNewOutcomes;
        if (shareNo < 0.5) {
            return null;
        }
        return new InsightTip(
                TIP_SLOW_DOWN_TRULY_NEW,
                "Truly new foods have been tough lately — ease off for a bit and lean on familiar.");
    }

    private static InsightTip leanIntoTexture(Aggregate agg) {
        TextureCount top = agg.topTextureWithCount;
        if (top == null || top.count() < 2) {
            return null;
        }
        String label = capitalize(top.texture().name());
        return new InsightTip(
                TIP_LEAN_INTO_TEXTURE,
                label + " textures seem to land — lean into that when you pick foods.");
    }

    private static InsightTip celebrateAteEnough(Aggregate agg) {
        if (agg.ateEnoughYes < 3 || agg.ateEnoughYes <= agg.ateEnoughNo) {
            return null;
        }
        return new InsightTip(
                TIP_CELEBRATE_ATE_ENOUGH,
                "Servings are finishing well — keep that calm rhythm going.");
    }

    private static InsightTip mixFamiliarity(Aggregate agg) {
        if (agg.familiarityTrulyNew != 0) {
            return null;
        }
        return new InsightTip(
                TIP_MIX_FAMILIARITY,
                "You've stuck to known foods — when you're ready, try one gentle familiar-but-new.");
    }

    private static InsightTip keepGoing() {
        return new InsightTip(
                TIP_KEEP_GOING, "You're building a tasting rhythm — keep going at a calm pace.");
    }

    private static String capitalize(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1).toLowerCase(Locale.ROOT);
    }

    private record TextureCount(Texture texture, int count) {}

    private static final class Aggregate {
        final int completedSessionCount;
        final int ateEnoughYes;
        final int ateEnoughNo;
        final int likedLike;
        final int likedSoSo;
        final int likedNo;
        final int likedSkipped;
        final List<String> topLikedTextures;
        final int familiarityLikes;
        final int familiarityFamiliarButNew;
        final int familiarityTrulyNew;
        final int snackCount;
        final boolean hasParentNotes;
        final int trulyNewOutcomes;
        final int trulyNewLikedNo;
        final TextureCount topTextureWithCount;

        private Aggregate(
                int completedSessionCount,
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
                int trulyNewOutcomes,
                int trulyNewLikedNo,
                TextureCount topTextureWithCount) {
            this.completedSessionCount = completedSessionCount;
            this.ateEnoughYes = ateEnoughYes;
            this.ateEnoughNo = ateEnoughNo;
            this.likedLike = likedLike;
            this.likedSoSo = likedSoSo;
            this.likedNo = likedNo;
            this.likedSkipped = likedSkipped;
            this.topLikedTextures = topLikedTextures;
            this.familiarityLikes = familiarityLikes;
            this.familiarityFamiliarButNew = familiarityFamiliarButNew;
            this.familiarityTrulyNew = familiarityTrulyNew;
            this.snackCount = snackCount;
            this.hasParentNotes = hasParentNotes;
            this.trulyNewOutcomes = trulyNewOutcomes;
            this.trulyNewLikedNo = trulyNewLikedNo;
            this.topTextureWithCount = topTextureWithCount;
        }

        static Aggregate from(
                List<TastingSession> completedSessions, List<SnackPreferenceSnapshot> snacks) {
            int ateEnoughYes = 0;
            int ateEnoughNo = 0;
            int likedLike = 0;
            int likedSoSo = 0;
            int likedNo = 0;
            int likedSkipped = 0;
            int familiarityLikes = 0;
            int familiarityFamiliarButNew = 0;
            int familiarityTrulyNew = 0;
            int trulyNewOutcomes = 0;
            int trulyNewLikedNo = 0;
            boolean hasParentNotes = false;
            EnumMap<Texture, Integer> likedTextureCounts = new EnumMap<>(Texture.class);

            for (TastingSession session : completedSessions) {
                if (session.getParentNote() != null && !session.getParentNote().isBlank()) {
                    hasParentNotes = true;
                }
                for (TastingSessionFood food : session.getFoods()) {
                    if (Boolean.TRUE.equals(food.getAteEnough())) {
                        ateEnoughYes++;
                    } else if (Boolean.FALSE.equals(food.getAteEnough())) {
                        ateEnoughNo++;
                    }

                    Familiarity familiarity = food.getFamiliarity();
                    if (familiarity == Familiarity.likes) {
                        familiarityLikes++;
                    } else if (familiarity == Familiarity.familiar_but_new) {
                        familiarityFamiliarButNew++;
                    } else if (familiarity == Familiarity.truly_new) {
                        familiarityTrulyNew++;
                        trulyNewOutcomes++;
                        if (food.getLiked() == Liked.no) {
                            trulyNewLikedNo++;
                        }
                    }

                    Liked liked = food.getLiked();
                    if (liked == null) {
                        likedSkipped++;
                    } else if (liked == Liked.like) {
                        likedLike++;
                        if (food.getTexture() != null) {
                            likedTextureCounts.merge(food.getTexture(), 1, Integer::sum);
                        }
                    } else if (liked == Liked.so_so) {
                        likedSoSo++;
                    } else if (liked == Liked.no) {
                        likedNo++;
                    }
                }
            }

            for (SnackPreferenceSnapshot snack : snacks) {
                FoodLiked liked = snack.liked();
                if (liked == FoodLiked.like) {
                    likedLike++;
                    Texture texture = toSessionTexture(snack.texture());
                    if (texture != null) {
                        likedTextureCounts.merge(texture, 1, Integer::sum);
                    }
                } else if (liked == FoodLiked.so_so) {
                    likedSoSo++;
                } else if (liked == FoodLiked.no) {
                    likedNo++;
                }
            }

            List<Map.Entry<Texture, Integer>> ranked =
                    likedTextureCounts.entrySet().stream()
                            .sorted(
                                    Comparator.<Map.Entry<Texture, Integer>>comparingInt(
                                                    Map.Entry::getValue)
                                            .reversed()
                                            .thenComparing(entry -> entry.getKey().name()))
                            .toList();

            List<String> topLikedTextures =
                    ranked.stream().limit(3).map(entry -> entry.getKey().name()).toList();

            TextureCount topTextureWithCount =
                    ranked.isEmpty()
                            ? null
                            : new TextureCount(ranked.getFirst().getKey(), ranked.getFirst().getValue());

            return new Aggregate(
                    completedSessions.size(),
                    ateEnoughYes,
                    ateEnoughNo,
                    likedLike,
                    likedSoSo,
                    likedNo,
                    likedSkipped,
                    topLikedTextures,
                    familiarityLikes,
                    familiarityFamiliarButNew,
                    familiarityTrulyNew,
                    snacks.size(),
                    hasParentNotes,
                    trulyNewOutcomes,
                    trulyNewLikedNo,
                    topTextureWithCount);
        }

        private static Texture toSessionTexture(FoodTexture texture) {
            if (texture == null) {
                return null;
            }
            return Texture.valueOf(texture.name());
        }
    }

    static Set<String> dismissedSet(List<InsightTipDismissal> rows) {
        Set<String> ids = new HashSet<>();
        for (InsightTipDismissal row : rows) {
            ids.add(row.getTipId());
        }
        return ids;
    }
}
