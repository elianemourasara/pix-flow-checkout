
/**
 * Função para obter a URL base da API Asaas
 * Respeita a variável de ambiente USE_ASAAS_PRODUCTION
 */
export function getAsaasApiBaseUrl(isSandboxParam?: boolean): string {
  // A variável de ambiente tem precedência sobre o parâmetro
  const useProductionEnv = process.env.USE_ASAAS_PRODUCTION === 'true';
  const isSandbox = useProductionEnv ? false : (isSandboxParam !== undefined ? isSandboxParam : true);
  
  // URLs corretas da API
  const sandboxUrl = 'https://sandbox.asaas.com/api/v3';
  const productionUrl = 'https://api.asaas.com/api/v3';
  
  const url = isSandbox ? sandboxUrl : productionUrl;
  
  console.log(`[getAsaasApiBaseUrl] USE_ASAAS_PRODUCTION=${useProductionEnv ? 'true' : 'false'}`);
  console.log(`[getAsaasApiBaseUrl] Ambiente selecionado: ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
  console.log(`[getAsaasApiBaseUrl] URL da API selecionada: ${url}`);
  
  return url;
}
