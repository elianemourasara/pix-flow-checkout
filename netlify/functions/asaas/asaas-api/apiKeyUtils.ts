
/**
 * Utility function to prepare API key for use
 */
export function prepareApiKey(apiKey: string): string {
  // Trim and clean any whitespace or special chars
  let cleanKey = apiKey?.trim().replace(/\s/g, '') || '';
  
  // Log the original key format for debugging
  console.log(`[prepareApiKey] Key starts with $: ${cleanKey.startsWith('$')}`);
  
  // NOTE: We're now accepting keys with or without the $ prefix
  // This is normally how we'd standardize, but current issue shows this is causing problems
  // if (!cleanKey.startsWith('$') && cleanKey.startsWith('aact_')) {
  //   cleanKey = '$' + cleanKey;
  // }
  
  // Instead we'll ensure $ prefix is REMOVED if it exists since our test shows this works
  if (cleanKey.startsWith('$')) {
    console.log('[prepareApiKey] Removendo prefixo $ da chave para garantir compatibilidade');
    cleanKey = cleanKey.substring(1);
  }
  
  console.log(`[prepareApiKey] Final key format (first 5): ${cleanKey.substring(0, 5)}...`);
  return cleanKey;
}

/**
 * Analyze if a key appears to be valid 
 */
export function isKeyValid(apiKey: string): boolean {
  // Relaxed validation - just check it's not empty and has reasonable length
  return !!apiKey && apiKey.length > 30;
}
