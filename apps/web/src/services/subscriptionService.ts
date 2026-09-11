import { Plan, Module } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const subscriptionService = {
  async getPlans(): Promise<Plan[]> {
    return mockStore.getPlans();
  },

  async getModules(): Promise<Module[]> {
    return mockStore.getModules();
  }
};
