import axios from "axios";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { ALL_CATEGORIES } from "../constants/categories";
import type {
  LoginResponse,
  SignupResponse,
  Group,
  Invitation,
  InviteMethod,
  Proposal,
  NewProposalOptionInput,
  CounterProposal,
  Suggestion,
  AuthTokens,
} from "../types";

const BASE_URL =
  import.meta.env.VITE_API_URL ?? "https://api.togetherplans.app/api";

// ── Axios instance ────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: 401 → auto-refresh ─────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (original.headers) {
              original.headers.Authorization = `Bearer ${token}`;
            }
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<AuthTokens>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
        );
        const newAccessToken = data.accessToken || data.token || "";
        localStorage.setItem("accessToken", newAccessToken);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        processQueue(null, newAccessToken);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AxiosResponse<SignupResponse>> => api.post("/auth/signup", body),

  login: (body: {
    email: string;
    password: string;
  }): Promise<AxiosResponse<LoginResponse>> => api.post("/auth/login", body),

  me: (): Promise<AxiosResponse<{ user?: unknown } & Record<string, unknown>>> =>
    api.get("/auth/me"),

  refresh: (refreshToken: string): Promise<AxiosResponse<AuthTokens>> =>
    api.post("/auth/refresh", { refreshToken }),

  logout: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/logout"),

  googleLogin: (idToken: string): Promise<AxiosResponse<LoginResponse>> =>
    api.post("/auth/google", { idToken }),

  facebookLogin: (accessToken: string, providerId: string, email?: string, name?: string): Promise<AxiosResponse<LoginResponse>> =>
    api.post("/auth/facebook", { accessToken, providerId, email, name }),

  appleLogin: (identityToken: string, displayName?: string, email?: string): Promise<AxiosResponse<LoginResponse>> =>
    api.post("/auth/apple", { identityToken, displayName, email }),

  forgotPassword: (email: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/reset-password", { token, password }),

  deleteAccount: (): Promise<AxiosResponse<{ message: string }>> =>
    api.delete("/auth/me"),

  verifyEmail: (body: {
    email: string;
    token: string;
  }): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/verify-email", body),
};

// ── Groups ────────────────────────────────────────────────────────────────────

