
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, KeyRound, Code, FileCode, ShieldCheck } from 'lucide-react';

const ApiInformation = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Informações de API</h1>
        <p className="text-muted-foreground">
          Veja como as APIs estão configuradas em seu projeto.
        </p>
      </div>

      <Tabs defaultValue="supabase">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="supabase">
            <Database className="h-4 w-4 mr-2" />
            Supabase
          </TabsTrigger>
          <TabsTrigger value="asaas">
            <KeyRound className="h-4 w-4 mr-2" />
            Asaas
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
      </Tabs>
    </div>
  );
};

export default ApiInformation;
