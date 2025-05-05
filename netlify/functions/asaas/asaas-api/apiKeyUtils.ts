
/**
 * Utility function to prepare API key for use
 */
export function prepareApiKey(apiKey: string): string {
  // Trim and clean any whitespace or special chars
  let cleanKey = apiKey?.trim().replace(/\s/g, '') || '';
  
  // Log the original key format for debugging
  console.log(`[prepareApiKey] Key starts with $: ${cleanKey.startsWith('$')}`);
  console.log(`[prepareApiKey] Key starts with aact_: ${cleanKey.startsWith('aact_')}`);
  console.log(`[prepareApiKey] Original key length: ${cleanKey.length}`);
  
  // IMPORTANTE: Aceitamos qualquer formato de chave neste momento
  // Uma vez que estamos em troubleshooting, não queremos limitar formatos
  
  // Se o usuário solicitou para remover o prefixo $, fazemos isso
  if (cleanKey.startsWith('$')) {
    console.log('[prepareApiKey] Removendo prefixo $ da chave para garantir compatibilidade');
    cleanKey = cleanKey.substring(1);
  }
  
  console.log(`[prepareApiKey] Final key format (first 5): ${cleanKey.substring(0, 5)}...`);
  console.log(`[prepareApiKey] Final key length: ${cleanKey.length}`);
  return cleanKey;
}

/**
 * Analyze if a key appears to be valid 
 */
export function isKeyValid(apiKey: string): boolean {
  // Em modo troubleshooting, aceitamos qualquer chave que não esteja vazia
  console.log(`[isKeyValid] Checking key validity: length=${apiKey?.length || 0}`);
  return !!apiKey && apiKey.length > 10;
}
