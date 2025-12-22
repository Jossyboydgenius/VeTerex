import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, WepinUser, WepinAccount, CompletionNFT, Toast } from '@/types'

interface AppState {
  // Auth State
  isConnected: boolean
  isLoading: boolean
  wepinUser: WepinUser | null
  accounts: WepinAccount[]
  currentAccount: WepinAccount | null
  
  // User Data
  user: User | null
  completions: CompletionNFT[]
  
  // UI State
  toasts: Toast[]
  
  // Actions
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void
  setWepinUser: (user: WepinUser | null) => void
  setAccounts: (accounts: WepinAccount[]) => void
  setCurrentAccount: (account: WepinAccount | null) => void
  setUser: (user: User | null) => void
  setCompletions: (completions: CompletionNFT[]) => void
  addCompletion: (completion: CompletionNFT) => void
  
  // Toast Actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  
  // Reset
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      isConnected: false,
      isLoading: false,
      wepinUser: null,
      accounts: [],
      currentAccount: null,
      user: null,
      completions: [],
      toasts: [],
      
      // Auth Actions
      setConnected: (connected) => set({ isConnected: connected }),
      setLoading: (loading) => set({ isLoading: loading }),
      setWepinUser: (user) => set({ wepinUser: user }),
      setAccounts: (accounts) => set({ accounts }),
      setCurrentAccount: (account) => set({ currentAccount: account }),
      
      // User Actions
      setUser: (user) => set({ user }),
      setCompletions: (completions) => set({ completions }),
      addCompletion: (completion) => set((state) => ({
        completions: [...state.completions, completion]
      })),
      
      // Toast Actions
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(7)
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }))
        
        // Auto remove after duration
        setTimeout(() => {
          get().removeToast(id)
        }, toast.duration || 5000)
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),
      
      // Logout
      logout: () => set({
        isConnected: false,
        wepinUser: null,
        accounts: [],
        currentAccount: null,
        user: null,
        completions: []
      })
    }),
    {
      name: 'veterex-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        currentAccount: state.currentAccount,
        completions: state.completions
      })
    }
  )
)
