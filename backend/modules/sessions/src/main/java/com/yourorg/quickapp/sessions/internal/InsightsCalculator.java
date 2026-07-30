package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.foods.FoodLiked;
import com.yourorg.quickapp.foods.FoodTexture;
import com.yourorg.quickapp.foods.SnackPreferenceSnapshot;
import com.yourorg.quickapp.sessions.Familiarity;
import com.yourorg.quickapp.sessions.InsightTip;
import com.yourorg.quickapp.sessions.InsightsResponse;
import com.yourorg.quickapp.sessions.Liked;
import com.yourorg.quickapp.sessions.RecentWhyNote;
import com.yourorg.quickapp.sessions.TasteBasic;
import com.yourorg.quickapp.sessions.Texture;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

/** Pure aggregation + tip evaluation for Insights (unit-testable without Spring). */
final class InsightsCalculator {

    static final int READY_SESSION_THRESHOLD = 3;
    static final int MAX_TIPS = 3;
    static final int MAX_RECENT_WHY_NOTES = 5;
    static final int WHY_CHIP_TIP_THRESHOLD = 2;

    static final String TIP_SLOW_DOWN_TRULY_NEW = "slow_down_truly_new";
    static final String TIP_LEAN_INTO_TEXTURE = "lean_into_texture";
    static final String TIP_LEAN_INTO_TASTE = "lean_into_taste";
    static final String TIP_LEAN_INTO_WHY_LIKE = "lean_into_why_like";
    static final String TIP_NOTICE_WHY_DISLIKE = "notice_why_dislike";
    static final String TIP_CELEBRATE_ATE_ENOUGH = "celebrate_ate_enough";
    static final String TIP_MIX_FAMILIARITY = "mix_familiarity";
    static final String TIP_KEEP_GOING = "keep_going";

    /** Same v1 labels as web whyChips (like / no). */
    static final List<String> WHY_CHIPS_LIKE =
            List.of(
                    "tasty",
                    "crunchy",
                    "soft",
                    "yummy smell",
                    "looks good",
                    "warm",
                    "cold");

    static final List<String> WHY_CHIPS_NO =
            List.of(
                    "yucky taste",
                    "too crunchy",
                    "too soft",
                    "yucky smell",
                    "looks weird",
                    "too hot",
                    "too cold");

    static final Set<String> KNOWN_TIP_IDS =
            Set.of(
                    TIP_SLOW_DOWN_TRULY_NEW,
                    TIP_LEAN_INTO_TEXTURE,
                    TIP_LEAN_INTO_TASTE,
                    TIP_LEAN_INTO_WHY_LIKE,
                    TIP_NOTICE_WHY_DISLIKE,
                    TIP_CELEBRATE_ATE_ENOUGH,
                    TIP_MIX_FAMILIARITY,
                    TIP_KEEP_GOING);

    private InsightsCalculator() {}

    static InsightsResponse compute(
            List<TastingSession> completedSessions,
            List<SnackPreferenceSnapshot> snacks,
            Set<String> dismissedTipIds) {
        return compute(completedSessions, snacks, dismissedTipIds, id -> "Unknown food");
    }

