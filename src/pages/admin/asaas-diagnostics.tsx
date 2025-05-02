
import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import ApiKeyDiagnostic from './components/ApiKeyDiagnostic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AsaasDiagnostics = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Diagnóstico do Sistema Asaas</h1>
        
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
              <CardDescription>
                Esta página permite diagnosticar problemas de conexão com a API do Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                O diagnóstico verifica:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Formato e validade das chaves API</li>
                <li>Configuração de variáveis de ambiente</li>
                <li>Conectividade com os servidores Asaas</li>
                <li>Autenticação das credenciais</li>
                <li>Permissões das chaves API</li>
              </ul>
            </CardContent>
          </Card>
          
          <ApiKeyDiagnostic />
          
          <Card>
            <CardHeader>
              <CardTitle>Problemas Comuns</CardTitle>
              <CardDescription>
                Soluções para problemas frequentes com a API do Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Erro 401 (Não autorizado)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este erro geralmente indica problemas com sua chave API. Verifique:
                  </p>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    <li>Se a chave está no formato correto e não contém espaços ou quebras de linha</li>
                    <li>Se você está usando o ambiente correto (sandbox vs. produção)</li>
                    <li>Se a chave API não expirou ou foi revogada</li>
                    <li>Se a chave tem as permissões necessárias para a operação</li>
                    <li>Se a variável USE_ASAAS_PRODUCTION está configurada corretamente</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Erro de conexão</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Problemas de rede podem impedir a comunicação com a API. Verifique:
                  </p>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    <li>Se você consegue acessar https://api.asaas.com ou https://sandbox.asaas.com</li>
                    <li>Se há problemas de DNS ou firewall</li>
                    <li>Se a API do Asaas está operacional (verifique o status em https://status.asaas.com)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Diferença entre ambientes</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cada ambiente do Asaas requer credenciais diferentes:
                  </p>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    <li>Sandbox: Para testes, sem transações reais (começam com $aact_YTE)</li>
                    <li>Produção: Para transações reais (começam com $aact_)</li>
                    <li>As chaves de sandbox NÃO funcionam no ambiente de produção e vice-versa</li>
                    <li>Verifique se a variável USE_ASAAS_PRODUCTION está definida de acordo com o tipo de chave que está usando</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AsaasDiagnostics;
