// ===== YGOPRODeck API Types =====

export interface YugiohCard {
  id: number;
  name: string;
  type: string;
  humanReadableCardType: string;
  frameType: string;
  desc: string;
  race: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  archetype?: string;
  linkval?: number;
  linkmarkers?: string[];
  scale?: number;
  card_sets?: CardSet[];
  card_images: CardImage[];
  card_prices: CardPrice[];
}

export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface CardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

export interface YGOProDeckResponse {
  data: YugiohCard[];
}

export interface YGOCardSet {
  set_name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date: string;
  set_image?: string;
}

// ===== Product Category Types =====

export type ProductCategory = "cards" | "accessories";

// ===== Accessory Types =====

export type AccessoryCategory = "playmat" | "deck-box" | "card-sleeves" | "booster-box" | "starter-deck" | "tin-bundle" | "other";

export type AccessoryGame = "yugioh" | "pokemon" | "mtg" | "multi";

export const ACCESSORY_GAME_LABELS: Record<AccessoryGame, string> = {
  yugioh: "Yu-Gi-Oh!",
  pokemon: "Pokemon",
  mtg: "Magic: The Gathering",
  multi: "All Games",
};

export const ACCESSORY_GAME_LIST: AccessoryGame[] = ["yugioh", "pokemon", "mtg", "multi"];

export interface AccessoryItem {
  id: string;
  name: string;
  description: string;
  category: AccessoryCategory;
  subcategory?: string; // e.g., "japanese-size", "standard-size" for sleeves
  price: number;
  cost?: number; // what we paid
  quantity: number;
  imageUrl?: string;
  brand?: string;
  color?: string;
  game?: AccessoryGame; // which TCG game this is for
  setName?: string; // for sealed products: which set (e.g., "Phantom Nightmare")
  dateAdded: string;
  slug: string;
}

export const ACCESSORY_CATEGORY_LABELS: Record<AccessoryCategory, string> = {
  playmat: "Playmats",
  "deck-box": "Deck Boxes",
  "card-sleeves": "Card Sleeves",
  "booster-box": "Booster Boxes",
  "starter-deck": "Starter Decks",
  "tin-bundle": "Tins & Bundles",
  "other": "Other",
};

export const ACCESSORY_CATEGORY_LIST: AccessoryCategory[] = [
  "playmat",
  "deck-box",
  "card-sleeves",
  "booster-box",
  "starter-deck",
  "tin-bundle",
  "other",
];

export const ACCESSORY_CATEGORIES: AccessoryCategory[] = ["playmat", "deck-box", "card-sleeves"];
export const SEALED_CATEGORIES: AccessoryCategory[] = ["booster-box", "starter-deck", "tin-bundle"];

// ===== Inventory Types =====

export type CardCondition = "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
export type CardEdition = "1st Edition" | "Unlimited" | "Limited Edition";
export type TCGGame = "yugioh" | "pokemon" | "mtg";

export const TCG_GAME_LABELS: Record<TCGGame, string> = {
  yugioh: "Yu-Gi-Oh!",
  pokemon: "Pokemon",
  mtg: "Magic: The Gathering",
};

export const TCG_GAME_LIST: TCGGame[] = ["yugioh", "pokemon", "mtg"];

export const CONDITION_SHORT: Record<CardCondition, string> = {
  "Near Mint": "NM",
  "Lightly Played": "LP",
  "Moderately Played": "MP",
  "Heavily Played": "HP",
  "Damaged": "DMG",
};

export const CONDITION_ORDER: CardCondition[] = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];

// ===== Pricing Rule (Auto-pricing) =====

export interface PricingRule {
  type: "fixed" | "market_minus_percent" | "market_minus_amount";
  value: number; // the fixed price, percentage, or dollar amount
  minPrice?: number; // floor price
}

export interface InventoryItem {
  id: string;
  cardName: string;
  setCode: string;
  setName: string;
  rarity: string;
  edition: CardEdition;
  condition: CardCondition;
  price: number;
  cost?: number; // how much you paid for the card
  quantity: number;
  language: string;
  dateAdded: string;
  game: TCGGame;
  slug: string;
  imageUrl?: string; // optional custom photo
  pricingRule?: PricingRule; // auto-pricing rule
}

// ===== Unified Card Search Result =====

export interface UnifiedCardPrinting {
  setCode: string;
  setName: string;
  rarity: string;
  number?: string;
  price?: string;
}

export interface UnifiedCardResult {
  id: string;
  name: string;
  type: string;
  description: string;
  imageSmall: string;
  imageLarge: string;
  game: TCGGame;
  stats?: Record<string, string | number>;
  printings: UnifiedCardPrinting[];
}

// ===== Cart Types =====

export interface CartItem {
  inventoryId: string;
  cardName: string;
  setCode: string;
  condition: CardCondition;
  edition: CardEdition;
  price: number;
  quantity: number;
  maxQuantity: number;
  imageUrl: string;
  slug: string;
}

// ===== Wishlist Types =====

export interface WishlistItem {
  cardName: string;
  imageUrl: string;
  slug: string;
  addedAt: string;
}

// ===== Filter & Sort Types =====

export interface SearchFilters {
  query: string;
  setName: string;
  rarity: string[];
  cardType: string; // "All" | "Monster" | "Spell" | "Trap"
  condition: CardCondition[];
  edition: CardEdition[];
  priceMin: number | null;
  priceMax: number | null;
  game: TCGGame;
}

export type SortOption =
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "newest"
  | "rarity";

export const SORT_LABELS: Record<SortOption, string> = {
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
  "name-desc": "Name: Z to A",
  newest: "Newest Listed",
  rarity: "Rarity: Highest First",
};

// ===== Order Types =====

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  inventoryId: string;
  cardName: string;
  setCode: string;
  condition: string;
  edition: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Coupon Types =====

export interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number; // percentage (10 = 10%) or fixed dollar amount
  minOrder?: number;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
}

// ===== Recently Viewed =====

export interface RecentlyViewedCard {
  cardName: string;
  slug: string;
  imageUrl: string;
  lowestPrice: number;
  viewedAt: string;
}

// ===== Back-in-Stock Alert =====

export interface StockAlert {
  email: string;
  cardName: string;
  setCode: string;
  condition?: CardCondition;
  createdAt: string;
}

// ===== Card Submission Types =====

export type SubmissionStatus = "pending" | "reviewing" | "offer_sent" | "accepted" | "declined" | "completed";

export interface CardSubmissionImage {
  url: string;
  caption?: string; // e.g. "Front", "Back", "Close-up of corner"
}

export interface CardSubmission {
  id: string;
  // Customer info
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  // Card details
  description: string; // what they're selling, general description
  estimatedValue?: string; // what they think it's worth
  cardCount?: number; // approximate number of cards
  games?: string[]; // which TCGs: "Yu-Gi-Oh!", "Pokemon", "MTG", etc.
  images: CardSubmissionImage[]; // photo URLs
  // Admin response
  status: SubmissionStatus;
  offerAmount?: number; // our offer
  adminNotes?: string; // internal notes
  responseMessage?: string; // message sent back to customer
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
