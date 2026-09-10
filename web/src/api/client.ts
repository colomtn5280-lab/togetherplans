import axios from "axios";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import type {
  LoginResponse,
  SignupResponse,
  Group,
  Invitation,
  InviteMethod,
  Proposal,
  ProposalItem,
  CounterProposal,
  DialogueEntry,
  Suggestion,
  Category,
  AuthTokens,
} from "../types";

const BASE_URL =
  import.meta.env.VITE_API_URL ?? "/api/v1";

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
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        processQueue(null, data.accessToken);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.accessToken}`;
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

  verifyEmail: (body: {
    email: string;
    token: string;
  }): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/verify-email", body),

  login: (body: {
    email: string;
    password: string;
  }): Promise<AxiosResponse<LoginResponse>> => api.post("/auth/login", body),

  refresh: (refreshToken: string): Promise<AxiosResponse<AuthTokens>> =>
    api.post("/auth/refresh", { refreshToken }),

  logout: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/logout"),

  googleLogin: (idToken: string): Promise<AxiosResponse<LoginResponse>> =>
    api.post("/auth/google", { idToken }),

  forgotPassword: (email: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/reset-password", { token, password }),
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

  invite: (
    groupId: string,
    body: { method: InviteMethod; email?: string; phone?: string },
  ): Promise<AxiosResponse<Invitation>> =>
    api.post(`/groups/${groupId}/invite`, body),

  acceptInvite: (
    groupId: string,
    inviteCode: string,
  ): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/groups/${groupId}/accept-invite`, { inviteCode }),

  removeMember: (
    groupId: string,
    userId: string,
  ): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/groups/${groupId}/members/${userId}`),
};

// ── Proposals ─────────────────────────────────────────────────────────────────

export const proposalsApi = {
  create: (body: {
    groupId: string;
    categoryId: string;
    proposedDate: string;
    proposedTime?: string;
    radiusKm?: number;
  }): Promise<AxiosResponse<Proposal>> => api.post("/proposals", body),

  get: (id: string): Promise<AxiosResponse<Proposal>> =>
    api.get(`/proposals/${id}`),

  addItem: (
    proposalId: string,
    suggestionId: string,
  ): Promise<AxiosResponse<ProposalItem>> =>
    api.post(`/proposals/${proposalId}/items`, { suggestionId }),

  acceptItem: (
    proposalId: string,
    itemId: string,
  ): Promise<AxiosResponse<ProposalItem>> =>
    api.post(`/proposals/${proposalId}/items/${itemId}/accept`),

  rejectItem: (
    proposalId: string,
    itemId: string,
  ): Promise<AxiosResponse<ProposalItem>> =>
    api.post(`/proposals/${proposalId}/items/${itemId}/reject`),

  counter: (
    proposalId: string,
    changes: Record<string, unknown>,
  ): Promise<AxiosResponse<CounterProposal>> =>
    api.post(`/proposals/${proposalId}/counter`, { changes }),

  dialogue: (proposalId: string): Promise<AxiosResponse<DialogueEntry[]>> =>
    api.get(`/proposals/${proposalId}/dialogue`),

  lock: (
    proposalId: string,
    itemId: string,
  ): Promise<AxiosResponse<{ message: string; proposalId: string; status: string }>> =>
    api.post(`/proposals/${proposalId}/lock`, { itemId }),

  consensus: (
    proposalId: string,
  ): Promise<AxiosResponse<Record<string, unknown>>> =>
    api.get(`/proposals/${proposalId}/consensus`),
};

// ── Suggestions ───────────────────────────────────────────────────────────────

export const suggestionsApi = {
  list: (params: {
    categoryId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    limit?: number;
  }): Promise<AxiosResponse<Suggestion[]>> =>
    api.get("/suggestions", { params }),

  get: (id: string): Promise<AxiosResponse<Suggestion>> =>
    api.get(`/suggestions/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: (): Promise<AxiosResponse<Category[]>> => api.get("/categories"),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (unreadOnly = false): Promise<AxiosResponse<{ count: number; notifications: unknown[] }>> =>
    api.get("/notifications", { params: { unreadOnly } }),

  markRead: (id: string): Promise<AxiosResponse<unknown>> =>
    api.patch(`/notifications/${id}/read`),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: (): Promise<AxiosResponse<unknown>> =>
    api.get("/users/me"),

  getPreferences: (): Promise<AxiosResponse<{ userId: string; categories: unknown[] }>> =>
    api.get("/users/me/preferences"),

  recordInteraction: (categoryId: string, interaction: string): Promise<AxiosResponse<unknown>> =>
    api.post("/users/me/preferences/interaction", { categoryId, interaction }),

  requestExport: (): Promise<AxiosResponse<{ message: string; downloadUrl?: string }>> =>
    api.post("/users/me/export"),

  requestDeletion: (): Promise<AxiosResponse<{ message: string; deletionDate: string }>> =>
    api.delete("/users/me"),

  cancelDeletion: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/users/me/cancel-deletion"),
};

export default api;
