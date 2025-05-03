import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, KeyRound, Code, FileCode, ShieldCheck, Server, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
              <CardTitle>Variáveis de Ambiente Netlify</CardTitle>
              <CardDescription>
                Configuração necessária para o deploy em produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-md">
                <h3 className="font-medium flex items-center"><Server className="h-5 w-5 mr-2 text-blue-600" /> Variáveis Asaas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configuração das variáveis de ambiente para o Asaas nas funções Netlify:
                </p>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Variável</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observação</TableHead>
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
                          Controla o ambiente (produção ou sandbox). Use <strong>true</strong> para produção e <strong>false</strong> para sandbox.
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_1</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de produção primária (prioridade 1)</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_2</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de produção secundária (prioridade 2, opcional)</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_3</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de produção terciária (prioridade 3, opcional)</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_4</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de produção quaternária (prioridade 4, opcional)</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_PRODUCTION_KEY_5</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de produção quinária (prioridade 5, opcional)</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">ASAAS_API_SANDBOX_KEY</TableCell>
                      <TableCell>
                        <Badge variant="secondary">$aact_sandbox_...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de sandbox para testes</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-md">
                  <h4 className="text-amber-800 font-medium">⚠️ Importante: Formato das Chaves</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    As chaves Asaas devem sempre começar com <code className="bg-amber-100 px-1">$aact_</code> para produção 
                    e <code className="bg-amber-100 px-1">$aact_sandbox_</code> para sandbox. 
                    Não inclua espaços, aspas ou caracteres invisíveis nas chaves.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-md">
                <h3 className="font-medium flex items-center"><Database className="h-5 w-5 mr-2 text-emerald-600" /> Variáveis Supabase</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configuração das variáveis de ambiente para o Supabase nas funções Netlify:
                </p>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Variável</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">SUPABASE_URL</TableCell>
                      <TableCell>
                        <Badge variant="secondary">https://onysoawoiffinwewtsex.supabase.co</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">URL do projeto Supabase</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</TableCell>
                      <TableCell>
                        <Badge variant="secondary">eyJhbG...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave de serviço (service role) do Supabase - <strong>Não</strong> use a chave anon/pública</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">SUPABASE_ANON_KEY</TableCell>
                      <TableCell>
                        <Badge variant="secondary">eyJhbG...</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Chave anônima (pública) do Supabase</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200 rounded-md">
                  <h4 className="text-emerald-800 font-medium">✓ Importante: Segurança das Chaves</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    A <code className="bg-emerald-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> possui permissões elevadas e <strong>nunca</strong> deve ser 
                    exposta no frontend. Use-a apenas nas funções Netlify.
                  </p>
                </div>
              </div>

              <Card className="border border-blue-100">
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
                      <p className="text-xs font-mono">/api/check-asaas-keys?sandbox=true</p>
                      <p className="text-xs text-blue-700">Verifica configuração das chaves sandbox</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-md">
                      <p className="text-xs font-mono">/api/check-asaas-keys?sandbox=false</p>
                      <p className="text-xs text-blue-700">Verifica configuração das chaves de produção</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-md">
                      <p className="text-xs font-mono">/api/asaas-diagnostic</p>
                      <p className="text-xs text-blue-700">Diagnóstico completo da integração Asaas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-green-50/50 border border-green-100 rounded-md">
                <h3 className="font-medium text-green-800">✅ Configuração Recomendada</h3>
                <p className="text-sm text-green-700 mt-1">
                  Para o funcionamento ideal do sistema, recomendamos:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-green-700">
                  <li>Definir todas as variáveis acima no painel do Netlify</li>
                  <li>Utilizar no mínimo duas chaves Asaas para failover em produção</li>
                  <li>Configurar <code className="bg-green-100 px-1">USE_ASAAS_PRODUCTION=false</code> para testes iniciais</li>
                  <li>Configurar <code className="bg-green-100 px-1">USE_ASAAS_PRODUCTION=true</code> apenas após testes completos</li>
                  <li>Verificar o formato correto das chaves de API antes de salvar</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Build</CardTitle>
              <CardDescription>
                Configurações importantes do netlify.toml do projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-md">
                  <h3 className="font-medium">Configuração de Build</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O arquivo netlify.toml define as configurações de build:
                  </p>
                  <pre className="bg-black/90 text-white p-3 rounded-md text-xs mt-2 overflow-auto">
{`[build]
  command = "npm install --legacy-peer-deps && npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18.17.0"
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiInformation;
