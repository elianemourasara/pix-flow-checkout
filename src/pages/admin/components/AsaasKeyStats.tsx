
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getKeyMetrics } from '@/services/asaas/keyStatisticsService';
import { KeyMetrics } from '@/config/asaas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface KeyStat {
  id: number;
  name: string;
  metrics: KeyMetrics;
}

const AsaasKeyStats: React.FC = () => {
  const [stats, setStats] = useState<KeyStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const rawStats = getKeyMetrics();
      
      // Vamos buscar os nomes das chaves para exibição mais amigável
      // Em um caso real, você provavelmente buscaria isso do banco de dados
      const formattedStats: KeyStat[] = Object.entries(rawStats).map(([id, metrics]) => ({
        id: parseInt(id),
        name: `Chave #${id}`, // Em uma implementação real, buscaria o nome da chave
        metrics: metrics as KeyMetrics
      }));
      
      setStats(formattedStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas das chaves',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadStats();
    
    // Atualiza as estatísticas a cada 30 segundos
    const intervalId = setInterval(loadStats, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR');
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Estatísticas de Uso</CardTitle>
            <CardDescription>
              Dados de uso e erros das chaves de API
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadStats}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {stats.length > 0 ? (
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.id} className="p-4 border rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{stat.name}</h3>
                  <Badge variant={stat.metrics.errors > 0 ? "destructive" : "default"}>
                    {stat.metrics.errors > 0 ? `${stat.metrics.errors} Erros` : 'Sem Erros'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usos:</span>
                    <span>{stat.metrics.uses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Último uso:</span>
                    <span>{formatDate(stat.metrics.lastUsed)}</span>
                  </div>
                  {stat.metrics.errors > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Último erro:</span>
                        <span>{formatDate(stat.metrics.lastError)}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-muted-foreground">Mensagem de erro:</span>
                        <p className="text-red-500 mt-1">{stat.metrics.lastErrorMessage || 'Erro desconhecido'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
            ) : (
              <p>Nenhuma estatística disponível. As estatísticas aparecerão aqui após o uso das chaves.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AsaasKeyStats;
