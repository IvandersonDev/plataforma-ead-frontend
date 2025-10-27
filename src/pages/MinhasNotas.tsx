import { useEffect, useState } from 'react';
import { resultadosApi } from '@/services/api';
import type { Resultado } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const MinhasNotas = () => {
  const [notas, setNotas] = useState<Resultado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarNotas = async () => {
      try {
        const data = await resultadosApi.getMinhasNotas();
        setNotas(data);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Nao foi possivel carregar as notas.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    carregarNotas();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minhas notas</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho em cada avaliacao dos seus cursos.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : notas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma nota registrada ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notas.map((nota) => (
              <Card key={nota.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{nota.cursoTitulo}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Avaliacao: {nota.tipoAvaliacao}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {nota.notaObtida} / {nota.notaMaxima}
                  </Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinhasNotas;
