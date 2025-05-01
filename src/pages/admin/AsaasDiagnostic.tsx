
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AccessDeniedCard from './components/AccessDeniedCard';

interface DiagnosticResult {
  environment?: {
    useProduction: boolean;
    isSandbox: boolean;
    useProductionEnvRaw: string;
    apiBaseUrl: string;
  };
  dependencyDiagnostics?: {
    fetchAvailable: boolean;
    httpsAvailable: boolean;
    agentWorks: boolean;
    corsHeadersWork: boolean;
    environmentVariables: Record<string, string | undefined>;
  };
  keyAnalysis?: {
    valid: boolean;
    format: string;
    length: number;
    firstEight: string;
    lastFour: string;
    startsWithAact: boolean;
    hasPrefixDollar: boolean;
    containsInvisibleChars: boolean;
    containsQuotes: boolean;
  };
  diagnosticResults?: {
    summary: {
      allFailed: boolean;
      anySuccess: boolean;
      recommendedAction: string;
      possibleIssues: string[];
    };
    testResults: Record<string, {
      success: boolean;
      statusCode?: number;
      error?: string;
      headers?: Record<string, string>;
      responsePreview?: string;
    }>;
  };
  databaseInfo?: {
    apiKeys: {
      count: number;
      activeCount: number;
      productionCount: number;
      sandboxCount: number;
      preview: Array<{
        id: number;
        name: string;
        active: boolean;
        sandbox: boolean;
        priority: number;
      }>;
    } | null;
    apiKeysError: string | null;
    asaasConfig: any | null;
    configError: string | null;
  };
  error?: string;
  message?: string;
}

