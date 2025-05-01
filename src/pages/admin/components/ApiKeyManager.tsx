
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getAllApiKeys as listApiKeys, addApiKey, toggleKeyStatus, getActiveApiKey } from '@/services/asaas/keyService';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check } from 'lucide-react';
import { AsaasApiKey } from '@/services/asaas/types';

const ApiKeyManager = () => {
  const [keys, setKeys] = useState<AsaasApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<number | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newSandboxKeyName, setNewSandboxKeyName] = useState('');
  const [newSandboxApiKey, setNewSandboxApiKey] = useState('');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  // Carrega as chaves ao montar o componente
  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setIsLoadingKeys(true);
    try {
      // Primeiro, carregamos a chave ativa para cada ambiente
      const activeProductionKey = await getActiveApiKey(false);
      const activeSandboxKey = await getActiveApiKey(true);
      
      if (activeProductionKey) {
        setActiveKeyId(activeProductionKey.id);
      } else if (activeSandboxKey) {
        setActiveKeyId(activeSandboxKey.id);
      }
      
      // Load production keys
      const productionKeys = await listApiKeys(false);
      // Load sandbox keys
      const sandboxKeys = await listApiKeys(true);
      
      // Combine both arrays
      const allKeys = [...productionKeys, ...sandboxKeys];
      
      console.log('Chaves carregadas:', allKeys);
      setKeys(allKeys);
    } catch (error) {
      console.error('Erro ao carregar chaves:', error);
      toast({
        title: 'Erro ao carregar chaves',
        description: 'Não foi possível carregar as chaves de API.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKeyName || !newApiKey) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome e a chave API.',
        variant: 'destructive',
      });
      return;
    }

    const productionKeys = keys.filter(k => !k.is_sandbox);
    if (productionKeys.length >= 5) {
      toast({
        title: 'Limite atingido',
        description: 'Você já atingiu o limite máximo de 5 chaves de produção.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addApiKey(
        newKeyName,
        newApiKey,
        false, // production key
        productionKeys.length + 1
      );
      
      setNewKeyName('');
      setNewApiKey('');
      await loadKeys();
      
      toast({
        title: 'Chave adicionada',
        description: 'A chave de API foi adicionada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar chave:', error);
      toast({
        title: 'Erro ao adicionar chave',
        description: 'Não foi possível adicionar a chave de API.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSandboxKey = async () => {
    if (!newSandboxKeyName || !newSandboxApiKey) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome e a chave API de sandbox.',
        variant: 'destructive',
      });
      return;
    }

    const sandboxKeys = keys.filter(k => k.is_sandbox);
    if (sandboxKeys.length >= 1) {
      toast({
        title: 'Sandbox já configurado',
        description: 'Você já tem uma chave de sandbox. Desative-a primeiro para adicionar uma nova.',
        variant: 'destructive',
      });
      return;
    }

    setIsSandboxLoading(true);
    try {
      await addApiKey(
        newSandboxKeyName,
        newSandboxApiKey,
        true, // sandbox key
        1 // priority doesn't matter for sandbox as there's only one
      );
      
      setNewSandboxKeyName('');
      setNewSandboxApiKey('');
      await loadKeys();
      
      toast({
        title: 'Chave Sandbox adicionada',
        description: 'A chave de API Sandbox foi adicionada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar chave sandbox:', error);
      toast({
        title: 'Erro ao adicionar chave',
        description: 'Não foi possível adicionar a chave de API Sandbox.',
        variant: 'destructive',
      });
    } finally {
      setIsSandboxLoading(false);
    }
  };

  const handleToggleStatus = async (keyId: number, currentStatus: boolean) => {
    try {
      await toggleKeyStatus(keyId, !currentStatus);
      await loadKeys();
      
      toast({
        title: 'Status atualizado',
        description: `A chave foi ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status da chave.',
        variant: 'destructive',
      });
    }
  };

  const sandboxKey = keys.find(key => key.is_sandbox);
  
  // Ordenamos as chaves de produção primeiro pela chave ativa, depois pela prioridade
  const productionKeys = keys
    .filter(key => !key.is_sandbox)
    .sort((a, b) => {
      // Se a é a chave ativa, ela vem primeiro
      if (a.id === activeKeyId) return -1;
      // Se b é a chave ativa, ela vem primeiro
      if (b.id === activeKeyId) return 1;
      // Caso contrário, ordenamos por prioridade
      return a.priority - b.priority;
    });

  if (isLoadingKeys) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Carregando chaves de API...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="production" className="space-y-4">
      <TabsList>
        <TabsTrigger value="sandbox">Sandbox</TabsTrigger>
        <TabsTrigger value="production">Produção</TabsTrigger>
      </TabsList>

      <TabsContent value="sandbox" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chave de Sandbox</CardTitle>
            <CardDescription>
              Chave para testes em ambiente de desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sandboxKey ? (
              <div className={`flex items-center justify-between p-4 border rounded-lg ${sandboxKey.id === activeKeyId ? 'border-primary bg-primary/5' : ''}`}>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <p className="font-medium">{sandboxKey.key_name}</p>
                    {sandboxKey.id === activeKeyId && (
                      <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                        <Check className="h-3 w-3 mr-1" /> Em uso
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sandboxKey.api_key}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={sandboxKey.is_active ? "default" : "secondary"}>
                      {sandboxKey.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={sandboxKey.is_active}
                  onCheckedChange={() => handleToggleStatus(sandboxKey.id, sandboxKey.is_active)}
                />
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground text-center py-4 mb-6">
                  Nenhuma chave de sandbox cadastrada
                </p>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="sandboxKeyName">Nome da Chave Sandbox</Label>
                    <Input
                      id="sandboxKeyName"
                      value={newSandboxKeyName}
                      onChange={(e) => setNewSandboxKeyName(e.target.value)}
                      placeholder="Ex: Chave Sandbox"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sandboxApiKey">Chave API Sandbox</Label>
                    <Input
                      id="sandboxApiKey"
                      value={newSandboxApiKey}
                      onChange={(e) => setNewSandboxApiKey(e.target.value)}
                      placeholder="$aas_sandbox_..."
                      type="password"
                    />
                  </div>

                  <Button 
                    onClick={handleAddSandboxKey} 
                    disabled={isSandboxLoading || !newSandboxKeyName || !newSandboxApiKey}
                    className="w-full"
                  >
                    {isSandboxLoading ? 'Adicionando...' : 'Adicionar Chave Sandbox'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="production">
        <Card>
          <CardHeader>
            <CardTitle>Chaves de API de Produção</CardTitle>
            <CardDescription>
              Gerencie suas chaves de API do Asaas (máximo 5 chaves)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                {productionKeys.length > 0 ? (
                  productionKeys.map((key) => (
                    <div 
                      key={key.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg ${key.id === activeKeyId ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <p className="font-medium">{key.key_name}</p>
                          {key.id === activeKeyId && (
                            <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                              <Check className="h-3 w-3 mr-1" /> Em uso
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {key.api_key}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Prioridade: {key.priority}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant={key.is_active ? "default" : "secondary"}>
                            {key.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={() => handleToggleStatus(key.id, key.is_active)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma chave de produção cadastrada
                  </p>
                )}
              </div>

              {productionKeys.length < 5 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Nome da Chave</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Ex: Chave Principal"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave API</Label>
                    <Input
                      id="apiKey"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="$aas_..."
                      type="password"
                    />
                  </div>

                  <Button 
                    onClick={handleAddKey} 
                    disabled={isLoading || !newKeyName || !newApiKey}
                    className="w-full"
                  >
                    {isLoading ? 'Adicionando...' : 'Adicionar Nova Chave'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ApiKeyManager;
