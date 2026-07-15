/** Client-side icon generation for household foods without a starter illustration. */

const CUSTOM_PREFIX = "custom_"

/**
 * Keyword → emoji. Phrases first when sorted by length.
 * Matching uses word boundaries so "pea" does not match "peach".
 */
const FOOD_EMOJI: Array<[string, string]> = [
  ["macaroni and cheese", "🧀"],
  ["mac and cheese", "🧀"],
  ["peanut butter", "🥜"],
  ["chocolate chip", "🥞"],
  ["sweet potato", "🍠"],
  ["cream cheese", "🥯"],
  ["french fries", "🍟"],
  ["chicken nugget", "🍗"],
  ["hot dog", "🌭"],
  ["ice cream", "🍦"],
  ["applesauce", "🍎"],
  ["blueberry", "🫐"],
  ["blueberries", "🫐"],
  ["strawberry", "🍓"],
  ["strawberries", "🍓"],
  ["cucumber", "🥒"],
  ["pickles", "🥒"],
  ["pickle", "🥒"],
  ["pancake", "🥞"],
  ["pancakes", "🥞"],
  ["chicken", "🍗"],
  ["nuggets", "🍗"],
  ["nugget", "🍗"],
  ["tenders", "🍗"],
  ["tender", "🍗"],
  ["yogurt", "🥛"],
  ["banana", "🍌"],
  ["bagel", "🥯"],
  ["ramen", "🍜"],
  ["noodles", "🍜"],
  ["noodle", "🍜"],
  ["waffle", "🧇"],
  ["carrot", "🥕"],
  ["grapes", "🍇"],
  ["grape", "🍇"],
  ["apple", "🍎"],
  ["toast", "🍞"],
  ["bread", "🍞"],
  ["corn", "🌽"],
  ["broccoli", "🥦"],
  ["avocado", "🥑"],
  ["tomato", "🍅"],
  ["pepper", "🌶️"],
  ["cheese", "🧀"],
  ["eggs", "🥚"],
  ["egg", "🥚"],
  ["milk", "🥛"],
  ["rice", "🍚"],
  ["pizza", "🍕"],
  ["pasta", "🍝"],
  ["spaghetti", "🍝"],
  ["macaroni", "🍝"],
  ["fish", "🐟"],
  ["salmon", "🐟"],
  ["tuna", "🐟"],
  ["beef", "🥩"],
  ["steak", "🥩"],
  ["burger", "🍔"],
  ["hamburger", "🍔"],
  ["cookie", "🍪"],
  ["cookies", "🍪"],
  ["cracker", "🍘"],
  ["crackers", "🍘"],
  ["orange", "🍊"],
  ["lemon", "🍋"],
  ["peach", "🍑"],
  ["pear", "🍐"],
  ["melon", "🍈"],
  ["watermelon", "🍉"],
  ["cherry", "🍒"],
  ["cherries", "🍒"],
  ["peas", "🟢"],
  ["pea", "🟢"],
  ["beans", "🫘"],
  ["bean", "🫘"],
  ["lettuce", "🥬"],
  ["spinach", "🥬"],
  ["salad", "🥗"],
  ["potato", "🥔"],
  ["fries", "🍟"],
  ["fry", "🍟"],
  ["chips", "🍟"],
  ["onion", "🧅"],
  ["garlic", "🧄"],
  ["mushroom", "🍄"],
  ["nuts", "🥜"],
  ["peanut", "🥜"],
  ["honey", "🍯"],
  ["butter", "🧈"],
  ["soup", "🍲"],
  ["cereal", "🥣"],
  ["oatmeal", "🥣"],
  ["sandwich", "🥪"],
  ["taco", "🌮"],
  ["burrito", "🌯"],
  ["sushi", "🍣"],
  ["bacon", "🥓"],
  ["sausage", "🌭"],
  ["pretzel", "🥨"],
  ["doughnut", "🍩"],
  ["donut", "🍩"],
  ["cake", "🍰"],
  ["muffin", "🧁"],
  ["cupcake", "🧁"],
  ["popcorn", "🍿"],
  ["juice", "🧃"],
  ["water", "💧"],
  ["smoothie", "🥤"],
  ["mango", "🥭"],
  ["kiwi", "🥝"],
  ["coconut", "🥥"],
  ["pineapple", "🍍"],
  ["zucchini", "🥒"],
  ["squash", "🎃"],
  ["pumpkin", "🎃"],
  ["celery", "🥬"],
  ["cabbage", "🥬"],
  ["cauliflower", "🥦"],
  ["asparagus", "🥦"],
  ["shrimp", "🦐"],
  ["turkey", "🦃"],
  ["ham", "🍖"],
]

export function isCustomIconKey(iconKey: string): boolean {
  return /^custom_[a-z0-9]+(?:_[a-z0-9]+){0,15}$/.test(iconKey)
}

export function customIconKeyFromName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 48)
  const body = slug.length > 0 ? slug : "food"
  return `${CUSTOM_PREFIX}${body}`
}

/** True when keyword appears as a whole word/phrase in name. */
export function nameContainsKeyword(name: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(name)
}

export function emojiForFoodName(name: string): string | null {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ")
  if (!normalized) {
    return null
  }
  const sorted = [...FOOD_EMOJI].sort((a, b) => b[0].length - a[0].length)
  for (const [keyword, emoji] of sorted) {
    if (nameContainsKeyword(normalized, keyword)) {
      return emoji
    }
  }
  return null
}

export function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Pastel background from name — stable across renders. */
export function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  const hue = Math.abs(hash) % 360
  return `oklch(0.92 0.06 ${hue})`
}

export function labelFromIconKey(iconKey: string): string {
  if (!isCustomIconKey(iconKey)) {
    return iconKey
  }
  return iconKey.slice(CUSTOM_PREFIX.length).replace(/_/g, " ")
}
