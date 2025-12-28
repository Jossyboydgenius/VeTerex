import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  WepinUser,
  WepinAccount,
  CompletionNFT,
  Toast,
} from "@/types";

// VeryChat user type
interface VeryChatUser {
  profileId: string;
  profileName: string;
  profileImage?: string;
}

// Tracked media item
export interface TrackedMedia {
  id: string;
  platform: string;
  type: string;
  title: string;
  url: string;
  progress: number;
  duration?: number;
  startTime: number;
  lastUpdate: number;
  watchTime: number;
  completed: boolean;
  thumbnail?: string;
}

// Auth type to track which auth method is used
type AuthMethod = "wepin" | "verychat" | null;

interface AppState {
  // Auth State
  isConnected: boolean;
  isLoading: boolean;
  authMethod: AuthMethod;
  wepinUser: WepinUser | null;
  verychatUser: VeryChatUser | null;
  accounts: WepinAccount[];
  currentAccount: WepinAccount | null;
  joinedAt: string | null; // ISO date string when user first joined

  // User Data
  user: User | null;
  completions: CompletionNFT[];

  // Tracking State
  trackingEnabled: boolean;
  trackingPermissionAsked: boolean;
  activeTracking: TrackedMedia[];
  pendingMints: TrackedMedia[];

  // UI State
  toasts: Toast[];

  // Actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setWepinUser: (user: WepinUser | null) => void;
  setVeryChatUser: (user: VeryChatUser | null) => void;
  setAccounts: (accounts: WepinAccount[]) => void;
  setCurrentAccount: (account: WepinAccount | null) => void;
  setJoinedAt: (date: string) => void;
  setUser: (user: User | null) => void;
  setCompletions: (completions: CompletionNFT[]) => void;
  addCompletion: (completion: CompletionNFT) => void;

  // Tracking Actions
  setTrackingEnabled: (enabled: boolean) => void;
  setTrackingPermissionAsked: (asked: boolean) => void;
  updateActiveTracking: (media: TrackedMedia) => void;
  removeActiveTracking: (id: string) => void;
  addPendingMint: (media: TrackedMedia) => void;
  removePendingMint: (id: string) => void;
  clearActiveTracking: () => void;

  // Toast Actions
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Reset
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      isConnected: false,
      isLoading: false,
      authMethod: null,
      wepinUser: null,
      verychatUser: null,
      accounts: [],
      currentAccount: null,
      joinedAt: null,
      user: null,
      completions: [],
      trackingEnabled: true,
      trackingPermissionAsked: false,
      activeTracking: [],
      pendingMints: [],
      toasts: [],

      // Auth Actions
      setConnected: (connected) => set({ isConnected: connected }),
      setLoading: (loading) => set({ isLoading: loading }),
      setAuthMethod: (method) => set({ authMethod: method }),
      setWepinUser: (user) =>
        set((state) => ({
          wepinUser: user,
          joinedAt:
            user && !state.joinedAt ? new Date().toISOString() : state.joinedAt,
        })),
      setVeryChatUser: (user) =>
        set((state) => ({
          verychatUser: user,
          joinedAt:
            user && !state.joinedAt ? new Date().toISOString() : state.joinedAt,
        })),
      setAccounts: (accounts) => set({ accounts }),
      setCurrentAccount: (account) => set({ currentAccount: account }),
      setJoinedAt: (date) => set({ joinedAt: date }),

      // User Actions
      setUser: (user) => set({ user }),
      setCompletions: (completions) => set({ completions }),
      addCompletion: (completion) =>
        set((state) => ({
          completions: [...state.completions, completion],
        })),

      // Tracking Actions
      setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),
      setTrackingPermissionAsked: (asked) =>
        set({ trackingPermissionAsked: asked }),
      updateActiveTracking: (media) =>
        set((state) => {
          // Find by ID or by URL (to prevent duplicates)
          const existing = state.activeTracking.findIndex(
            (m) => m.id === media.id || m.url === media.url
          );
          if (existing >= 0) {
            const updated = [...state.activeTracking];
            updated[existing] = {
              ...updated[existing],
              ...media,
              id: updated[existing].id,
            };
            return { activeTracking: updated };
          }
          return { activeTracking: [...state.activeTracking, media] };
        }),
      removeActiveTracking: (id) =>
        set((state) => ({
          activeTracking: state.activeTracking.filter((m) => m.id !== id),
        })),
      addPendingMint: (media) =>
        set((state) => ({
          pendingMints: [...state.pendingMints, { ...media, completed: true }],
        })),
      removePendingMint: (id) =>
        set((state) => ({
          pendingMints: state.pendingMints.filter((m) => m.id !== id),
        })),
      clearActiveTracking: () => set({ activeTracking: [] }),

      // Toast Actions
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto remove after duration
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 5000);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Logout
      logout: () =>
        set({
          isConnected: false,
          authMethod: null,
          wepinUser: null,
          verychatUser: null,
          accounts: [],
          currentAccount: null,
          joinedAt: null,
          user: null,
          completions: [],
          activeTracking: [],
          pendingMints: [],
        }),
    }),
    {
      name: "veterex-storage",
      partialize: (state) => ({
        isConnected: state.isConnected,
        authMethod: state.authMethod,
        wepinUser: state.wepinUser,
        verychatUser: state.verychatUser,
        accounts: state.accounts,
        currentAccount: state.currentAccount,
        joinedAt: state.joinedAt,
        completions: state.completions,
        trackingEnabled: state.trackingEnabled,
        trackingPermissionAsked: state.trackingPermissionAsked,
        pendingMints: state.pendingMints,
      }),
    }
  )
);
