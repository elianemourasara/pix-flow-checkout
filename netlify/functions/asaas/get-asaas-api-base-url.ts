export function getAsaasApiBaseUrl(isSandboxParam?: boolean): string {
  const useProductionEnv = process.env.USE_ASAAS_PRODUCTION === 'true';
  const isSandbox = useProductionEnv ? false : (isSandboxParam !== undefined ? isSandboxParam : true);

  const sandboxUrl = 'https://sandbox.asaas.com/api/v3';
  const productionUrl = 'https://api.asaas.com/api/v3';

  const url = isSandbox ? sandboxUrl : productionUrl;
  console.log(`[getAsaasApiBaseUrl] URL da API selecionada: ${url}`);
  
  return url;
}