export const groupsApi = {
  list: (): Promise<AxiosResponse<Group[]>> => api.get("/groups"),

  get: (id: string): Promise<AxiosResponse<Group>> =>
    api.get(`/groups/${id}`),

  create: (body: {
    name: string;
    description?: string;
  }): Promise<AxiosResponse<Group>> => api.post("/groups", body),

  delete: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/groups/${id}`),

  proposals: (groupId: string): Promise<AxiosResponse<Proposal[]>> =>
    api.get(`/groups/${groupId}/proposals`),
};

// ── Invitations ───────────────────────────────────────────────────────────────

export const invitationsApi = {
  create: (body: {
    groupId: string;
    method: InviteMethod;
    target?: string;
  }): Promise<AxiosResponse<Invitation>> => api.post("/invitations", body),

  get: (token: string): Promise<AxiosResponse<Invitation>> =>
    api.get(`/invitations/${token}`),

  accept: (token: string): Promise<AxiosResponse<{ message: string; group?: Group }>> =>
    api.post(`/invitations/${token}/accept`),
};

// ── Proposals ─────────────────────────────────────────────────────────────────

export const proposalsApi = {
  create: (body: {
    groupId: string;
    title: string;
    dateTime: string;
    options: NewProposalOptionInput[];
  }): Promise<AxiosResponse<Proposal>> => api.post("/proposals", body),

  get: (id: string): Promise<AxiosResponse<Proposal>> =>
    api.get(`/proposals/${id}`),

  vote: (
    proposalId: string,
    optionId: string,
  ): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/proposals/${proposalId}/vote`, { optionId }),

  retractVote: (
    proposalId: string,
  ): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/proposals/${proposalId}/votes`),

  counter: (
    proposalId: string,
    body: { title: string; dateTime: string; options: NewProposalOptionInput[] },
  ): Promise<AxiosResponse<CounterProposal>> =>
    api.post(`/proposals/${proposalId}/counter`, body),

  cancel: (
    proposalId: string,
  ): Promise<AxiosResponse<Proposal>> =>
    api.patch(`/proposals/${proposalId}/cancel`),

  shareLink: (
    proposalId: string,
  ): Promise<AxiosResponse<{ shareToken: string; shareUrl: string }>> =>
    api.post(`/proposals/${proposalId}/share-link`),
};

// ── Public share / guest voting (no auth) ─────────────────────────────────────

export const publicShareApi = {
  get: (
    shareToken: string,
    guestId?: string,
  ): Promise<AxiosResponse<import("../types").PublicShareProposal>> =>
    api.get(`/share/${shareToken}`, { params: guestId ? { guestId } : {} }),

  vote: (
    shareToken: string,
    body: { optionId: string; guestId: string; guestName?: string },
  ): Promise<AxiosResponse<{
    vote: { optionId: string; guestName: string | null };
    proposal: import("../types").PublicShareProposal;
  }>> => api.post(`/share/${shareToken}/vote`, body),
};

// ── Suggestions ───────────────────────────────────────────────────────────────

export const suggestionsApi = {
  list: (params: {
    category?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    // legacy aliases accepted too
    categoryId?: string;
    radiusKm?: number;
    limit?: number;
  }): Promise<AxiosResponse<Suggestion[]>> =>
    api.get("/suggestions", {
      params: {
        lat: params.lat,
        lng: params.lng,
        category: params.category ?? params.categoryId,
        radius: params.radius ?? params.radiusKm,
      },
    }),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (): Promise<AxiosResponse<{ count: number; notifications: unknown[] }>> =>
    api.get("/notifications"),

  markRead: (id: string): Promise<AxiosResponse<unknown>> =>
    api.patch(`/notifications/${id}/read`),
};

// ── Users (proxied via /auth/me) ──────────────────────────────────────────────

export const usersApi = {
  getMe: (): Promise<AxiosResponse<unknown>> =>
    api.get("/auth/me"),

  getPreferences: (): Promise<AxiosResponse<{ userId: string; categories: unknown[] }>> =>
    // No preferences endpoint on this backend; return empty stub
    Promise.resolve({ data: { userId: "", categories: [] }, status: 200, statusText: "OK", headers: {}, config: {} as never }),

  requestExport: (): Promise<AxiosResponse<{ message: string; downloadUrl?: string }>> =>
    // No export endpoint; return informational message
    Promise.resolve({ data: { message: "Export not available" }, status: 200, statusText: "OK", headers: {}, config: {} as never }),

  requestDeletion: (): Promise<AxiosResponse<{ message: string }>> =>
    api.delete("/auth/me"),
};

// ── Share Cards ───────────────────────────────────────────────────────────────

export const shareCardsApi = {
  get: (proposalId: string): Promise<AxiosResponse<import("../types").ShareCard>> =>
    api.get(`/share-cards/${proposalId}`),

  generate: (proposalId: string): Promise<AxiosResponse<import("../types").ShareCard>> =>
    api.post(`/share-cards/${proposalId}/generate`),

  byToken: (shareToken: string): Promise<AxiosResponse<import("../types").ShareCard>> =>
    api.get(`/share-cards/by-token/${shareToken}`),
};

// ── After Dark ────────────────────────────────────────────────────────────────

export const afterDarkApi = {
  status: (utcOffset?: number): Promise<AxiosResponse<import("../types").AfterDarkStatus>> =>
    api.get("/after-dark/status", { params: utcOffset !== undefined ? { utcOffset } : {} }),

  suggestions: (params?: {
    mood?: string; lat?: number; lng?: number; zip?: string; radius?: number;
  }): Promise<AxiosResponse<{ mood: string | null; count: number; suggestions: import("../types").AfterDarkSuggestion[] }>> =>
    api.get("/after-dark/suggestions", { params }),

  getMood: (): Promise<AxiosResponse<{ mood: import("../types").AfterDarkMood | null; availableMoods: string[]; preferredCategories: string[] | null }>> =>
    api.get("/after-dark/mood"),

  setMood: (mood: string): Promise<AxiosResponse<{ mood: string; message: string; preferredCategories: string[] }>> =>
    api.post("/after-dark/mood", { mood }),

  impulse: (
    groupId: string,
    optionName: string,
    optionCategory: string,
    optionAddress?: string,
  ): Promise<AxiosResponse<{ proposal: import("../types").Proposal; message: string; impulseDateTime: string }>> =>
    api.post("/after-dark/impulse", { groupId, optionName, optionCategory, optionAddress }),
};

// Categories — unified 15-category list (+ Custom) from GET /api/categories,
// falling back to the local constant if the request fails.

export const categoriesApi = {
  list: async (): Promise<AxiosResponse<{ id: string; name: string; emoji?: string; tagline?: string }[]>> => {
    try {
      const res = await api.get<{ categories: { id: string; name: string; emoji?: string; tagline?: string }[] }>("/categories");
      return { ...res, data: res.data.categories };
    } catch {
      return { data: ALL_CATEGORIES, status: 200, statusText: "OK", headers: {}, config: {} as never };
    }
  },
};

// ── Safety ────────────────────────────────────────────────────────────────────

export const safetyApi = {
  blockUser: (userId: string) => api.post(`/safety/block/${userId}`),
  reportUser: (data: { reportedUserId: string; reason: string; details?: string }) =>
    api.post('/safety/report', data),
};

// ── Business Portal ───────────────────────────────────────────────────────────

const businessClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'https://api.togetherplans.app/api'),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

businessClient.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('business_token');
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const businessApi = {
  register: (data: object) => businessClient.post('/business/auth/register', data),
  login: (data: object) => businessClient.post('/business/auth/login', data),
  getMe: () => businessClient.get('/business/me'),
  updateMe: (data: object) => businessClient.patch('/business/me', data),
  getListings: () => businessClient.get('/business/me/listings'),
  createListing: (data: object) => businessClient.post('/business/me/listings', data),
  updateListing: (id: string, data: object) => businessClient.patch(`/business/me/listings/${id}`, data),
  deleteListing: (id: string) => businessClient.delete(`/business/me/listings/${id}`),
  getAnalytics: (period: string) => businessClient.get(`/business/me/analytics?period=${period}`),
  logImpression: (data: object) => businessClient.post('/business/impressions', data),
  getPublicStats: () => businessClient.get('/business/public/stats'),
};

export default api;
