export interface User {
  id: string;
  email: string;
  displayName: string;
  latitude?: number;
  longitude?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: string;
  joinedAt: string;
  user?: { id: string; displayName: string };
}

export interface Invitation {
  id: string;
  groupId: string;
  inviterId: string;
  method: string;
  target?: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'DECLINED';
  expiresAt: string;
  inviteUrl: string;
}

export interface ActivityOption {
  id: string;
  /** Backend returns 'name'; legacy UI may use 'title' */
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  /** Backend returns 'address'; legacy UI may use 'location' */
  address?: string;
  location?: string;
  estimatedCost?: string;
  estimatedDuration?: string;
  imageUrl?: string;
  sourceUrl?: string;
  eventDate?: string;
  rating?: number;
  priceLevel?: number;
  sourceName?: string;
  /** Votes nested inside each option (backend response shape) */
  votes?: { userId: string }[];
  /** Advisory guest vote count via public share link */
  guestVoteCount?: number;
}

export interface TallyEntry {
  optionId: string;
  votes: number;
  consensus: boolean;
  /** Advisory guest votes via public share link (guests advise, members decide) */
  guestVotes?: number;
}

export interface Proposal {
  id: string;
  groupId: string;
  proposerId: string;
  title: string;
  description?: string;
  scheduledFor?: string;
  dateTime?: string;
  /** Backend statuses: 'OPEN' | 'DECIDED' | 'CANCELLED'. Legacy: 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' */
  status: 'OPEN' | 'DECIDED' | 'CANCELLED' | 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  options: ActivityOption[];
  /** Flat votes list (legacy shape) */
  votes?: Vote[];
  /** Per-option vote tally from backend */
  tally?: TallyEntry[];
  /** Total group member count from backend */
  memberCount?: number;
  consensus?: ConsensusResult;
  createdAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  optionId: string;
  proposalId: string;
}

export interface ConsensusResult {
  reached: boolean;
  winningOptionId?: string;
  winningOption?: ActivityOption;
  totalVoters: number;
  votes: { optionId: string; count: number; percentage: number }[];
}

// Plan builder option shape — used by PlanBuilderContext and CreateProposalScreen
export interface PlanBuilderOption {
  id: string; // uuid for local tracking
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

// Shape returned by GET /api/suggestions
export interface Suggestion {
  id?: string;
  name: string;        // API returns 'name', not 'title'
  description: string;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  sourceUrl?: string;
  date?: string;        // ISO date string for events
  rating?: number;
  priceLevel?: number;
  distanceMiles?: number;
  sourceName?: string;
  /** True for seed-catalog "idea" prompts (no live listing behind them). */
  isIdea?: boolean;
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: { groupId?: string } | undefined;
  GroupDetail: { groupId: string; groupName: string };
  ProposalDetail: { proposalId: string; openInvite?: boolean };
  CreateProposal: {
    groupId: string;
    options?: PlanBuilderOption[];
    addSuggestion?: { name: string; category: string; address: string; description: string; imageUrl?: string; sourceUrl?: string; eventDate?: string; rating?: number; priceLevel?: number; sourceName?: string };
  };
  CreateGroup: undefined;
  InviteMembers: { groupId: string };
  Suggestions: { groupId?: string; returnTo?: 'CreateProposal' };
  ShareCard: { proposalId: string };
  AfterDark: { groupId?: string };
};

// ── Share Card types ───────────────────────────────────────────────────────────

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

// ── After Dark types ───────────────────────────────────────────────────────────

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
  | 'adventurous'
  | 'romantic'
  | 'social'
  | 'chill'
  | 'spontaneous'
  | 'cultural';

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
  costTier: 'free' | '$' | '$$' | '$$$';
  imageUrl?: string;
  ticketUrl?: string;
  dateFriendly: boolean;
  groupFriendly: boolean;
  durationMinutes?: number;
  source: string;
  externalId: string;
}
