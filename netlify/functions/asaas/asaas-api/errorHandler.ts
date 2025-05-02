
import { AsaasApiError } from '../types';

export async function handleApiError(response: Response, operation: string) {
  let errorText;
  try {
    errorText = await response.text();
    console.log(`Texto de erro completo para ${operation}:`, errorText);
  } catch (e) {
    errorText = `Não foi possível obter texto de erro: ${e.message}`;
  }

  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch (e) {
    errorData = { message: errorText };
  }

  console.error(`Erro ao ${operation}:`, {
    status: response.status,
    statusText: response.statusText,
    errorData: errorData
  });

  if (errorData && errorData.errors) {
    console.error('Detalhes específicos dos erros:', errorData.errors);
  }

  return errorData;
}