const AsaasDiagnostic = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const { toast } = useToast();

  // Verificação de permissão de administrador
  if (!isAdmin) {
    return (
      <AccessDeniedCard 
        title="Diagnóstico do Asaas" 
        description="Você não tem permissão para acessar esta página." 
      />
    );
  }

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/asaas-diagnostic', {
        method: 'GET',
      });
      
      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Diagnóstico concluído",
        description: data.diagnosticResults?.summary?.anySuccess 
          ? "Alguns testes foram bem-sucedidos!" 
          : "Todos os testes falharam. Verifique os detalhes.",
        variant: data.diagnosticResults?.summary?.anySuccess ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      toast({
        title: "Erro no diagnóstico",
        description: "Não foi possível executar o diagnóstico. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderEnvironmentInfo = () => {
    if (!result?.environment) return null;
    
    const { useProduction, isSandbox, useProductionEnvRaw, apiBaseUrl } = result.environment;
    
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Informações do Ambiente</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Ambiente:</div>
          <div>{useProduction ? 'PRODUÇÃO' : 'SANDBOX'}</div>
          
          <div className="font-medium">Valor de USE_ASAAS_PRODUCTION:</div>
          <div>{useProductionEnvRaw || 'não definido'}</div>
          
          <div className="font-medium">URL da API:</div>
          <div>{apiBaseUrl}</div>
        </div>
      </div>
    );
  };

  const renderDependencyInfo = () => {
    if (!result?.dependencyDiagnostics) return null;
    
    const { 
      fetchAvailable, 
      httpsAvailable, 
      agentWorks, 
      corsHeadersWork,
      environmentVariables
    } = result.dependencyDiagnostics;
    
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Diagnóstico de Dependências</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            {fetchAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>Fetch API disponível</span>
          </div>
          
          <div className="flex items-center">
            {httpsAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>HTTPS disponível</span>
          </div>
          
          <div className="flex items-center">
            {agentWorks ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>HTTPS Agent funciona</span>
          </div>
          
          <div className="flex items-center">
            {corsHeadersWork ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>Headers CORS funcionam</span>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium">Variáveis de Ambiente:</h4>
          <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
            <pre>
              {JSON.stringify(environmentVariables, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const renderKeyAnalysis = () => {
    if (!result?.keyAnalysis) return null;
    
    const { 
      valid, 
      format, 
      length,
      firstEight,
      lastFour,
      startsWithAact,
      hasPrefixDollar,
      containsInvisibleChars,
      containsQuotes
    } = result.keyAnalysis;
    
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Análise da Chave API</h3>
        <div className="p-4 rounded-md border border-gray-200 bg-gray-50">
          <div className="flex items-center mb-4">
            {valid ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500 mr-2" />
            )}
            <span className="text-lg font-medium">
              {valid ? 'Chave com formato válido' : 'Problemas no formato da chave'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Chave (parcial):</div>
            <div>{firstEight}...{lastFour}</div>
            
            <div className="font-medium">Formato:</div>
            <div>{format}</div>
            
            <div className="font-medium">Comprimento:</div>
            <div>{length} caracteres</div>
            
            <div className="font-medium">Inicia com $aact_:</div>
            <div className="flex items-center">
              {hasPrefixDollar ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
              )}
              {hasPrefixDollar ? 'Sim' : 'Não'}
            </div>
            
            <div className="font-medium">Inicia com aact_:</div>
            <div className="flex items-center">
              {startsWithAact ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
              )}
              {startsWithAact ? 'Sim' : 'Não'}
            </div>
            
            <div className="font-medium">Contém caracteres invisíveis:</div>
            <div className="flex items-center">
              {containsInvisibleChars ? (
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              )}
              {containsInvisibleChars ? 'Sim (problema)' : 'Não'}
            </div>
            
            <div className="font-medium">Contém aspas:</div>
            <div className="flex items-center">
              {containsQuotes ? (
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              )}
              {containsQuotes ? 'Sim (problema)' : 'Não'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTestResults = () => {
    if (!result?.diagnosticResults) return null;
    
    const { summary, testResults } = result.diagnosticResults;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resultados dos Testes</h3>
        
        <div className={`p-4 rounded-md ${summary.anySuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center mb-2">
            {summary.anySuccess ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className="font-medium">
              {summary.anySuccess ? 'Pelo menos um teste bem-sucedido' : 'Todos os testes falharam'}
            </span>
          </div>
          
          <div className="mt-2">
            <h4 className="font-medium">Ação recomendada:</h4>
            <p className="text-sm mt-1">{summary.recommendedAction}</p>
          </div>
          
          {summary.possibleIssues.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium">Possíveis problemas:</h4>
              <ul className="list-disc list-inside text-sm mt-1">
                {summary.possibleIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Detalhes dos testes:</h4>
          {Object.entries(testResults).map(([testName, test]) => (
            <div 
              key={testName}
              className={`p-3 rounded-md border ${test.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {test.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="font-medium">{testName}</span>
                </div>
                <span className={`text-sm ${test.statusCode === 200 ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {test.statusCode || 'N/A'}
                </span>
              </div>
              
              {test.error && (
                <div className="mt-2 text-sm text-red-600">
                  Erro: {test.error}
                </div>
              )}
              
              {test.responsePreview && (
                <div className="mt-2">
                  <details>
                    <summary className="text-xs cursor-pointer">Ver resposta (parcial)</summary>
                    <pre className="text-xs mt-1 p-1 bg-gray-100 rounded overflow-x-auto">
                      {test.responsePreview}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDatabaseInfo = () => {
    if (!result?.databaseInfo) return null;
    
    const { apiKeys, apiKeysError, asaasConfig, configError } = result.databaseInfo;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações do Banco de Dados</h3>
        
        <div>
          <h4 className="font-medium">Chaves API:</h4>
          {apiKeysError ? (
            <div className="text-red-600 text-sm mt-1">{apiKeysError}</div>
          ) : apiKeys ? (
            <div className="mt-2">
              <div className="text-sm mb-2">
                Total: {apiKeys.count} | 
                Ativas: {apiKeys.activeCount} | 
                Produção: {apiKeys.productionCount} | 
                Sandbox: {apiKeys.sandboxCount}
              </div>
              
              {apiKeys.preview.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">ID</th>
                        <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Nome</th>
                        <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                        <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Ambiente</th>
                        <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Prioridade</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {apiKeys.preview.map(key => (
                        <tr key={key.id}>
                          <td className="px-3 py-2 whitespace-nowrap">{key.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{key.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${key.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {key.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${key.sandbox ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                              {key.sandbox ? 'Sandbox' : 'Produção'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{key.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma chave encontrada.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma informação disponível.</p>
          )}
        </div>
        
        <div>
          <h4 className="font-medium">Configuração do Asaas:</h4>
          {configError ? (
            <div className="text-red-600 text-sm mt-1">{configError}</div>
          ) : asaasConfig ? (
            <div className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              <pre>{JSON.stringify(asaasConfig, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma configuração encontrada.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diagnóstico do Asaas</h1>
          <p className="text-muted-foreground">
            Ferramentas para diagnóstico da integração com a API do Asaas
          </p>
        </div>
        
        <Button 
          onClick={runDiagnostic} 
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            'Executar Diagnóstico'
          )}
        </Button>
      </div>
      
      {isLoading ? (
        <Card className="p-8 flex justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg">Executando diagnósticos completos...</p>
            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
          </div>
        </Card>
      ) : result ? (
        <div className="space-y-6">
          {result.error ? (
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-red-800">Erro no diagnóstico</h3>
                  <p className="mt-1">{result.error}</p>
                  {result.message && <p className="text-sm mt-2">{result.message}</p>}
                </div>
              </div>
            </Card>
          ) : (
            <>
              {renderEnvironmentInfo()}
              {renderDependencyInfo()}
              {renderKeyAnalysis()}
              {renderTestResults()}
              {renderDatabaseInfo()}
            </>
          )}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Clique no botão "Executar Diagnóstico" para analisar a integração com a API do Asaas.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AsaasDiagnostic;
