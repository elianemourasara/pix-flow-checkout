
/**
 * Função para obter a URL base da API Asaas
 * FORÇADO PARA PRODUÇÃO - Não respeita mais a variável USE_ASAAS_PRODUCTION
 */
export function getAsaasApiBaseUrl(isSandboxParam?: boolean): string {
  // FORÇAR PRODUÇÃO: Ignorar todos os parâmetros e variáveis de ambiente
  const isSandbox = false;
  
  // URLs corretas da API - verificadas na documentação oficial
  const sandboxUrl = 'https://sandbox.asaas.com/api/v3';
  const productionUrl = 'https://api.asaas.com/api/v3';
  
  const url = productionUrl; // Sempre retorna URL de produção
  
  console.log(`[getAsaasApiBaseUrl] MODO FORÇADO: PRODUÇÃO`);
  console.log(`[getAsaasApiBaseUrl] URL da API selecionada: ${url}`);
  console.log(`[getAsaasApiBaseUrl] Valor ignorado de USE_ASAAS_PRODUCTION: ${process.env.USE_ASAAS_PRODUCTION}`);
  
  return url;
}
