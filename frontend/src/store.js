import { create } from 'zustand';

export const useStore = create((set) => ({
  // User state
  userId: null,
  userData: null,
  trustData: null,
  setUserData: (id, user, trust) => set({ userId: id, userData: user, trustData: trust }),
  
  // App state
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  
  // Active credential
  credential: null,
  setCredential: (cred) => set({ credential: cred }),
  
  // Toasts
  toasts: [],
  addToast: (message, type = 'info') => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), message, type }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // Global reset
  reset: () => set({
    userId: null,
    userData: null,
    trustData: null,
    currentStep: 1,
    credential: null,
  })
}));
