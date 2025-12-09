import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { avaliacoesApi, resultadosApi } from "@/services/api";
import type { Avaliacao, ProfessorNotasResponse } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import React from "react";
import { ChevronDown, ChevronUp, Paperclip } from "lucide-react";

const CourseGrades = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resumo, setResumo] = useState<ProfessorNotasResponse | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<string>("");
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [notaObtida, setNotaObtida] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [respostasAbertas, setRespostasAbertas] = useState<Record<number, boolean>>({});

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
            : "Não foi possível carregar as notas do curso.";
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

  const avaliacaoRealizada = useMemo(() => {
    if (!resumo || !avaliacaoSelecionada || !alunoSelecionado) return false;
    const aluno = resumo.alunos.find((item) => item.alunoId === Number(alunoSelecionado));
    const avaliacao = aluno?.avaliacoes.find(
      (item) => item.avaliacaoId === Number(avaliacaoSelecionada),
    );
    return Boolean(avaliacao?.realizado);
  }, [resumo, avaliacaoSelecionada, alunoSelecionado]);

  const handleLancamento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !avaliacaoSelecionada || !alunoSelecionado) {
      toast.error("Selecione avaliação e aluno.");
      return;
    }

    const notaNumber = Number(notaObtida);
    if (Number.isNaN(notaNumber)) {
      toast.error("Informe um valor numérico para a nota.");
      return;
    }

    if (!avaliacaoRealizada) {
      toast.error("O aluno ainda não realizou esta avaliação.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resultadosApi.lancarNota(avaliacaoSelecionada, {
        alunoId: Number(alunoSelecionado),
        notaObtida: notaNumber,
      });
      toast.success("Nota registrada com sucesso!");
      setNotaObtida("");
      const atualizado = await resultadosApi.getByCurso(id);
      setResumo(atualizado);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Não foi possível registrar a nota.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRespostas = (avaliacaoId: number) => {
    setRespostasAbertas((prev) => ({
      ...prev,
      [avaliacaoId]: !(prev[avaliacaoId] ?? true),
    }));
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
                Curso: {resumo.cursoTitulo}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate(`/curso/${id}`)}>
            Voltar para o curso
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lançar nota</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleLancamento}>
              <div className="space-y-2">
                <Label>Avaliação</Label>
                <Select value={avaliacaoSelecionada} onValueChange={setAvaliacaoSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a avaliação" />
                  </SelectTrigger>
                  <SelectContent>
                    {avaliacoes.map((avaliacao) => (
                      <SelectItem key={avaliacao.id} value={avaliacao.id.toString()}>
                        {avaliacao.tipoAvaliacao} (máx. {avaliacao.notaMaxima})
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
                  {isSubmitting ? "Salvando..." : "Registrar nota"}
                </Button>
              </div>
            </form>
            {avaliacaoSelecionada && alunoSelecionado && !avaliacaoRealizada && (
              <p className="text-sm text-amber-600 mt-2">
                O aluno ainda não marcou esta avaliação como realizada.
              </p>
            )}
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
                        Nenhuma avaliação registrada para este aluno.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {aluno.avaliacoes.map((avaliacao) => (
                          <div
                            key={avaliacao.avaliacaoId}
                            className="rounded-xl border border-muted-foreground/10 bg-white shadow-sm p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-base">{avaliacao.tipoAvaliacao}</span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      avaliacao.realizado
                                        ? "bg-green-100 text-green-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {avaliacao.realizado ? "Realizada" : "Pendente"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="font-medium text-foreground">
                                    Nota:{" "}
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary font-semibold">
                                      {avaliacao.notaObtida ?? "-"}
                                    </span>
                                    <span className="text-muted-foreground">/ {avaliacao.notaMaxima}</span>
                                  </span>
                                  {avaliacao.anexoNome && avaliacao.anexoUrl ? (
                                    <a
                                      href={avaliacao.anexoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-primary hover:bg-muted-foreground/10 transition"
                                    >
                                      <Paperclip className="h-4 w-4" />
                                      Ver anexo ({avaliacao.anexoNome})
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {avaliacao.respostas && avaliacao.respostas.length > 0 && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  className="text-xs text-primary font-semibold inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 hover:bg-primary/20 transition"
                                  onClick={() => toggleRespostas(avaliacao.avaliacaoId)}
                                >
                                  <span className="text-sm">
                                    {(respostasAbertas[avaliacao.avaliacaoId] ?? true)
                                      ? "Ocultar respostas enviadas"
                                      : "Ver respostas enviadas"}
                                  </span>
                                  {(respostasAbertas[avaliacao.avaliacaoId] ?? true) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                                {(respostasAbertas[avaliacao.avaliacaoId] ?? true) && (
                                  <div className="mt-2 space-y-2 text-sm rounded-lg border border-muted-foreground/20 bg-muted/60 p-3">
                                    {avaliacao.respostas.map((resp, idx) => (
                                      <div
                                        key={resp.perguntaId ?? idx}
                                        className="rounded-lg bg-white border border-muted-foreground/20 px-3 py-2 shadow-inner"
                                      >
                                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                                          Pergunta: {resp.enunciado || resp.perguntaId}
                                        </div>
                                        <div className="text-sm whitespace-pre-line text-foreground">
                                          {resp.resposta || "-"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
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