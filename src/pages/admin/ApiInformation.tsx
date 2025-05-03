
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, KeyRound, Code, FileCode, ShieldCheck, Server, Globe, AlertTriangle, CheckCircle2, Network, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ApiInformation = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Informações de API</h1>
        <p className="text-muted-foreground">
          Veja como as APIs estão configuradas em seu projeto.
        </p>
      </div>

      <Tabs defaultValue="netlify">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="supabase">
            <Database className="h-4 w-4 mr-2" />
            Supabase
          </TabsTrigger>
          <TabsTrigger value="asaas">
            <KeyRound className="h-4 w-4 mr-2" />
            Asaas
          </TabsTrigger>
          <TabsTrigger value="netlify">
            <Server className="h-4 w-4 mr-2" />
            Netlify
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supabase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Supabase</CardTitle>
              <CardDescription>
                Como o Supabase está configurado no projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium flex items-center"><Code className="h-4 w-4 mr-2" /> Cliente Supabase</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O cliente Supabase é inicializado em <code>src/integrations/supabase/client.ts</code>
                  </p>
                  <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-2 overflow-auto">
{`// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://onysoawoiffinwewtsex.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2 flex items-center"><FileCode className="h-4 w-4 mr-2" /> Uso no Projeto</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Função/Hook</TableHead>
                        <TableHead>Modo de Uso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/hooks/admin/webhook/useWebhookData.ts</TableCell>
                        <TableCell>useWebhookData</TableCell>
                        <TableCell>Query de pedidos no Supabase</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/services/asaasService.ts</TableCell>
                        <TableCell>generatePixPayment</TableCell>
                        <TableCell>Consulta de configuração Asaas</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/hooks/useCheckoutOrder.ts</TableCell>
                        <TableCell>createOrder</TableCell>
                        <TableCell>Inserção de pedidos e dados de cartão</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/pages/api/webhook-simulator.ts</TableCell>
                        <TableCell>handler</TableCell>
                        <TableCell>Atualização de status de pedidos</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supabase nas Funções Netlify</CardTitle>
              <CardDescription>
                Como o Supabase é utilizado nas funções serverless
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium">Configuração nas Variáveis de Ambiente</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nas funções Netlify, o Supabase precisa ser configurado através de variáveis de ambiente:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li><code>SUPABASE_URL</code> - URL do projeto Supabase</li>
                    <li><code>SUPABASE_SERVICE_KEY</code> - Chave de serviço do Supabase (não a chave anon/pública)</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h3 className="font-medium text-amber-800">⚠️ Atenção</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Sempre verifique se as variáveis de ambiente estão sendo utilizadas corretamente nas funções Netlify. 
                    Utilize validação para garantir que as variáveis estejam definidas antes de usar.
                  </p>
                  <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-2 overflow-auto">
{`// Exemplo de validação em função Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  return {
    statusCode: 500,
    body: JSON.stringify({ 
      error: "Configuração do Supabase ausente" 
    })
  };
}

// Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asaas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Asaas</CardTitle>
              <CardDescription>
                Como o Asaas está configurado no projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium">Gerenciamento de Chaves Asaas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    As chaves da API Asaas agora usam um sistema de gerenciamento mais avançado com:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Múltiplas chaves de produção (até 5) com sistema de prioridade</li>
                    <li>Chaves independentes de sandbox para testes</li>
                    <li>Tabela <code>asaas_api_keys</code> com controle de status ativo/inativo</li>
                    <li>Sistema de diagnóstico para validação de chaves</li>
                    <li>Recuperação automática em caso de falhas (failover)</li>
                  </ul>
                </div>

                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-600" /> Diagnóstico de Integração</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O sistema agora conta com ferramentas de diagnóstico da API Asaas:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Verificação automática de formato e conteúdo das chaves</li>
                    <li>Diagnóstico completo de conectividade e autenticação</li>
                    <li>Testes de permissões das chaves API</li>
                    <li>Monitoramento do status dos webhooks</li>
                    <li>Disponível em <code>/admin/asaas-diagnostics</code></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2 flex items-center"><FileCode className="h-4 w-4 mr-2" /> Uso no Projeto</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Funcionalidade</TableHead>
                        <TableHead>Modo de Uso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/services/asaas/keyService</TableCell>
                        <TableCell>Gerenciamento de chaves</TableCell>
                        <TableCell>Módulo especializado em gerenciar chaves</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/hooks/useAsaasKeyManager.ts</TableCell>
                        <TableCell>Hook de gerenciamento</TableCell>
                        <TableCell>Interface para gerenciar chaves via UI</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/pages/admin/components/ApiKeyManager.tsx</TableCell>
                        <TableCell>Interface de administração</TableCell>
                        <TableCell>Adicionar/remover/ativar chaves</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">src/pages/admin/components/ApiKeyDiagnostic.tsx</TableCell>
                        <TableCell>Diagnóstico</TableCell>
                        <TableCell>Diagnóstico completo da integração</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ambientes Asaas</CardTitle>
              <CardDescription>
                Como os ambientes Sandbox e Produção são gerenciados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium">Sistema de Ambiente</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O sistema gerencia automaticamente a seleção de ambiente:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Ambiente configurado via tabela <code>asaas_config</code></li>
                    <li>Suporte para variável de ambiente <code>USE_ASAAS_PRODUCTION</code></li>
                    <li>Ambiente sandbox com URL: <code>https://sandbox.asaas.com/api/v3</code></li>
                    <li>Ambiente produção com URL: <code>https://api.asaas.com/api/v3</code></li>
                    <li>Diagnóstico automático de configuração de ambiente</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50/50 border border-green-100 rounded-md">
                  <h3 className="font-medium text-green-800">✅ Melhorias de Segurança</h3>
                  <p className="text-sm text-green-700 mt-1">
                    O sistema implementa melhorias de segurança para proteção das chaves API:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-green-700">
                    <li>Sanitização automática de chaves para remover espaços e caracteres inválidos</li>
                    <li>Validação de formato antes de uso (prefixo $aact_)</li>
                    <li>Rotação de chaves sem interrupção de serviço</li>
                    <li>Sistema de prioridade para failover automático</li>
                    <li>Monitoramento e log de problemas de chaves</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviços da API Asaas</CardTitle>
              <CardDescription>
                Principais funcionalidades disponíveis via API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Clientes</TableCell>
                      <TableCell className="font-mono text-xs">/customers</TableCell>
                      <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Implementado</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pagamentos PIX</TableCell>
                      <TableCell className="font-mono text-xs">/payments</TableCell>
                      <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Implementado</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pagamentos Cartão</TableCell>
                      <TableCell className="font-mono text-xs">/payments</TableCell>
                      <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Implementado</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Webhooks</TableCell>
                      <TableCell className="font-mono text-xs">/webhook</TableCell>
                      <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Implementado</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>QRCode PIX</TableCell>
                      <TableCell className="font-mono text-xs">/payments/{"{id}"}/pixQrCode</TableCell>
                      <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Implementado</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status de Pagamento</TableCell>
                      <TableCell className="font-mono text-xs">/payments/{"{id}"}</TableCell>
                      <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Implementado</span></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="netlify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2 text-blue-600" />
                Variáveis de Ambiente Netlify
              </CardTitle>
              <CardDescription>
                Configuração necessária para o deploy em produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-amber-800">Checklist de Implantação</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Verifique se todas as variáveis abaixo estão configuradas corretamente no painel do Netlify antes de fazer deploy em produção.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-primary/5 rounded-md">
                <h3 className="font-medium flex items-center"><Server className="h-5 w-5 mr-2 text-blue-600" /> Variáveis Asaas</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Configuração das variáveis de ambiente para o Asaas nas funções Netlify:
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Variável</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">USE_ASAAS_PRODUCTION</TableCell>
                      <TableCell>
                        <Badge variant="secondary">true</Badge> ou <Badge variant="secondary">false</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          <strong>OBRIGATÓRIO</strong>. Controla o ambiente (produção ou sandbox). Para produção, deve ser <strong>EXATAMENTE</strong> a string <code className="bg-slate-100 px-1">"true"</code>.
                        </span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-amber-50/50">
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_1</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm"><strong>OBRIGATÓRIO</strong>. Deve começar com <code className="bg-slate-100 px-1">$aact_</code>. Não pode conter espaços, quebras de linha ou aspas.</span>
                      </TableCell>
                      <TableCell>
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_2</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave secundária de failover (opcional). Mesmo formato da chave 1.</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_3</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave terciária de failover (opcional). Mesmo formato da chave 1.</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_4</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave quaternária de failover (opcional). Mesmo formato da chave 1.</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_5</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave quinária de failover (opcional). Mesmo formato da chave 1.</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_SANDBOX_KEY</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_sandbox_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de sandbox para testes (obrigatória para ambiente de desenvolvimento).</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-6 p-3 bg-amber-50/80 border border-amber-200 rounded-md">
                  <h4 className="text-amber-800 font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-700" />
                    Formato das Chaves Asaas
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    As chaves Asaas devem sempre:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-700 mt-1 space-y-1">
                    <li>Começar com <code className="bg-amber-100 px-1">$aact_</code> para produção</li>
                    <li>Começar com <code className="bg-amber-100 px-1">$aact_sandbox_</code> para sandbox</li>
                    <li><strong>NÃO</strong> conter espaços em branco</li>
                    <li><strong>NÃO</strong> conter aspas (simples ou duplas) envolvendo a chave</li>
                    <li><strong>NÃO</strong> conter quebras de linha (CR/LF)</li>
                    <li><strong>NÃO</strong> conter caracteres invisíveis (espaços não-quebráveis, etc)</li>
                    <li><strong>NÃO</strong> ser uma chave expirada ou revogada na plataforma Asaas</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-md">
                <h3 className="font-medium flex items-center"><Database className="h-5 w-5 mr-2 text-emerald-600" /> Variáveis Supabase</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Configuração das variáveis de ambiente para o Supabase nas funções Netlify:
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Variável</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">SUPABASE_URL</TableCell>
                      <TableCell>
                        <Badge variant="secondary">https://onysoawoiffinwewtsex.supabase.co</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm"><strong>OBRIGATÓRIO</strong>. URL do projeto Supabase.</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</TableCell>
                      <TableCell>
                        <Badge variant="secondary">eyJhbG...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm"><strong>OBRIGATÓRIO</strong>. Service Role Key do Supabase - <strong>NÃO</strong> usar a chave anon/pública.</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">SUPABASE_ANON_KEY</TableCell>
                      <TableCell>
                        <Badge variant="secondary">eyJhbG...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm"><strong>OBRIGATÓRIO</strong>. Chave anônima (pública) do Supabase.</span>
                      </TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-6 p-3 bg-emerald-50/80 border border-emerald-200 rounded-md">
                  <h4 className="text-emerald-800 font-medium flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2 text-emerald-700" />
                    Segurança das Chaves
                  </h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    A <code className="bg-emerald-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> possui permissões elevadas e <strong>nunca</strong> deve ser 
                    exposta no frontend. Use-a apenas nas funções Netlify.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-md">
                <h3 className="font-medium flex items-center"><Bug className="h-5 w-5 mr-2 text-violet-600" /> Variáveis para Depuração</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Variáveis opcionais para depuração e diagnóstico:
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Variável</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">DEBUG_ASAAS_KEYS</TableCell>
                      <TableCell>
                        <Badge variant="secondary">true</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          Ativa logs detalhados para diagnóstico de chaves API. 
                          <strong className="text-amber-600"> Usar apenas em ambientes de dev/homolog!</strong>
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">DEBUG_PAYMENT_FLOW</TableCell>
                      <TableCell>
                        <Badge variant="secondary">true</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          Ativa logs detalhados do fluxo de pagamento. 
                          <strong className="text-amber-600"> Usar apenas em ambientes de dev/homolog!</strong>
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">LOG_LEVEL</TableCell>
                      <TableCell>
                        <Badge variant="secondary">debug</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          Define o nível de detalhamento dos logs. Opções: error, warn, info, debug.
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Card className="mt-4 border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-blue-600" />
                    Verificação de Configuração
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Para garantir que suas funções Netlify estão configuradas corretamente, você pode acessar:
                  </p>
                  <div className="mt-3 flex flex-col space-y-2">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <p className="text-xs font-mono">/api/check-asaas-keys</p>
                      <p className="text-xs text-blue-700">Verifica configuração das chaves configuradas</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-md">
                      <p className="text-xs font-mono">/api/asaas-diagnostic</p>
                      <p className="text-xs text-blue-700">Diagnóstico completo da integração Asaas</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-md">
                      <p className="text-xs font-mono">/api/check-env</p>
                      <p className="text-xs text-blue-700">Verifica variáveis de ambiente disponíveis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-primary/5 rounded-md">
                <h3 className="font-medium flex items-center"><Network className="h-5 w-5 mr-2 text-purple-600" /> Configurações do Node.js</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Configuração do ambiente Node.js para as funções Netlify:
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Variável</TableHead>
                      <TableHead>Valor Recomendado</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">NODE_VERSION</TableCell>
                      <TableCell>
                        <Badge variant="secondary">18.18.0</Badge> ou superior
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          <strong>OBRIGATÓRIO</strong>. O projeto requer no mínimo Node.js 18.18.0 para compatibilidade com pacotes ESM e ESLint.
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">NPM_VERSION</TableCell>
                      <TableCell>
                        <Badge variant="secondary">9.6.7</Badge> ou superior
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          <strong>OBRIGATÓRIO</strong>. Versão do NPM compatível com a estrutura de dependências do projeto.
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 bg-green-50/50 border border-green-100 rounded-md">
                <h3 className="font-medium text-green-800 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-700" />
                  Checklist de Implantação
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Verifique os seguintes itens antes de fazer deploy em produção:
                </p>
                <div className="mt-3 space-y-2 text-sm text-green-700">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <p>O arquivo <code className="bg-green-100 px-1">netlify.toml</code> está configurado corretamente com <code className="bg-green-100 px-1">functions = "netlify/functions"</code></p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <p>O bundler está configurado como <code className="bg-green-100 px-1">node_bundler = "esbuild"</code> no netlify.toml</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <p>O pacote <code className="bg-green-100 px-1">node-fetch</code> está listado em <code className="bg-green-100 px-1">package.json</code> como dependência</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <p>A variável <code className="bg-green-100 px-1">USE_ASAAS_PRODUCTION</code> está definida como <code className="bg-green-100 px-1">"true"</code> (string) para produção</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <p>Todas as chaves API estão sem espaços ou caracteres invisíveis</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <p>O arquivo <code className="bg-green-100 px-1">src/services/asaas/keyService/index.ts</code> exporta corretamente a função <code className="bg-green-100 px-1">diagnoseApiKey</code></p>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border border-blue-200">
                <AlertTitle className="text-blue-800 flex items-center">
                  <Bug className="h-4 w-4 mr-2 text-blue-700" />
                  Solução para erro 401 na API Asaas
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  <p className="text-sm mt-1 mb-2">
                    Se você receber o erro 401 (Não autorizado) ao tentar usar as funções Netlify que chamam a API do Asaas, verifique:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Se a chave API está correta e sem caracteres invisíveis</li>
                    <li>Se <code className="bg-blue-100 px-1">USE_ASAAS_PRODUCTION</code> está definida como <code className="bg-blue-100 px-1">"true"</code> (string) para acessar o ambiente de produção</li>
                    <li>Se você está usando a chave de produção ($aact_) quando USE_ASAAS_PRODUCTION=true</li>
                    <li>Se você está usando a chave de sandbox ($aact_sandbox_) quando USE_ASAAS_PRODUCTION=false</li>
                    <li>Se a chave não expirou ou foi revogada na plataforma Asaas</li>
                    <li>Se você está chamando a API correta (sandbox vs produção)</li>
                    <li>Se o diagnóstico da chave em <code className="bg-blue-100 px-1">/api/asaas-diagnostic</code> indica algum problema específico</li>
                  </ol>
                  <p className="text-sm mt-2">
                    Se o problema persistir, crie uma função de diagnóstico temporária que imprima os detalhes completos da chave e da requisição para debugging.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do netlify.toml</CardTitle>
              <CardDescription>
                Configurações importantes para o funcionamento correto das funções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium">Configuração de Build</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O arquivo netlify.toml deve conter:
                  </p>
                  <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-2 overflow-auto">
{`[build]
  command = "npm install --legacy-peer-deps && npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18.18.0"
  NPM_VERSION = "9.6.7"
  SECRETS_SCAN_ENABLED = "false"`}
                  </pre>
                </div>

                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium">Configuração das Funções</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configuração específica para as funções Netlify:
                  </p>
                  <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-2 overflow-auto">
{`[functions]
  node_bundler = "esbuild"
  included_files = ["netlify/functions/**"]
  external_node_modules = ["encoding"]

# Função específica com timeout estendido
[functions.create-asaas-customer]
  timeout = 60`}
                  </pre>
                </div>

                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium">Redirecionamentos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Redirecionamento para funções Netlify via /api:
                  </p>
                  <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-2 overflow-auto">
{`[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
  force = true`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roadmap para Diagnóstico de Erros</CardTitle>
              <CardDescription>
                Passos recomendados para diagnosticar e corrigir problemas com a API Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-md">
                  <ol className="list-decimal list-inside space-y-3">
                    <li className="font-medium">
                      Validar manualmente a chave da Asaas
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Use curl ou Postman para testar a chave API diretamente:
                      </p>
                      <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-1 ml-6 overflow-auto">
{`curl -X GET "https://api.asaas.com/api/v3/status" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \$aact_YourActualKey"`}
                      </pre>
                    </li>

                    <li className="font-medium">
                      Verificar configurações de ambiente no Netlify
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Confirme que <code>USE_ASAAS_PRODUCTION</code> esteja definido como <code>"true"</code> (string) 
                        e que a chave de produção esteja configurada corretamente.
                      </p>
                    </li>

                    <li className="font-medium">
                      Implementar função de diagnóstico
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Crie uma função temporária que imprima detalhes da chave e do ambiente:
                      </p>
                      <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-1 ml-6 overflow-auto">
{`// netlify/functions/check-asaas-env.js
exports.handler = async () => {
  try {
    const envDetails = {
      useProduction: process.env.USE_ASAAS_PRODUCTION,
      hasProductionKey: !!process.env.ASAAS_API_PRODUCTION_KEY_1,
      hasSandboxKey: !!process.env.ASAAS_API_SANDBOX_KEY,
      keyFormat: {
        firstChars: process.env.ASAAS_API_PRODUCTION_KEY_1 ? 
          process.env.ASAAS_API_PRODUCTION_KEY_1.substring(0, 6) : null,
        length: process.env.ASAAS_API_PRODUCTION_KEY_1 ? 
          process.env.ASAAS_API_PRODUCTION_KEY_1.length : 0,
        containsSpaces: process.env.ASAAS_API_PRODUCTION_KEY_1 ? 
          process.env.ASAAS_API_PRODUCTION_KEY_1.includes(' ') : null
      },
      nodeInfo: {
        version: process.version,
        env: process.env.NODE_ENV
      }
    };
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envDetails)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}`}
                      </pre>
                    </li>

                    <li className="font-medium">
                      Validar formato da chave
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Certifique-se de que a chave esteja no formato correto:
                      </p>
                      <ul className="list-disc list-inside text-sm ml-6">
                        <li>Deve começar com <code>$aact_</code> (produção) ou <code>$aact_sandbox_</code> (sandbox)</li>
                        <li>Não deve conter espaços, quebras de linha ou aspas</li>
                        <li>Recodifique a chave se necessário para garantir compatibilidade UTF-8</li>
                      </ul>
                    </li>

                    <li className="font-medium">
                      Verificar sanitização da chave
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Certifique-se de que o código esteja sanitizando a chave corretamente antes do uso:
                      </p>
                      <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-1 ml-6 overflow-auto">
{`// Sanitização correta da chave API
const sanitizedKey = apiKey.trim().replace(/\\s+/g, '');
// Verificar se a chave sanitizada tem o formato esperado
if (!sanitizedKey.startsWith('$aact_')) {
  console.error('Formato de chave inválido');
}`}
                      </pre>
                    </li>

                    <li className="font-medium">
                      Verificar cabeçalhos de autenticação
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Confirme que os cabeçalhos de autorização estão sendo enviados corretamente:
                      </p>
                      <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-1 ml-6 overflow-auto">
{`// Header de autorização correto
const headers = {
  'Content-Type': 'application/json',
  'Authorization': \`Bearer \${sanitizedKey}\`  // Formato correto
};`}
                      </pre>
                    </li>

                    <li className="font-medium">
                      Implementar retry com exponential backoff
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Adicione lógica de retry para lidar com falhas temporárias de API:
                      </p>
                      <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-1 ml-6 overflow-auto">
{`async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(\`Status \${response.status}\`);
    } catch (error) {
      lastError = error;
    }
    // Exponential backoff delay
    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  throw lastError;
}`}
                      </pre>
                    </li>

                    <li className="font-medium">
                      Verificar dependências e compatibilidade
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Garanta que todas as dependências estão instaladas e são compatíveis:
                      </p>
                      <ul className="list-disc list-inside text-sm ml-6">
                        <li>Certifique-se de que <code>node-fetch</code> está na versão compatível com Node.js 18+</li>
                        <li>Considere usar <code>undici</code> se <code>node-fetch</code> apresentar problemas</li>
                        <li>Verifique se <code>external_node_modules = ["encoding"]</code> está no netlify.toml</li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiInformation;
