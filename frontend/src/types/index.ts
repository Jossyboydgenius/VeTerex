// Media Types
export type MediaType =
  | "book"
  | "movie"
  | "anime"
  | "manga"
  | "comic"
  | "tvshow";

export interface MediaItem {
  id: string;
  externalId: string; // ISBN, IMDB, MAL ID, etc.
  title: string;
  type: MediaType;
  description: string;
  coverImage: string;
  releaseYear: number;
  creator: string; // Author, Director, Studio
  genre: string[];
  totalCompletions: number;
  metadata?: Record<string, string>;
}

export interface CompletionNFT {
  id: string;
  tokenId: string;
  mediaId: string;
  media: MediaItem;
  mintedAt: Date;
  transactionHash: string;
  completedAt: Date;
  rating?: number;
  review?: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

// User Types
export interface User {
  id: string;
  address: string;
  email?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  joinedAt: Date;
  completions: CompletionNFT[];
  favorites: string[];
  following: string[];
  followers: string[];
}

export interface WepinUser {
  status: "success" | "fail";
  userInfo?: {
    userId: string;
    email: string;
    provider: string;
    use2FA: boolean;
  };
  userStatus?: {
    loginStatus: "complete" | "pinRequired" | "registerRequired";
    pinRequired?: boolean;
  };
  walletId?: string;
  token?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface WepinAccount {
  accountId?: string;
  accountTokenId?: string;
  address: string;
  addressPath?: string;
  coinId?: number;
  symbol?: string;
  label?: string;
  name?: string;
  network: string;
  balance?: string;
  decimals?: number;
  iconUrl?: string;
  ids?: string;
  cmkId?: number;
  contract?: string;
  isAA?: boolean;
}

// Backend User Types (from Prisma database)
export interface BackendUser {
  id: string;
  verychatId?: string | null;
  wepinId?: string | null;
  profileName: string;
  profileImage?: string | null;
  bio?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Social/Community Types
export interface Group {
  id: string;
  mediaId: string;
  media: MediaItem;
  members: User[];
  memberCount: number;
  createdAt: Date;
  recentActivity: GroupActivity[];
}

export interface GroupActivity {
  id: string;
  userId: string;
  user: User;
  type: "completion" | "review" | "join";
  content?: string;
  createdAt: Date;
}

// UI State Types
export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

// Filter Types
export interface MediaFilters {
  type?: MediaType;
  genre?: string;
  year?: number;
  search?: string;
  sortBy?: "popular" | "recent" | "alphabetical";
}
