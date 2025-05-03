
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { diagnoseApiKey } from '@/services/asaas/keyService/diagnostics'; // Import directly from diagnostics
import { AsaasEnvironment } from '@/config/asaas';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ApiKeyDiagnostic = () => {
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [serverDiagnosticResult, setServerDiagnosticResult] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const isSandbox = environment === 'sandbox';
      
      // Rodar diagnóstico local primeiro
      const localResult = await diagnoseApiKey('', isSandbox); // Vazio porque vai pegar do Supabase
      setDiagnosticResult(localResult);
      
      // Então rodar o diagnóstico completo do servidor
      const response = await fetch('/.netlify/functions/asaas-diagnostic', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao executar diagnóstico: ${response.status}`);
      }
      
      const serverResult = await response.json();
      setServerDiagnosticResult(serverResult);
      
      toast({
        title: 'Diagnóstico concluído',
        description: serverResult?.diagnosticResults?.summary?.message || 'Diagnóstico concluído com sucesso',
        variant: serverResult?.diagnosticResults?.summary?.success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      toast({
        title: 'Erro no diagnóstico',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Diagnóstico da API Asaas</CardTitle>
        <CardDescription>
          Verifique o funcionamento da integração com a API Asaas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="diagnostic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnostic" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <Button
                  variant={environment === 'production' ? 'default' : 'outline'}
                  onClick={() => setEnvironment('production')}
                >
                  Produção
                </Button>
                <Button
                  variant={environment === 'sandbox' ? 'default' : 'outline'}
                  onClick={() => setEnvironment('sandbox')}
                >
                  Sandbox
                </Button>
              </div>
              
              <Button
                onClick={runDiagnostic}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando diagnóstico...
                  </>
                ) : (
                  'Executar diagnóstico completo'
                )}
              </Button>
              
              {diagnosticResult && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      {diagnosticResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      )}
                      Diagnóstico local
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={diagnosticResult.success ? "success" : "destructive"}>
                          {diagnosticResult.success ? 'Sucesso' : 'Falha'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ambiente:</span>
                        <span>
                          {diagnosticResult.data?.diagnostic?.environment === 'produção' 
                            ? 'Produção' 
                            : 'Sandbox'}
                        </span>
                      </div>
                      {diagnosticResult.message && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mensagem:</span>
                          <span className="text-right">{diagnosticResult.message}</span>
                        </div>
                      )}
                      {diagnosticResult.data?.diagnostic && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Formato da chave:</span>
                            <span>
                              {diagnosticResult.data.diagnostic.format === 'válido' 
                                ? 'Válido' 
                                : 'Inválido'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Comprimento:</span>
                            <span>{diagnosticResult.data.diagnostic.length} caracteres</span>
                          </div>
                          {diagnosticResult.data.diagnostic.hasSpaces && (
                            <div className="flex justify-between text-amber-500">
                              <span>Aviso:</span>
                              <span>A chave contém espaços</span>
                            </div>
                          )}
                          {diagnosticResult.data.diagnostic.hasNewlines && (
                            <div className="flex justify-between text-amber-500">
                              <span>Aviso:</span>
                              <span>A chave contém quebras de linha</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {serverDiagnosticResult && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      {serverDiagnosticResult.diagnosticResults?.summary?.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      Diagnóstico do servidor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {serverDiagnosticResult.diagnosticResults?.summary && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Resultado:</span>
                            <Badge variant={serverDiagnosticResult.diagnosticResults.summary.success ? "success" : "destructive"}>
                              {serverDiagnosticResult.diagnosticResults.summary.success ? 'Sucesso' : 'Falha'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ambiente:</span>
                            <span>
                              {serverDiagnosticResult.diagnosticResults.summary.environment}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mensagem:</span>
                            <span className="text-right">{serverDiagnosticResult.diagnosticResults.summary.message}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Formato da chave:</span>
                            <Badge variant={serverDiagnosticResult.diagnosticResults.summary.keyFormat ? "success" : "destructive"}>
                              {serverDiagnosticResult.diagnosticResults.summary.keyFormat ? 'Válido' : 'Inválido'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Conectividade:</span>
                            <Badge variant={serverDiagnosticResult.diagnosticResults.summary.connectivity ? "success" : "destructive"}>
                              {serverDiagnosticResult.diagnosticResults.summary.connectivity ? 'OK' : 'Falha'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Autenticação:</span>
                            <Badge variant={serverDiagnosticResult.diagnosticResults.summary.authentication ? "success" : "destructive"}>
                              {serverDiagnosticResult.diagnosticResults.summary.authentication ? 'OK' : 'Falha'}
                            </Badge>
                          </div>
                        </>
                      )}
                      
                      {serverDiagnosticResult.keyAnalysis && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Análise da chave API</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Primeiros caracteres:</span>
                              <span>{serverDiagnosticResult.keyAnalysis.firstEight}...</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Comprimento:</span>
                              <span>{serverDiagnosticResult.keyAnalysis.length} caracteres</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Formato:</span>
                              <span>{serverDiagnosticResult.keyAnalysis.format}</span>
                            </div>
                            {serverDiagnosticResult.keyAnalysis.containsInvisibleChars && (
                              <div className="flex justify-between text-amber-500">
                                <span>Aviso:</span>
                                <span>Contém caracteres invisíveis</span>
                              </div>
                            )}
                            {serverDiagnosticResult.keyAnalysis.containsQuotes && (
                              <div className="flex justify-between text-amber-500">
                                <span>Aviso:</span>
                                <span>Contém aspas</span>
                              </div>
                            )}
                            {serverDiagnosticResult.keyAnalysis.recommendedAction && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                <span className="font-medium">Ação recomendada:</span> {serverDiagnosticResult.keyAnalysis.recommendedAction}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {serverDiagnosticResult.environment && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Configuração de ambiente</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Variável USE_ASAAS_PRODUCTION:</span>
                              <span>{serverDiagnosticResult.environment.useProductionEnvRaw || 'não definida'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Modo de operação:</span>
                              <span>{serverDiagnosticResult.environment.useProduction ? 'Produção' : 'Sandbox'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">URL base API:</span>
                              <span>{serverDiagnosticResult.environment.apiBaseUrl}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            {serverDiagnosticResult ? (
              <div className="space-y-6">
                {serverDiagnosticResult.diagnosticResults?.testResults && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Resultados dos testes</h3>
                    <div className="space-y-4">
                      {Object.entries(serverDiagnosticResult.diagnosticResults.testResults).map(([key, value]: [string, any]) => (
                        <Card key={key}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-md flex items-center">
                              {value.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                              )}
                              Teste: {key}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={value.success ? "success" : "destructive"}>
                                  {value.success ? 'Sucesso' : 'Falha'}
                                </Badge>
                              </div>
                              {value.statusCode && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Código HTTP:</span>
                                  <span>{value.statusCode}</span>
                                </div>
                              )}
                              {value.responsePreview && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Resposta:</span>
                                  <span className="text-right truncate max-w-[250px]">{value.responsePreview}</span>
                                </div>
                              )}
                              {value.error && (
                                <div className="flex justify-between text-red-500">
                                  <span>Erro:</span>
                                  <span className="text-right">{value.error}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {serverDiagnosticResult.dependencyDiagnostics && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Diagnóstico de dependências</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">node-fetch:</span>
                        <Badge variant={serverDiagnosticResult.dependencyDiagnostics.nodeFetch.available ? "outline" : "destructive"}>
                          {serverDiagnosticResult.dependencyDiagnostics.nodeFetch.available ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HTTPS Agent:</span>
                        <Badge variant={serverDiagnosticResult.dependencyDiagnostics.https.agent ? "outline" : "destructive"}>
                          {serverDiagnosticResult.dependencyDiagnostics.https.agent ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {serverDiagnosticResult.databaseInfo && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Informações do banco de dados</h3>
                    
                    {serverDiagnosticResult.databaseInfo.apiKeys && (
                      <div className="mb-4">
                        <h4 className="font-medium">Chaves API</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total de chaves:</span>
                            <span>{serverDiagnosticResult.databaseInfo.apiKeys.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chaves ativas:</span>
                            <span>{serverDiagnosticResult.databaseInfo.apiKeys.activeCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chaves de produção:</span>
                            <span>{serverDiagnosticResult.databaseInfo.apiKeys.productionCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chaves sandbox:</span>
                            <span>{serverDiagnosticResult.databaseInfo.apiKeys.sandboxCount}</span>
                          </div>
                        </div>
                        
                        {serverDiagnosticResult.databaseInfo.apiKeys.preview.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium">Lista de chaves</h5>
                            <ul className="space-y-2 mt-2">
                              {serverDiagnosticResult.databaseInfo.apiKeys.preview.map((key: any) => (
                                <li key={key.id} className="text-sm p-2 border rounded-md">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium">{key.name}</span>
                                    <Badge variant={key.active ? "default" : "secondary"}>
                                      {key.active ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Ambiente:</span>
                                    <span>{key.sandbox ? 'Sandbox' : 'Produção'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Prioridade:</span>
                                    <span>{key.priority}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {serverDiagnosticResult.databaseInfo.recentWebhooks && (
                      <div className="mt-4">
                        <h4 className="font-medium">Webhooks recentes</h4>
                        {serverDiagnosticResult.databaseInfo.recentWebhooks.length > 0 ? (
                          <ul className="space-y-2 mt-2">
                            {serverDiagnosticResult.databaseInfo.recentWebhooks.map((webhook: any) => (
                              <li key={webhook.id} className="text-sm p-2 border rounded-md">
                                <div className="flex justify-between">
                                  <span className="font-medium">{webhook.eventType}</span>
                                  <Badge>{webhook.status}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(webhook.created_at).toLocaleString()}
                                </div>
                                <div className="text-xs">
                                  ID: {webhook.paymentId}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum webhook registrado</p>
                        )}
                      </div>
                    )}
                    
                    {serverDiagnosticResult.databaseInfo.recentPayments && (
                      <div className="mt-4">
                        <h4 className="font-medium">Pagamentos recentes</h4>
                        {serverDiagnosticResult.databaseInfo.recentPayments.length > 0 ? (
                          <ul className="space-y-2 mt-2">
                            {serverDiagnosticResult.databaseInfo.recentPayments.map((payment: any) => (
                              <li key={payment.id} className="text-sm p-2 border rounded-md">
                                <div className="flex justify-between">
                                  <span className="font-medium">Pagamento {payment.paymentId}</span>
                                  <Badge>{payment.status}</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(payment.created_at).toLocaleString()}
                                  </span>
                                  <span className="text-xs font-medium">
                                    R$ {Number(payment.amount).toFixed(2)}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium">Nenhum resultado disponível</h3>
                <p className="text-muted-foreground mt-2">
                  Execute o diagnóstico primeiro para visualizar os resultados detalhados
                </p>
                <Button onClick={() => runDiagnostic()} className="mt-4">
                  Executar diagnóstico
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiKeyDiagnostic;
