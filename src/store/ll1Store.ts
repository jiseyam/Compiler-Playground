import { create } from 'zustand'

interface Ll1StoreState {
  stepIndex: number
  autoPlay: boolean
  setStepIndex: (i: number) => void
  next: (max: number) => void
  prev: () => void
  reset: () => void
  setAutoPlay: (v: boolean) => void
}

export const useLl1Store = create<Ll1StoreState>((set) => ({
  stepIndex: 0,
  autoPlay: false,
  setStepIndex: (i) => set({ stepIndex: i }),
  next: (max) => set((s) => ({ stepIndex: Math.min(s.stepIndex + 1, max) })),
  prev: () => set((s) => ({ stepIndex: Math.max(s.stepIndex - 1, 0) })),
  reset: () => set({ stepIndex: 0, autoPlay: false }),
  setAutoPlay: (v) => set({ autoPlay: v }),
}))
