import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { avaliacoesApi, resultadosApi } from '@/services/api';
import type { Avaliacao, ProfessorNotasResponse } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CourseGrades = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resumo, setResumo] = useState<ProfessorNotasResponse | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<string>('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>('');
  const [notaObtida, setNotaObtida] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    const carregar = async () => {
      try {
        const [resumoResponse, avaliacoesResponse] = await Promise.all([
          resultadosApi.getByCurso(id),
          avaliacoesApi.getByCurso(id),
        ]);
        setResumo(resumoResponse);
        setAvaliacoes(avaliacoesResponse);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar as notas do curso.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    carregar();
  }, [id]);

  const alunosOptions = useMemo(() => {
    if (!resumo) return [];
    return resumo.alunos.map((aluno) => ({
      value: aluno.alunoId.toString(),
      label: aluno.alunoNome,
    }));
  }, [resumo]);

  const handleLancamento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !avaliacaoSelecionada || !alunoSelecionado) {
      toast.error('Selecione avaliacao e aluno.');
      return;
    }

    const notaNumber = Number(notaObtida);
    if (Number.isNaN(notaNumber)) {
      toast.error('Informe um valor numerico para a nota.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resultadosApi.lancarNota(avaliacaoSelecionada, {
        alunoId: Number(alunoSelecionado),
        notaObtida: notaNumber,
      });
      toast.success('Nota registrada com sucesso!');
      setNotaObtida('');
      const atualizado = await resultadosApi.getByCurso(id);
      setResumo(atualizado);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel registrar a nota.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Notas do curso</h1>
            {resumo && (
              <p className="text-muted-foreground">
                Curso: {resumo.cursoTitulo} (ID {resumo.cursoId})
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate(`/curso/${id}`)}>
            Voltar para o curso
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lancar nota</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleLancamento}>
              <div className="space-y-2">
                <Label>Avaliacao</Label>
                <Select value={avaliacaoSelecionada} onValueChange={setAvaliacaoSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a avaliacao" />
                  </SelectTrigger>
                  <SelectContent>
                    {avaliacoes.map((avaliacao) => (
                      <SelectItem key={avaliacao.id} value={avaliacao.id.toString()}>
                        {avaliacao.tipoAvaliacao} (max {avaliacao.notaMaxima})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aluno</Label>
                <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunosOptions.map((aluno) => (
                      <SelectItem key={aluno.value} value={aluno.value}>
                        {aluno.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notaObtida">Nota obtida</Label>
                <Input
                  id="notaObtida"
                  type="number"
                  min="0"
                  step="0.1"
                  value={notaObtida}
                  onChange={(event) => setNotaObtida(event.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting || !avaliacoes.length}>
                  {isSubmitting ? 'Salvando...' : 'Registrar nota'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos alunos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : !resumo || resumo.alunos.length === 0 ? (
              <p className="text-muted-foreground">Nenhum aluno matriculado ainda.</p>
            ) : (
              <div className="space-y-6">
                {resumo.alunos.map((aluno) => (
                  <div key={aluno.alunoId} className="border rounded-lg p-4 space-y-2">
                    <div>
                      <h2 className="text-lg font-semibold">{aluno.alunoNome}</h2>
                      <p className="text-sm text-muted-foreground">{aluno.alunoEmail}</p>
                    </div>
                    {aluno.avaliacoes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma avaliacao registrada para este aluno.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {aluno.avaliacoes.map((avaliacao) => (
                          <li key={avaliacao.avaliacaoId} className="flex justify-between">
                            <span>{avaliacao.tipoAvaliacao}</span>
                            <span>
                              {avaliacao.notaObtida ?? '-'} / {avaliacao.notaMaxima}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseGrades;
