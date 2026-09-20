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
  /** Votes nested inside each option (backend response shape) */
  votes?: { userId: string }[];
}

export interface TallyEntry {
  optionId: string;
  votes: number;
  consensus: boolean;
}

export interface Proposal {
  id: string;
  groupId: string;
  proposerId: string;
  title: string;
  description?: string;
  scheduledFor?: string;
  dateTime?: string;
  /** Backend statuses: 'OPEN' | 'DECIDED'. Legacy: 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' */
  status: 'OPEN' | 'DECIDED' | 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
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

// Shape returned by GET /api/suggestions
export interface Suggestion {
  name: string;        // API returns 'name', not 'title'
  description: string;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: { groupId?: string } | undefined;
  GroupDetail: { groupId: string; groupName: string };
  ProposalDetail: { proposalId: string };
  CreateProposal: { groupId: string };
  CreateGroup: undefined;
  InviteMembers: { groupId: string };
  Suggestions: { groupId?: string };
};