    static InsightsResponse compute(
            List<TastingSession> completedSessions,
            List<SnackPreferenceSnapshot> snacks,
            Set<String> dismissedTipIds,
            Function<UUID, String> foodNameResolver) {
        Aggregate agg = Aggregate.from(completedSessions, snacks, foodNameResolver);
        boolean ready = agg.completedSessionCount >= READY_SESSION_THRESHOLD;
        List<InsightTip> tips = ready ? selectTips(agg, dismissedTipIds) : List.of();
        List<RecentWhyNote> recentWhyNotes =
                ready ? List.copyOf(agg.recentWhyNotes) : List.of();
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
                List.copyOf(agg.topLikedTastes),
                agg.familiaritySafe,
                agg.familiarityFamiliarButNew,
                agg.familiarityTrulyNew,
                agg.snackCount,
                agg.hasParentNotes,
                recentWhyNotes,
                tips);
    }

    private static List<InsightTip> selectTips(Aggregate agg, Set<String> dismissed) {
        List<InsightTip> tips = new ArrayList<>(MAX_TIPS);
        maybeAdd(tips, dismissed, slowDownTrulyNew(agg));
        maybeAdd(tips, dismissed, leanIntoTexture(agg));
        maybeAdd(tips, dismissed, leanIntoTaste(agg));
        maybeAdd(tips, dismissed, leanIntoWhyLike(agg));
        maybeAdd(tips, dismissed, noticeWhyDislike(agg));
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

    private static InsightTip leanIntoTaste(Aggregate agg) {
        TasteCount top = agg.topTasteWithCount;
        if (top == null || top.count() < 2) {
            return null;
        }
        String label = capitalize(top.taste().name());
        return new InsightTip(
                TIP_LEAN_INTO_TASTE,
                label + " tastes seem to land — lean into that when you pick foods.");
    }

    private static InsightTip leanIntoWhyLike(Aggregate agg) {
        String chip = topChipAtOrAboveThreshold(agg.likeWhyChipCounts, WHY_CHIPS_LIKE);
        if (chip == null) {
            return null;
        }
        return new InsightTip(
                TIP_LEAN_INTO_WHY_LIKE,
                "Likes often mention \""
                        + chip
                        + "\" — lean into that when you pick foods.");
    }

    private static InsightTip noticeWhyDislike(Aggregate agg) {
        String chip = topChipAtOrAboveThreshold(agg.noWhyChipCounts, WHY_CHIPS_NO);
        if (chip == null) {
            return null;
        }
        return new InsightTip(
                TIP_NOTICE_WHY_DISLIKE,
                "Dislikes often mention \""
                        + chip
                        + "\" — worth watching on the next few nights.");
    }

    private static String topChipAtOrAboveThreshold(
            Map<String, Integer> counts, List<String> chipOrder) {
        String best = null;
        int bestCount = 0;
        for (String chip : chipOrder) {
            int count = counts.getOrDefault(chip, 0);
            if (count >= WHY_CHIP_TIP_THRESHOLD && count > bestCount) {
                best = chip;
                bestCount = count;
            }
        }
        return best;
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
                "You've stuck to safe foods — when you're ready, try one gentle familiar-but-new.");
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

    private record TasteCount(TasteBasic taste, int count) {}

    private record WhyCandidate(
            LocalDate scheduledOn, int position, UUID foodId, Liked liked, String whyNote) {}

    private static final class Aggregate {
        final int completedSessionCount;
        final int ateEnoughYes;
        final int ateEnoughNo;
        final int likedLike;
        final int likedSoSo;
        final int likedNo;
        final int likedSkipped;
        final List<String> topLikedTextures;
        final List<String> topLikedTastes;
        final int familiaritySafe;
        final int familiarityFamiliarButNew;
        final int familiarityTrulyNew;
        final int snackCount;
        final boolean hasParentNotes;
        final int trulyNewOutcomes;
        final int trulyNewLikedNo;
        final TextureCount topTextureWithCount;
        final TasteCount topTasteWithCount;
        final List<RecentWhyNote> recentWhyNotes;
        final Map<String, Integer> likeWhyChipCounts;
        final Map<String, Integer> noWhyChipCounts;

        private Aggregate(
                int completedSessionCount,
                int ateEnoughYes,
                int ateEnoughNo,
                int likedLike,
                int likedSoSo,
                int likedNo,
                int likedSkipped,
                List<String> topLikedTextures,
                List<String> topLikedTastes,
                int familiaritySafe,
                int familiarityFamiliarButNew,
                int familiarityTrulyNew,
                int snackCount,
                boolean hasParentNotes,
                int trulyNewOutcomes,
                int trulyNewLikedNo,
                TextureCount topTextureWithCount,
                TasteCount topTasteWithCount,
                List<RecentWhyNote> recentWhyNotes,
                Map<String, Integer> likeWhyChipCounts,
                Map<String, Integer> noWhyChipCounts) {
            this.completedSessionCount = completedSessionCount;
            this.ateEnoughYes = ateEnoughYes;
            this.ateEnoughNo = ateEnoughNo;
            this.likedLike = likedLike;
            this.likedSoSo = likedSoSo;
            this.likedNo = likedNo;
            this.likedSkipped = likedSkipped;
            this.topLikedTextures = topLikedTextures;
            this.topLikedTastes = topLikedTastes;
            this.familiaritySafe = familiaritySafe;
            this.familiarityFamiliarButNew = familiarityFamiliarButNew;
            this.familiarityTrulyNew = familiarityTrulyNew;
            this.snackCount = snackCount;
            this.hasParentNotes = hasParentNotes;
            this.trulyNewOutcomes = trulyNewOutcomes;
            this.trulyNewLikedNo = trulyNewLikedNo;
            this.topTextureWithCount = topTextureWithCount;
            this.topTasteWithCount = topTasteWithCount;
            this.recentWhyNotes = recentWhyNotes;
            this.likeWhyChipCounts = likeWhyChipCounts;
            this.noWhyChipCounts = noWhyChipCounts;
        }

        static Aggregate from(
                List<TastingSession> completedSessions,
                List<SnackPreferenceSnapshot> snacks,
                Function<UUID, String> foodNameResolver) {
            int ateEnoughYes = 0;
            int ateEnoughNo = 0;
            int likedLike = 0;
            int likedSoSo = 0;
            int likedNo = 0;
            int likedSkipped = 0;
            int familiaritySafe = 0;
            int familiarityFamiliarButNew = 0;
            int familiarityTrulyNew = 0;
            int trulyNewOutcomes = 0;
            int trulyNewLikedNo = 0;
            boolean hasParentNotes = false;
            EnumMap<Texture, Integer> likedTextureCounts = new EnumMap<>(Texture.class);
            EnumMap<TasteBasic, Integer> likedTasteCounts = new EnumMap<>(TasteBasic.class);
            Map<String, Integer> likeWhyChipCounts = new HashMap<>();
            Map<String, Integer> noWhyChipCounts = new HashMap<>();
            List<WhyCandidate> whyCandidates = new ArrayList<>();

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
                    if (familiarity == Familiarity.safe) {
                        familiaritySafe++;
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
                        for (TasteBasic taste : food.getTastes()) {
                            likedTasteCounts.merge(taste, 1, Integer::sum);
                        }
                    } else if (liked == Liked.so_so) {
                        likedSoSo++;
                    } else if (liked == Liked.no) {
                        likedNo++;
                    }

                    String whyNote = food.getWhyNote();
                    if (whyNote != null && !whyNote.isBlank()) {
                        whyCandidates.add(
                                new WhyCandidate(
                                        session.getScheduledOn(),
                                        food.getPosition(),
                                        food.getFoodId(),
                                        liked,
                                        whyNote.trim()));
                        if (liked == Liked.like) {
                            countChipsInNote(whyNote, WHY_CHIPS_LIKE, likeWhyChipCounts);
                        } else if (liked == Liked.no) {
                            countChipsInNote(whyNote, WHY_CHIPS_NO, noWhyChipCounts);
                        }
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

            List<Map.Entry<Texture, Integer>> rankedTextures =
                    likedTextureCounts.entrySet().stream()
                            .sorted(
                                    Comparator.<Map.Entry<Texture, Integer>>comparingInt(
                                                    Map.Entry::getValue)
                                            .reversed()
                                            .thenComparing(entry -> entry.getKey().name()))
                            .toList();

            List<String> topLikedTextures =
                    rankedTextures.stream().limit(3).map(entry -> entry.getKey().name()).toList();

            TextureCount topTextureWithCount =
                    rankedTextures.isEmpty()
                            ? null
                            : new TextureCount(
                                    rankedTextures.getFirst().getKey(),
                                    rankedTextures.getFirst().getValue());

            List<Map.Entry<TasteBasic, Integer>> rankedTastes =
                    likedTasteCounts.entrySet().stream()
                            .sorted(
                                    Comparator.<Map.Entry<TasteBasic, Integer>>comparingInt(
                                                    Map.Entry::getValue)
                                            .reversed()
                                            .thenComparing(entry -> entry.getKey().name()))
                            .toList();

            List<String> topLikedTastes =
                    rankedTastes.stream().limit(3).map(entry -> entry.getKey().name()).toList();

            TasteCount topTasteWithCount =
                    rankedTastes.isEmpty()
                            ? null
                            : new TasteCount(
                                    rankedTastes.getFirst().getKey(),
                                    rankedTastes.getFirst().getValue());

            List<RecentWhyNote> recentWhyNotes =
                    whyCandidates.stream()
                            .sorted(
                                    Comparator.comparing(WhyCandidate::scheduledOn)
                                            .reversed()
                                            .thenComparingInt(WhyCandidate::position))
                            .limit(MAX_RECENT_WHY_NOTES)
                            .map(
                                    candidate ->
                                            new RecentWhyNote(
                                                    candidate.scheduledOn(),
                                                    foodNameResolver.apply(candidate.foodId()),
                                                    candidate.liked(),
                                                    candidate.whyNote()))
                            .toList();

            return new Aggregate(
                    completedSessions.size(),
                    ateEnoughYes,
                    ateEnoughNo,
                    likedLike,
                    likedSoSo,
                    likedNo,
                    likedSkipped,
                    topLikedTextures,
                    topLikedTastes,
                    familiaritySafe,
                    familiarityFamiliarButNew,
                    familiarityTrulyNew,
                    snacks.size(),
                    hasParentNotes,
                    trulyNewOutcomes,
                    trulyNewLikedNo,
                    topTextureWithCount,
                    topTasteWithCount,
                    recentWhyNotes,
                    likeWhyChipCounts,
                    noWhyChipCounts);
        }

        private static void countChipsInNote(
                String whyNote, List<String> chips, Map<String, Integer> counts) {
            String lower = whyNote.toLowerCase(Locale.ROOT);
            for (String chip : chips) {
                if (lower.contains(chip.toLowerCase(Locale.ROOT))) {
                    counts.merge(chip, 1, Integer::sum);
                }
            }
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
