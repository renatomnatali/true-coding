import { create } from 'zustand'
import type { BusinessPlan } from '@/types'

export type WizardStep = 'initial' | 'chat' | 'review' | 'confirm'

interface WizardState {
  currentStep: WizardStep
  projectId: string | null
  businessPlan: BusinessPlan | null
  isLoading: boolean

  setStep: (step: WizardStep) => void
  setProjectId: (id: string) => void
  setBusinessPlan: (plan: BusinessPlan) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 'initial',
  projectId: null,
  businessPlan: null,
  isLoading: false,

  setStep: (step) => set({ currentStep: step }),
  setProjectId: (id) => set({ projectId: id }),
  setBusinessPlan: (plan) => set({ businessPlan: plan, currentStep: 'review' }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () =>
    set({
      currentStep: 'initial',
      projectId: null,
      businessPlan: null,
      isLoading: false,
    }),
}))
