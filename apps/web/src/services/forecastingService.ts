import { ForecastingReport } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const forecastingService = {
  async getForecastingReport(tenantId: string): Promise<ForecastingReport> {
    return mockStore.getForecastingReport(tenantId);
  }
};
