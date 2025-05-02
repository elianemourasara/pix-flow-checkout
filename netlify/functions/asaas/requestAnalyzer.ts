
import { HandlerEvent } from '@netlify/functions';

/**
 * Analisa detalhadamente uma requisição HTTP para diagnóstico
 * @param event Evento da função serverless
 * @returns Objeto com informações de diagnóstico
 */
export function analyzeApiRequest(event: HandlerEvent) {
  const { httpMethod, headers, body, path } = event;
  
  // Analisar headers importantes
  const contentType = headers['content-type'] || headers['Content-Type'] || 'não especificado';
  const userAgent = headers['user-agent'] || headers['User-Agent'] || 'não especificado';
  const origin = headers['origin'] || headers['Origin'] || 'não especificado';
  const referer = headers['referer'] || headers['Referer'] || 'não especificado';
  
  // Verificar tamanho do corpo da requisição
  const bodySize = body ? body.length : 0;
  
  // Determinar se é uma requisição CORS
  const isCorsRequest = !!headers['origin'] || !!headers['Origin'];
  const isPreflight = httpMethod === 'OPTIONS' && isCorsRequest;
  
  // Verificar se há query params
  const hasQueryParams = event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0;
  
  return {
    method: httpMethod,
    path,
    contentType,
    userAgent,
    origin,
    referer,
    bodySize,
    isCorsRequest,
    isPreflight,
    hasQueryParams,
    headers: Object.keys(headers)
  };
}
