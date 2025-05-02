
/**
 * Sanitiza a chave API para garantir que não contenha caracteres problemáticos
 * @param apiKey Chave API a ser sanitizada
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  console.log(`[sanitizeApiKey] Sanitizando chave API (tamanho original: ${apiKey.length})`);
  
  // Converter para string caso não seja
  let sanitized = String(apiKey);
  
  // Remove espaços no início e fim
  let previousLength = sanitized.length;
  sanitized = sanitized.trim();
  if (previousLength !== sanitized.length) {
    console.warn(`[sanitizeApiKey] ALERTA: Espaços no início/fim removidos. Antes: ${previousLength}, Depois: ${sanitized.length}`);
  }
  
  // Remove quebras de linha ou tabs que podem ter sido acidentalmente copiados
  previousLength = sanitized.length;
  sanitized = sanitized.replace(/[\n\r\t]/g, '');
  if (previousLength !== sanitized.length) {
    console.warn(`[sanitizeApiKey] ALERTA: Quebras de linha/tabs removidos. Antes: ${previousLength}, Depois: ${sanitized.length}`);
  }
  
  // Verifica caracteres Unicode que não são visíveis mas poderiam estar presentes
  previousLength = sanitized.length;
  const invisibleChars = /[\u200B-\u200D\uFEFF]/g;
  if (invisibleChars.test(sanitized)) {
    console.warn('[sanitizeApiKey] ALERTA: Caracteres unicode invisíveis detectados e removidos');
    sanitized = sanitized.replace(invisibleChars, '');
    console.warn(`[sanitizeApiKey] Após remoção de caracteres invisíveis: Antes: ${previousLength}, Depois: ${sanitized.length}`);
  }
  
  // Verificar formato básico da chave Asaas (começa com $aact_)
  if (!sanitized.startsWith('$aact_')) {
    console.error('[sanitizeApiKey] ERRO CRÍTICO: A chave API não segue o formato padrão $aact_*');
  }
  
  console.log(`[sanitizeApiKey] Chave sanitizada (tamanho final: ${sanitized.length})`);
  return sanitized;
}

/**
 * Verifica se o Authorization header está formatado corretamente
 * @param apiKey Chave API sanitizada
 */
export function validateAuthHeader(apiKey: string): string {
  console.log('[validateAuthHeader] Validando formato do header de autorização');
  
  // Verificar se a chave API foi fornecida
  if (!apiKey) {
    console.error('[validateAuthHeader] ERRO CRÍTICO: Chave API vazia');
    throw new Error('Chave API não fornecida');
  }
  
  // Verificar o formato da chave
  if (!apiKey.startsWith('$aact_')) {
    console.error('[validateAuthHeader] ERRO CRÍTICO: Formato da chave API inválido - não começa com $aact_');
  }
  
  const authHeader = `Bearer ${apiKey}`;
  
  // Verificar se o header tem um comprimento razoável
  if (authHeader.length < 20) {
    console.error('[validateAuthHeader] ERRO: Authorization header muito curto:', authHeader.length);
    throw new Error('Authorization header inválido - muito curto');
  }
  
  // Verifica se o formato do header está correto
  if (!authHeader.startsWith('Bearer ') || apiKey.length < 10) {
    console.error('[validateAuthHeader] ERRO: Authorization header mal formatado');
    throw new Error('Authorization header inválido - formato incorreto');
  }
  
  console.log(`[validateAuthHeader] Header válido: Bearer ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`[validateAuthHeader] Comprimento total do header: ${authHeader.length}`);
  
  return authHeader;
}

/**
 * Testa uma chave API diretamente antes de tentar usá-la
 * @param apiKey Chave API já sanitizada
 * @param apiUrl URL base da API
 */
export async function testApiKeyEndpoint(apiKey: string, apiUrl: string): Promise<boolean> {
  const testEndpoint = `${apiUrl}/status`;
  console.log(`[testApiKeyEndpoint] Testando chave API no endpoint: ${testEndpoint}`);
  console.log(`[testApiKeyEndpoint] Primeiros 8 caracteres da chave: ${apiKey.substring(0, 8)}...`);
  console.log(`[testApiKeyEndpoint] Ambiente: ${apiUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUÇÃO'}`);
  
  try {
    const authHeader = validateAuthHeader(apiKey);
    
    // Use require for node-fetch to ensure compatibility with Netlify Functions
    const fetch = require('node-fetch');
    
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'Mozilla/5.0 Lovable/Netlify',
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`[testApiKeyEndpoint] Status da resposta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('[testApiKeyEndpoint] Chave API VÁLIDA!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('[testApiKeyEndpoint] Erro no teste da chave API:', errorText);
      console.error('[testApiKeyEndpoint] Status HTTP:', response.status);
      
      // Diagnóstico específico para erro 401
      if (response.status === 401) {
        console.error('[testApiKeyEndpoint] ERRO DE AUTENTICAÇÃO (401)');
        console.error('[testApiKeyEndpoint] Verifique:');
        console.error('  1. Se a chave está correta e sem caracteres extras');
        console.error(`  2. Se o ambiente está correto (usando ${apiUrl.includes('sandbox') ? 'sandbox' : 'produção'})`);
        console.error('  3. Se a variável de ambiente USE_ASAAS_PRODUCTION está configurada corretamente');
        console.error('  4. Valor da variável USE_ASAAS_PRODUCTION:', process.env.USE_ASAAS_PRODUCTION);
      }
      
      return false;
    }
  } catch (error) {
    console.error('[testApiKeyEndpoint] Exceção no teste da chave API:', error);
    return false;
  }
}
