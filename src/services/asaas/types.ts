
/**
 * Tipos para o gerenciamento de chaves de API do Asaas
 */

/**
 * Estrutura de uma chave API do Asaas
 */
export interface AsaasApiKey {
  id: number;
  key_name: string;
  api_key: string;
  is_active: boolean;
  is_sandbox: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

/**
 * Ambiente da API Asaas
 */
export enum AsaasEnvironment {
  PRODUCTION = 'production',
  SANDBOX = 'sandbox'
}

/**
 * Resultado de testes de API
 */
export interface ApiTestResult {
  success: boolean;
  status?: number;
  message?: string;
  error?: string;
  data?: any;
}
