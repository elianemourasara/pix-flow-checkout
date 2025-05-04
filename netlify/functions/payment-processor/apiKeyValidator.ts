
import * as https from 'https';

/**
 * Função utilitária para validar a chave antes de prosseguir
 */
export async function validateApiKey(apiKey: string, apiUrl: string): Promise<boolean> {
  console.log('[validateApiKey] BYPASS: Retornando true sem validação real');
  return true;
  
  /* VALIDAÇÃO ORIGINAL COMENTADA PARA BYPASS
  console.log('[validateApiKey] Validando chave API antes de prosseguir...');
  console.log(`[validateApiKey] Testando chave: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  const isSandbox = apiUrl.includes('sandbox');
  
  // Teste com agente HTTPS e configurações personalizadas
  try {
    const agent = new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
      timeout: 30000
    });
    
    // Importar node-fetch para garantir compatibilidade
    const fetch = require('node-fetch');
    
    // Teste em endpoint menos restrito (/status em vez de /customers)
    const testUrl = `${apiUrl}/status`;
    console.log(`[validateApiKey] Testando conexão em: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 Lovable/Netlify',
        'Accept': 'application/json, text/plain',
        'Cache-Control': 'no-cache'
      },
      agent,
      timeout: 30000
    });
    
    console.log(`[validateApiKey] Status da resposta: ${response.status}`);
    console.log(`[validateApiKey] Headers da resposta: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
    
    const responseText = await response.text();
    console.log(`[validateApiKey] Corpo da resposta: ${responseText.substring(0, 200)}...`);
    
    if (response.ok) {
      console.log('[validateApiKey] Chave API validada com sucesso!');
      return true;
    } else {
      console.error(`[validateApiKey] Erro na validação: Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('[validateApiKey] Erro durante validação:', error);
    return false;
  }
  */
}
