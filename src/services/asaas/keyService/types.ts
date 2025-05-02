
import { AsaasApiKey, AsaasEnvironment, ApiTestResult } from '../types';

export type { AsaasApiKey, AsaasEnvironment, ApiTestResult };

/**
 * Cache structure for key storage
 */
export interface KeyCache {
  sandbox: AsaasApiKey | null;
  production: AsaasApiKey | null;
  legacySandbox: string | null;
  legacyProduction: string | null;
  timestamp: number;
}
