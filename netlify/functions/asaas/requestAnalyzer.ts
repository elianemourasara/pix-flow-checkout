
import { HandlerEvent } from '@netlify/functions';

interface RequestAnalysis {
  httpMethod: string;
  hasBody: boolean;
  bodySize: number | null;
  hasCorsHeaders: boolean;
  hasJsonContentType: boolean;
  hasAuthHeaders: boolean;
  referrer: string | null;
  userAgent: string | null;
  clientIp: string | null;
}

/**
 * Analisa detalhes da requisição HTTP para diagnóstico
 * @param event Evento do Netlify Function
 * @returns Análise da requisição
 */
export function analyzeApiRequest(event: HandlerEvent): RequestAnalysis {
  const analysis: RequestAnalysis = {
    httpMethod: event.httpMethod,
    hasBody: !!event.body,
    bodySize: event.body ? event.body.length : null,
    hasCorsHeaders: !!event.headers['access-control-request-method'] || 
                   !!event.headers['origin'],
    hasJsonContentType: (event.headers['content-type'] || '').includes('application/json'),
    hasAuthHeaders: !!event.headers['authorization'],
    referrer: event.headers['referer'] || null,
    userAgent: event.headers['user-agent'] || null,
    clientIp: event.headers['client-ip'] || event.headers['x-forwarded-for'] || null
  };

  console.log('[analyzeApiRequest] Análise da requisição:', JSON.stringify(analysis, null, 2));
  
  // Verificar problemas comuns
  if (analysis.httpMethod === 'POST' && !analysis.hasBody) {
    console.warn('[analyzeApiRequest] AVISO: Requisição POST sem corpo');
  }
  
  if (analysis.httpMethod === 'POST' && !analysis.hasJsonContentType) {
    console.warn('[analyzeApiRequest] AVISO: Requisição POST sem Content-Type JSON');
  }
  
  return analysis;
}
