
/**
 * Configurações para a integração com o Asaas
 */

/**
 * Enum para identificar o ambiente do Asaas
 */
export enum AsaasEnvironment {
  PRODUCTION = 'production',
  SANDBOX = 'sandbox'
}

/**
 * URLs base da API do Asaas
 */
export const ASAAS_API_URLS = {
  [AsaasEnvironment.PRODUCTION]: 'https://api.asaas.com/api/v3',
  [AsaasEnvironment.SANDBOX]: 'https://sandbox.asaas.com/api/v3'
};

/**
 * Retorna a URL base da API Asaas para o ambiente especificado
 */
export function getApiBaseUrl(environment: AsaasEnvironment): string {
  return ASAAS_API_URLS[environment];
}
