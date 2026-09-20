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
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "owner" | "member";
}

export interface Invitation {
  id?: string;
  invitationId?: string;
  token?: string;
  inviteCode?: string; // legacy alias for token
  groupId?: string;
  groupName?: string;
  inviterName?: string;
  method: "email" | "sms" | "qr" | "link" | "code";
  expiresAt: string;
}

export type InviteMethod = "email" | "sms" | "qr" | "link" | "code";

// New backend proposal shape
export interface ProposalOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
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
  consensus: boolean;
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
  rating?: number;
  priceLevel?: number;
  imageUrl?: string;
  address?: string;
  distance?: number;
  source?: "yelp" | "google" | "tmdb" | "fandango" | "internal";
  externalId?: string;
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
