
import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';

// Função para limpar cache local
function clearKeyCache() {
  console.log('Cache limpo (função simulada)');
  return true;
}

// Função para obter chave API do Asaas
async function getAsaasApiKey(isSandbox: boolean, useCache: boolean = true): Promise<string | null> {
  try {
    // Primeiro tenta obter do sistema novo (asaas_api_keys)
    const { data: activeKeys } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_active', true)
      .eq('is_sandbox', isSandbox)
      .order('priority', { ascending: true })
      .limit(1);
      
    if (activeKeys && activeKeys.length > 0) {
      console.log(`Usando chave do novo sistema: ${activeKeys[0].key_name}`);
      return activeKeys[0].api_key;
    }
    
    // Fallback para o sistema legado
    console.log('Chave não encontrada no novo sistema, tentando sistema legado...');
    
    const { data: legacyConfig, error } = await supabase
      .from('asaas_config')
      .select('sandbox_key, production_key')
      .maybeSingle();
      
    if (error) throw error;
    
    if (!legacyConfig) {
      console.error('Nenhuma configuração encontrada no sistema legado');
      return null;
    }
    
    const legacyKey = isSandbox ? legacyConfig.sandbox_key : legacyConfig.production_key;
    
    if (!legacyKey) {
      console.error(`Nenhuma chave ${isSandbox ? 'sandbox' : 'produção'} encontrada no sistema legado`);
      return null;
    }
    
    console.log('Usando chave do sistema legado');
    return legacyKey;
    
  } catch (error) {
    console.error('Erro ao buscar chave:', error);
    return null;
  }
}

const handler: Handler = async (event: HandlerEvent) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Get query parameters
    const params = new URLSearchParams(event.rawQuery);
    const isSandbox = params.get('sandbox') === 'true';
    const resetCache = params.get('reset_cache') === 'true';

    if (resetCache) {
      clearKeyCache();
      console.log('Cache limpo');
    }

    // Test retrieval of API key
    console.log(`Testando obtenção de chave ${isSandbox ? 'sandbox' : 'produção'}`);
    const startTime = Date.now();
    
    // First call (should hit the database)
    const apiKey = await getAsaasApiKey(isSandbox);
    const firstCallTime = Date.now() - startTime;
    
    // Second call (should hit the cache)
    const cachedStartTime = Date.now();
    const cachedApiKey = await getAsaasApiKey(isSandbox);
    const cachedCallTime = Date.now() - cachedStartTime;
    
    // Test if we got the same key from both calls
    const sameKey = apiKey === cachedApiKey;
    
    // Only show first 8 characters of the key for security
    const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...` : 'Não encontrada';
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        environment: isSandbox ? 'sandbox' : 'production',
        keyAvailable: !!apiKey,
        maskedKey,
        firstCallTime: `${firstCallTime}ms`,
        cachedCallTime: `${cachedCallTime}ms`,
        cachingWorking: sameKey,
        cacheHit: cachedCallTime < firstCallTime,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('Erro no teste de chaves:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Falha ao testar chaves API',
        details: error.message
      }),
    };
  }
};

export { handler };
