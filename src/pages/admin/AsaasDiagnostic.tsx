
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AccessDeniedCard from './components/AccessDeniedCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    netlifyInfo?: Record<string, string | undefined>;
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
    recommendedAction?: string;
  };
  minimalHttpTest?: {
    success: boolean;
    status?: number;
    error?: string;
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
    recentWebhooks?: Array<{
      id: string;
      paymentId: string;
      status: string;
      eventType: string;
      created_at: string;
    }> | null;
    webhooksError?: string | null;
    recentPayments?: Array<{
      id: string;
      paymentId: string;
      status: string;
      created_at: string;
      amount: number;
    }> | null;
    paymentsError?: string | null;
  };
  error?: string;
  message?: string;
}

const AsaasDiagnostic = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');

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
      
      // Definir a guia ativa com base nos resultados do diagnóstico
      if (data.keyAnalysis && !data.keyAnalysis.valid) {
        setActiveTab('key');
      } else if (data.diagnosticResults?.summary?.allFailed) {
        setActiveTab('tests');
      } else {
        setActiveTab('summary');
      }
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
      environmentVariables,
      netlifyInfo
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
        
        {netlifyInfo && (
          <div className="mt-4">
            <h4 className="text-sm font-medium">Informações do Netlify:</h4>
            <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
              <pre>
                {JSON.stringify(netlifyInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
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
      containsQuotes,
      recommendedAction
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
          
          {recommendedAction && !valid && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <span className="font-medium">Ação Recomendada:</span>
                <p className="text-sm mt-1">{recommendedAction}</p>
              </div>
            </div>
          )}
          
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
          
          {result.minimalHttpTest && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium mb-2">Teste HTTP Básico:</h4>
              <div className={`flex items-center p-2 rounded ${result.minimalHttpTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                {result.minimalHttpTest.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span>
                  {result.minimalHttpTest.success 
                    ? 'Teste HTTP básico com sucesso' 
                    : `Falha no teste HTTP básico: ${result.minimalHttpTest.status || result.minimalHttpTest.error || 'Erro desconhecido'}`}
                </span>
              </div>
            </div>
          )}
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
              
              {test.headers && Object.keys(test.headers).length > 0 && (
                <div className="mt-2">
                  <details>
                    <summary className="text-xs cursor-pointer">Ver headers da resposta</summary>
                    <pre className="text-xs mt-1 p-1 bg-gray-100 rounded overflow-x-auto max-h-40">
                      {JSON.stringify(test.headers, null, 2)}
                    </pre>
                  </details>
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
    
    const { 
      apiKeys, 
      apiKeysError, 
      asaasConfig, 
      configError,
      recentWebhooks,
      webhooksError,
      recentPayments,
      paymentsError
    } = result.databaseInfo;
    
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
        
        {recentWebhooks && (
          <div>
            <h4 className="font-medium">Webhooks Recentes:</h4>
            {webhooksError ? (
              <div className="text-red-600 text-sm mt-1">{webhooksError}</div>
            ) : recentWebhooks.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">ID Pagamento</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Tipo de Evento</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentWebhooks.map(webhook => (
                      <tr key={webhook.id}>
                        <td className="px-3 py-2 whitespace-nowrap">{webhook.paymentId}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                            ${webhook.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                              webhook.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                              webhook.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {webhook.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{webhook.eventType}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(webhook.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Nenhum webhook recente.</p>
            )}
          </div>
        )}
        
        {recentPayments && (
          <div>
            <h4 className="font-medium">Pagamentos Recentes:</h4>
            {paymentsError ? (
              <div className="text-red-600 text-sm mt-1">{paymentsError}</div>
            ) : recentPayments.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">ID Pagamento</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Valor</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentPayments.map(payment => (
                      <tr key={payment.id}>
                        <td className="px-3 py-2 whitespace-nowrap">{payment.paymentId}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                            ${payment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                              payment.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">R$ {Number(payment.amount).toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(payment.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Nenhum pagamento recente.</p>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const renderTroubleshootingGuide = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Guia de Resolução</h3>
        
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
          <h4 className="font-medium flex items-center text-blue-800">
            <Info className="h-5 w-5 mr-2" />
            Como resolver problemas de autenticação 401
          </h4>
          
          <div className="mt-3 space-y-4">
            <div>
              <h5 className="font-medium text-sm">1. Verificar a chave API</h5>
              <ul className="mt-1 list-disc list-inside text-sm pl-2">
                <li>Confirme que está usando a chave de produção (não sandbox) para ambiente de produção</li>
                <li>Verifique se a chave está no formato correto começando com <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">$aact_</code></li>
                <li>Gere uma nova chave no painel do Asaas e atualize no Supabase</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-sm">2. Verificar permissões da chave</h5>
              <ul className="mt-1 list-disc list-inside text-sm pl-2">
                <li>Entre no painel do Asaas e confirme que a chave tem permissões para <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">customers</code> e <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">payments</code></li>
                <li>Verifique se a chave não foi revogada</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-sm">3. Problemas de formato</h5>
              <ul className="mt-1 list-disc list-inside text-sm pl-2">
                <li>Remova qualquer caractere invisível, quebra de linha ou espaço na chave</li>
                <li>Remova aspas ou outros caracteres especiais da chave</li>
                <li>Use a função <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">sanitizeApiKey()</code> para limpar a chave</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-sm">4. Problemas de rede</h5>
              <ul className="mt-1 list-disc list-inside text-sm pl-2">
                <li>Verifique se o IP do servidor Netlify não está bloqueado pelo Asaas</li>
                <li>Teste com diferentes User-Agents se o padrão estiver sendo bloqueado</li>
                <li>Verifique se não há proxies ou firewalls interferindo na requisição</li>
              </ul>
            </div>
            
            <div className="pt-2 border-t border-blue-200">
              <p className="text-sm font-medium">Próximos passos recomendados:</p>
              <ol className="mt-1 list-decimal list-inside text-sm pl-2">
                <li>Execute um diagnóstico completo</li>
                <li>Gere uma nova chave de API no painel do Asaas</li>
                <li>Atualize a chave na tabela <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">asaas_api_keys</code></li>
                <li>Teste novamente com a função de diagnóstico</li>
              </ol>
            </div>
          </div>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="key">Chave API</TabsTrigger>
                <TabsTrigger value="tests">Testes</TabsTrigger>
                <TabsTrigger value="database">Banco de Dados</TabsTrigger>
                <TabsTrigger value="guide">Resolução</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4 bg-white p-4 rounded-md border">
                {renderEnvironmentInfo()}
                {renderDependencyInfo()}
                
                {result.diagnosticResults?.summary && (
                  <div className={`p-4 mt-4 rounded-md ${result.diagnosticResults.summary.anySuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      {result.diagnosticResults.summary.anySuccess ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      Resultado do diagnóstico
                    </h3>
                    
                    <p><strong>Status:</strong> {result.diagnosticResults.summary.anySuccess ? 'Alguns testes com sucesso' : 'Todos os testes falharam'}</p>
                    <p className="mt-2"><strong>Ação recomendada:</strong> {result.diagnosticResults.summary.recommendedAction}</p>
                    
                    {result.keyAnalysis?.recommendedAction && !result.keyAnalysis.valid && (
                      <p className="mt-1 text-red-700">⚠️ {result.keyAnalysis.recommendedAction}</p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="key" className="space-y-4 bg-white p-4 rounded-md border">
                {renderKeyAnalysis()}
              </TabsContent>
              
              <TabsContent value="tests" className="space-y-4 bg-white p-4 rounded-md border">
                {renderTestResults()}
              </TabsContent>
              
              <TabsContent value="database" className="space-y-4 bg-white p-4 rounded-md border">
                {renderDatabaseInfo()}
              </TabsContent>
              
              <TabsContent value="guide" className="space-y-4 bg-white p-4 rounded-md border">
                {renderTroubleshootingGuide()}
              </TabsContent>
            </Tabs>
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
