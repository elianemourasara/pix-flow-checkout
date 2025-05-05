
/**
 * Utility function to prepare API key for use
 */
export function prepareApiKey(apiKey: string): string {
  // Trim and clean any whitespace or special chars but preserve $ prefix
  let cleanKey = apiKey?.trim().replace(/[\s\u200B\u200C\u200D\uFEFF\n\r\t]/g, '') || '';
  
  // Log the original key format for debugging
  console.log(`[prepareApiKey] Key starts with $: ${cleanKey.startsWith('$')}`);
  console.log(`[prepareApiKey] Key starts with aact_: ${cleanKey.startsWith('aact_')}`);
  console.log(`[prepareApiKey] Original key length: ${cleanKey.length}`);
  
  // IMPORTANTE: Preservar o prefixo $ na chave
  // NÃO remover o prefixo $ como era feito anteriormente
  console.log('[prepareApiKey] CORREÇÃO: Preservando o prefixo $ da chave conforme exigido pelo Asaas');
  
  // Log only first few characters for security
  console.log(`[prepareApiKey] Final key format (first 5): ${cleanKey.substring(0, 5)}...`);
  console.log(`[prepareApiKey] Final key length: ${cleanKey.length}`);
  return cleanKey;
}

/**
 * Analyze if a key appears to be valid 
 */
export function isKeyValid(apiKey: string): boolean {
  // Verificar se começa com $aact_
  const hasCorrectPrefix = apiKey?.startsWith('$aact_');
  console.log(`[isKeyValid] Checking key validity: length=${apiKey?.length || 0}, has correct prefix=$aact_: ${hasCorrectPrefix}`);
  
  if (!hasCorrectPrefix) {
    console.warn('[isKeyValid] ATENÇÃO: A chave API não começa com $aact_, isso pode causar falha de autenticação!');
  }
  
  return !!apiKey && apiKey.length > 10;
}
