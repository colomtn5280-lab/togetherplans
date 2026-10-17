// Shared TypeScript types between web and API

export interface User {
  userId: string;
  id?: string; // alias for userId
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export interface AuthTokens {
  token?: string;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  token?: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  // legacy flat fields (fallback)
  userId?: string;
  email?: string;
}

export interface SignupResponse {
  token?: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  message?: string;
  // legacy flat fields (fallback)
  userId?: string;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: string;
  members?: GroupMember[];
  proposals?: Proposal[];
}

export interface GroupMember {
  id?: string;
  userId: string;
  groupId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "owner" | "member";
  joinedAt?: string;
  /** Nested user object returned by the backend */
  user?: {
    id?: string;
    displayName?: string;
  };
}

export interface Invitation {
  id?: string;
  invitationId?: string;
  token?: string;
  inviteCode?: string; // legacy alias for token
  inviteUrl?: string;  // full URL returned by backend
  groupId?: string;
  groupName?: string;
  inviterName?: string;
  method: "email" | "sms" | "qr" | "link" | "code" | "username";
  expiresAt: string;
}

export type InviteMethod = "email" | "sms" | "qr" | "link" | "code" | "username";

// New backend proposal shape
export interface ProposalOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  sourceUrl?: string;
  eventDate?: string;
  rating?: number;
  priceLevel?: number;
  sourceName?: string;
  votes: Vote[];
  // legacy fields
  status?: "pending" | "accepted" | "rejected";
  suggestion?: {
    name?: string;
    address?: string;
    rating?: number;
  };
}

export interface Vote {
  userId: string;
}

export interface TallyEntry {
  optionId: string;
  votes: number;
  guestVotes?: number;
  consensus: boolean;
}

// Public guest-voting snapshot returned by /api/share/:shareToken
export interface PublicShareOption {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  eventDate?: string | null;
  memberVotes: number;
  guestVotes: number;
  totalVotes: number;
}

export interface PublicShareProposal {
  shareToken: string;
  status: "OPEN" | "DECIDED" | "CANCELLED" | "COUNTERED";
  title: string;
  dateTime: string;
  groupName: string;
  creatorName: string;
  options: PublicShareOption[];
  totalVotes: number;
  winnerOptionId: string | null;
  yourVote: string | null;
}

export interface Proposal {
  id: string;
  groupId: string;
  title?: string;
  dateTime?: string;
  // legacy fields
  proposedDate?: string;
  proposedTime?: string;
  categoryId?: string;
  radiusKm?: number;
  status: "OPEN" | "CANCELLED" | "DECIDED" | "pending" | "accepted" | "rejected" | "locked";
  options?: ProposalOption[];
  items?: ProposalOption[]; // legacy alias
  memberCount?: number;
  tally?: TallyEntry[];
  counterProposals?: CounterProposal[];
}

export interface NewProposalOptionInput {
  name: string;
  category: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  sourceUrl?: string;
  eventDate?: string;
  rating?: number;
  priceLevel?: number;
  sourceName?: string;
}

// Plan builder option (client-side, pre-submission)
export interface PlanBuilderOption {
  id: string; // client-side UUID
  name: string;
  category: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  sourceUrl?: string;
  eventDate?: string;
  rating?: number;
  priceLevel?: number;
  sourceName?: string;
}

export interface CounterProposal {
  id: string;
  parentId: string;
  createdById: string;
  changes: Partial<Proposal>;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface DialogueEntry {
  id: string;
  proposalId: string;
  type: "proposal" | "counter" | "accept" | "reject" | "lock";
  userId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface Suggestion {
  id: string;
  name: string;
  category: string;
  description?: string;
  shortDescription?: string;  // Foursquare API uses this
  rating?: number;
  priceLevel?: number;
  costTier?: string;  // Foursquare API uses this ($$, $$$, etc.)
  imageUrl?: string;
  sourceUrl?: string;
  date?: string;
  eventDate?: string;  // Some APIs use this
  address?: string;
  distance?: number;
  distanceMiles?: number;
  sourceName?: string;
  source?: "yelp" | "google" | "tmdb" | "fandango" | "foursquare" | "internal";
  externalId?: string;
  /** True for seed-catalog idea prompts (no real listing behind them). Absent on older responses. */
  isIdea?: boolean;
  /** Venue name (Foursquare compatibility) */
  venue?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  subcategories?: Category[];
}

export interface ApiError {
  error: string;
  message: string;
  timestamp?: string;
}

// ProposalItem is an alias for ProposalOption for backward compat
export type ProposalItem = ProposalOption;

// ── Share Card types ──────────────────────────────────────────────────────────

export interface ShareCardOption {
  id: string;
  name: string;
  category: string;
  voteCount: number;
  isWinner: boolean;
}

export interface ShareCardWinningOption {
  name: string;
  category: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  ticketUrl?: string | null;
  voteCount: number;
  emoji: string;
}

export interface ShareCard {
  proposalId: string;
  shareToken: string;
  shareUrl: string;
  status: string;
  title: string;
  dateTime: string;
  dateFormatted: string;
  timeFormatted: string;
  groupName: string;
  groupType?: string | null;
  creatorName: string;
  winningOption: ShareCardWinningOption | null;
  allOptions: ShareCardOption[];
  totalVotes: number;
  og: {
    title: string;
    description: string;
    image: string | null;
    url: string;
  };
}

// ── After Dark types ──────────────────────────────────────────────────────────

export interface AfterDarkItem {
  id: string;
  title: string;
  description: string;
  tier: 'ROMANTIC' | 'SPICY';
  icon: string;
  color: string;
  createdBy: string | null;
  groupId: string | null;
  reportedCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AfterDarkMood =
  | "adventurous"
  | "romantic"
  | "social"
  | "chill"
  | "spontaneous"
  | "cultural";

export interface AfterDarkStatus {
  active: boolean;
  minutesUntilActive: number;
  activeHours: { start: number; end: number };
  currentMood: AfterDarkMood | null;
  availableMoods: AfterDarkMood[];
}

export interface AfterDarkSuggestion {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  venue?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  date?: string;
  timeStart?: string;
  price?: string;
  costTier: "free" | "$" | "$$" | "$$$";
  imageUrl?: string;
  ticketUrl?: string;
  dateFriendly: boolean;
  groupFriendly: boolean;
  durationMinutes?: number;
  source: string;
  externalId: string;
}
