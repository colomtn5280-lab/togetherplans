// Shared TypeScript types between web and API

export interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends User, AuthTokens {}

export interface SignupResponse {
  userId: string;
  email: string;
  message: string;
  verificationToken?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "owner" | "member";
}

export interface Invitation {
  invitationId: string;
  inviteCode: string;
  expiresAt: string;
  method: "email" | "sms" | "qr" | "link" | "code";
}

export type InviteMethod = "email" | "sms" | "qr" | "link" | "code";

export interface Proposal {
  id: string;
  groupId: string;
  categoryId: string;
  proposedDate: string;
  proposedTime?: string;
  radiusKm?: number;
  status: "pending" | "accepted" | "rejected" | "locked";
  items: ProposalItem[];
  counterProposals?: CounterProposal[];
}

export interface ProposalItem {
  id: string;
  suggestionId: string;
  suggestion?: Suggestion;
  status: "pending" | "accepted" | "rejected";
  votes: number;
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
  source: "yelp" | "google" | "tmdb" | "fandango" | "internal";
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
