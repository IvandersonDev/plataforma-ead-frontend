import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, avaliacoesApi, conteudosApi, resultadosApi } from "@/services/api";
import type { Avaliacao, Conteudo, Curso, RealizacaoPayload, Resultado } from "@/types";
import { toast } from "sonner";
import {
  Calendar,
  Users,
  BookOpen,
  FileText,
  ListOrdered,
  Upload,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Info,
} from "lucide-react";

type PerguntaForm = {
  id?: number;
  enunciado: string;
  peso: string;
};

const formatosDisponiveis = [
  { value: "pdf", label: "PDF" },
  { value: "ppt", label: "Apresentação (PPT)" },
  { value: "pptx", label: "Apresentação (PPTX)" },
  { value: "mp4", label: "Vídeo (MP4)" },
  { value: "png", label: "Imagem (PNG)" },
  { value: "jpg", label: "Imagem (JPG)" },
  { value: "jpeg", label: "Imagem (JPEG)" },
  { value: "gif", label: "Imagem (GIF)" },
  { value: "link", label: "Link/Embed" },
  { value: "text", label: "Texto" },
];

const extensoesSuportadas = ["pdf", "ppt", "pptx", "mp4", "png", "jpg", "jpeg", "gif"];

const extrairExtensao = (nome: string) => {
  const partes = nome.toLowerCase().split(".");
  return partes.length > 1 ? partes.pop() ?? "" : "";
};

const perguntaVazia = (): PerguntaForm => ({ enunciado: "", peso: "" });

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoadingCurso, setIsLoadingCurso] = useState(true);
  const [isMatriculado, setIsMatriculado] = useState(false);
  const [minhasNotas, setMinhasNotas] = useState<Resultado[]>([]);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);

  const [formConteudo, setFormConteudo] = useState({
    titulo: "",
    descricao: "",
    formatoOriginal: "pdf",
    conteudo: "",
    arquivoUrl: "",
    arquivoNome: "",
    arquivoTipo: "",
  });
  const [conteudoArquivo, setConteudoArquivo] = useState<File | null>(null);
  const arquivoInputRef = useRef<HTMLInputElement | null>(null);

  const [formAvaliacao, setFormAvaliacao] = useState({
    tipoAvaliacao: "",
    notaMaxima: "",
    dataLimite: "",
  });
  const [perguntasForm, setPerguntasForm] = useState<PerguntaForm[]>([perguntaVazia()]);

  const [previewConteudo, setPreviewConteudo] = useState<Conteudo | null>(null);
  const [isSavingConteudo, setIsSavingConteudo] = useState(false);
  const [isSavingAvaliacao, setIsSavingAvaliacao] = useState(false);
  const [editingConteudoId, setEditingConteudoId] = useState<number | null>(null);
  const [editingAvaliacaoId, setEditingAvaliacaoId] = useState<number | null>(null);
  const [avaliacaoAberta, setAvaliacaoAberta] = useState<number | null>(null);
  const [respostasAluno, setRespostasAluno] = useState<Record<number, string[]>>({});
  const [anexosPorAvaliacao, setAnexosPorAvaliacao] = useState<Record<number, File | null>>({});
  const [isDownloadingConteudoId, setIsDownloadingConteudoId] = useState<number | null>(null);
  const [isDownloadingPreview, setIsDownloadingPreview] = useState(false);

  const formatDateForInput = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
  };

  const handleEditarConteudo = (conteudo: Conteudo) => {
    setEditingConteudoId(conteudo.id);
    setFormConteudo({
      titulo: conteudo.titulo,
      descricao: conteudo.descricao,
      formatoOriginal: conteudo.formatoOriginal?.toLowerCase() ?? "text",
      conteudo:
        conteudo.conteudoOriginal ??
        (conteudo.conteudoAdaptadoTipo === "TEXT" ? conteudo.conteudoAdaptado ?? "" : ""),
      arquivoUrl: conteudo.arquivoUrl ?? "",
      arquivoNome: conteudo.arquivoNome ?? "",
      arquivoTipo: conteudo.arquivoTipo ?? "",
    });
    setConteudoArquivo(null);
    if (arquivoInputRef.current) {
      arquivoInputRef.current.value = "";
    }
  };

  const handleCancelarEdicaoConteudo = () => {
    resetConteudoForm();
  };

  const handleExcluirConteudo = async (conteudoId: number) => {
    if (!id) return;
    const confirmar = window.confirm("Deseja realmente excluir este conteúdo?");
    if (!confirmar) return;

    try {
      await conteudosApi.remove(id, conteudoId.toString());
      setConteudos((prev) => prev.filter((item) => item.id !== conteudoId));
      if (editingConteudoId === conteudoId) {
        resetConteudoForm();
      }
      toast.success("Conteúdo removido!");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Não foi possível remover o conteúdo.";
      toast.error(message);
    }
  };

  const preencherPerguntas = (avaliacao: Avaliacao | null) => {
    if (!avaliacao?.perguntas?.length) {
      setPerguntasForm([perguntaVazia()]);
      return;
    }
    setPerguntasForm(
      avaliacao.perguntas.map((pergunta) => ({
        id: pergunta.id,
        enunciado: pergunta.enunciado,
        peso: pergunta.peso.toString(),
      })),
    );
  };

  const handleEditarAvaliacao = (avaliacao: Avaliacao) => {
    setEditingAvaliacaoId(avaliacao.id);
    setFormAvaliacao({
      tipoAvaliacao: avaliacao.tipoAvaliacao,
      notaMaxima: avaliacao.notaMaxima.toString(),
      dataLimite: formatDateForInput(avaliacao.dataLimite),
    });
    preencherPerguntas(avaliacao);
  };

  const handleCancelarEdicaoAvaliacao = () => {
    resetAvaliacaoForm();
  };

  const handleExcluirAvaliacao = async (avaliacaoId: number) => {
    if (!id) return;
    const confirmar = window.confirm("Deseja realmente excluir esta avaliação?");
    if (!confirmar) return;

    try {
      await avaliacoesApi.remove(id, avaliacaoId.toString());
      setAvaliacoes((prev) => prev.filter((item) => item.id !== avaliacaoId));
      if (editingAvaliacaoId === avaliacaoId) {
        resetAvaliacaoForm();
      }
      toast.success("Avaliação removida!");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Não foi possível remover a avaliação.";
      toast.error(message);
    }
  };

  const resetConteudoForm = () => {
    setFormConteudo({
      titulo: "",
      descricao: "",
      formatoOriginal: "pdf",
      conteudo: "",
      arquivoUrl: "",
      arquivoNome: "",
      arquivoTipo: "",
    });
    setConteudoArquivo(null);
    if (arquivoInputRef.current) {
      arquivoInputRef.current.value = "";
    }
    setEditingConteudoId(null);
  };

  const resetAvaliacaoForm = () => {
    setFormAvaliacao({
      tipoAvaliacao: "",
      notaMaxima: "",
      dataLimite: "",
    });
    setPerguntasForm([perguntaVazia()]);
    setEditingAvaliacaoId(null);
  };

  const formattedConteudos = useMemo(
    () =>
      conteudos.map((conteudo) => {
        const formato = conteudo.formatoOriginal?.toLowerCase();
        let label = "Texto";
        if (formato === "pdf") {
          label = "PDF";
        } else if (formato === "ppt" || formato === "pptx") {
          label = "Apresentação";
        } else if (formato === "mp4" || formato === "video" || formato === "link") {
          label = "Vídeo";
        } else if (formato === "text") {
          label = "Texto";
        } else if (formato && ["png", "jpg", "jpeg", "gif", "image"].includes(formato)) {
          label = "Imagem";
        } else if (formato && formato !== "") {
          label = formato.toUpperCase();
        } else if (conteudo.conteudoAdaptadoTipo) {
          label = conteudo.conteudoAdaptadoTipo;
        }
        return {
          ...conteudo,
          formatoLabel: label,
        };
      }),
    [conteudos],
  );

  useEffect(() => {
    if (!id) {
      return;
    }
    void loadCurso(id);
    void loadConteudos(id);
    void loadAvaliacoes(id);
  }, [id]);

  useEffect(() => {
    if (!id || !user || user.tipo !== "aluno") {
      return;
    }
    setIsLoadingNotas(true);
    resultadosApi
      .getMinhasNotas()
      .then((lista) => {
        setMinhasNotas(lista);
        if (!isMatriculado && lista.length > 0) {
          setIsMatriculado(true);
        }
      })
      .catch(() => {
        /* silencioso */
      })
      .finally(() => setIsLoadingNotas(false));
  }, [id, user, isMatriculado]);

  const loadCurso = async (cursoId: string) => {
    setIsLoadingCurso(true);
    try {
      const data = await api.getCurso(cursoId);
      setCurso(data);
      if (data.matriculado !== undefined) {
        setIsMatriculado(Boolean(data.matriculado));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao carregar curso.";
      toast.error(message);
    } finally {
      setIsLoadingCurso(false);
    }
  };

  const loadConteudos = async (cursoId: string) => {
    try {
      const data = await api.getConteudos(cursoId);
      setConteudos(data);
    } catch (error) {
      console.warn("Erro ao carregar conteúdos", error);
    }
  };

  const loadAvaliacoes = async (cursoId: string) => {
    try {
      const data = await api.getAvaliacoes(cursoId);
      setAvaliacoes(data);
    } catch (error) {
      console.warn("Erro ao carregar avaliações", error);
    }
  };

  const handleMatricula = async () => {
    if (!id) return;
    try {
      await api.matricular(id);
      setIsMatriculado(true);
      toast.success("Matrícula realizada com sucesso!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao matricular no curso.";
      if (message.toLowerCase().includes("já matriculado")) {
        setIsMatriculado(true);
        toast.info("Você já está matriculado neste curso.");
        return;
      }
      toast.error(message);
    }
  };

  const handleSalvarConteudo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    if (!formConteudo.titulo.trim() || !formConteudo.descricao.trim()) {
      toast.error("Informe título e descrição do conteúdo.");
      return;
    }

    const arquivo = conteudoArquivo;
    const linkOuTexto = formConteudo.conteudo.trim();
    const isEditing = editingConteudoId !== null;
    const possuiArquivoExistente = isEditing && !!formConteudo.arquivoUrl;

    if (!arquivo && !linkOuTexto && !possuiArquivoExistente) {
      toast.error("Envie um arquivo ou informe um link/conteúdo.");
      return;
    }

    let formato = formConteudo.formatoOriginal || "text";

    if (arquivo) {
      const extensao = extrairExtensao(arquivo.name);
      if (!extensao || !extensoesSuportadas.includes(extensao)) {
        toast.error("Formato de arquivo não suportado. Use PDF, PPTX, MP4 ou imagem.");
        return;
      }
      formato = extensao;
    }

    setIsSavingConteudo(true);
    try {
      const conteudoTexto = linkOuTexto || null;
      const ehUrl = linkOuTexto ? /^https?:\/\//i.test(linkOuTexto) : false;

      let arquivoNome = formConteudo.arquivoNome?.trim() || null;
      let arquivoTipo = formConteudo.arquivoTipo?.trim() || null;
      let arquivoUrl = formConteudo.arquivoUrl?.trim() || null;

      if (arquivo) {
        arquivoNome = arquivo.name;
        arquivoTipo = arquivo.type;
        arquivoUrl = null;
      } else if (ehUrl) {
        arquivoNome = null;
        arquivoTipo = null;
        arquivoUrl = linkOuTexto;
      } else if (!possuiArquivoExistente) {
        arquivoNome = null;
        arquivoTipo = null;
        arquivoUrl = null;
      }

      const dados = {
        cursoId: Number(id),
        titulo: formConteudo.titulo.trim(),
        descricao: formConteudo.descricao.trim(),
        formatoOriginal: formato,
        conteudo: conteudoTexto,
        arquivoUrl,
        arquivoNome: arquivoNome ?? undefined,
        arquivoTipo: arquivoTipo ?? undefined,
      };

      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dados)], { type: "application/json" }));
      if (arquivo) {
        formData.append("arquivo", arquivo);
      }

      let resposta: Conteudo;
      if (isEditing && editingConteudoId !== null) {
        resposta = await conteudosApi.update(id, editingConteudoId.toString(), formData);
      } else {
        resposta = await conteudosApi.create(id, formData);
      }

      setConteudos((prev) =>
        isEditing ? prev.map((item) => (item.id === resposta.id ? resposta : item)) : [resposta, ...prev],
      );

      toast.success(isEditing ? "Conteúdo atualizado!" : "Conteúdo adicionado!");
      resetConteudoForm();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? "Não foi possível atualizar o conteúdo."
            : "Não foi possível adicionar o conteúdo.";
      toast.error(message);
    } finally {
      setIsSavingConteudo(false);
    }
  };

  const handleSalvarAvaliacao = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    const nota = Number(formAvaliacao.notaMaxima);
    if (!formAvaliacao.tipoAvaliacao.trim() || Number.isNaN(nota)) {
      toast.error("Informe o tipo da avaliação e uma nota máxima válida.");
      return;
    }

    const perguntasAtivas = perguntasForm
      .filter((p) => p.enunciado.trim())
      .map((p) => ({
        enunciado: p.enunciado.trim(),
        peso: Number(p.peso),
        id: p.id,
      }))
      .filter((p) => !Number.isNaN(p.peso));

    const pesoTotal = perguntasAtivas.reduce((acc, p) => acc + p.peso, 0);
    const possuiPerguntas = perguntasAtivas.length > 0;

    if (possuiPerguntas && Math.abs(pesoTotal - nota) > 0.001) {
      toast.error("A soma dos pesos das perguntas deve ser igual à nota máxima.");
      return;
    }

    setIsSavingAvaliacao(true);
    try {
      const payload = {
        cursoId: Number(id),
        tipoAvaliacao: formAvaliacao.tipoAvaliacao.trim(),
        notaMaxima: nota,
        dataLimite: formAvaliacao.dataLimite
          ? new Date(formAvaliacao.dataLimite).toISOString()
          : new Date().toISOString(),
        perguntas: perguntasAtivas.map(({ enunciado, peso }) => ({ enunciado, peso })),
      };

      const isEditing = editingAvaliacaoId !== null;
      const resposta =
        isEditing && editingAvaliacaoId !== null
          ? await avaliacoesApi.update(id, editingAvaliacaoId.toString(), payload)
          : await avaliacoesApi.create(id, payload);

      setAvaliacoes((prev) =>
        isEditing ? prev.map((item) => (item.id === resposta.id ? resposta : item)) : [resposta, ...prev],
      );

      toast.success(isEditing ? "Avaliação atualizada!" : "Avaliação criada!");
      resetAvaliacaoForm();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : editingAvaliacaoId !== null
            ? "Não foi possível atualizar a avaliação."
            : "Não foi possível criar a avaliação.";
      toast.error(message);
    } finally {
      setIsSavingAvaliacao(false);
    }
  };

  const handleAbrirAvaliacao = (avaliacaoId: number) => {
    setAvaliacaoAberta((prev) => (prev === avaliacaoId ? null : avaliacaoId));
  };

  const handleRespostaChange = (avaliacao: Avaliacao, index: number, value: string) => {
    setRespostasAluno((prev) => {
      const existentes = prev[avaliacao.id] ?? new Array(avaliacao.perguntas?.length ?? 0).fill("");
      const atualizadas = [...existentes];
      atualizadas[index] = value;
      return { ...prev, [avaliacao.id]: atualizadas };
    });
  };

  const handleEnviarRespostas = async (avaliacao: Avaliacao) => {
    if (!id) return;
    const perguntas = avaliacao.perguntas ?? [];
    const respostas = respostasAluno[avaliacao.id] ?? new Array(perguntas.length).fill("");
    const anexo = anexosPorAvaliacao[avaliacao.id] ?? null;

    if (perguntas.length > 0) {
      const faltando = perguntas.some((_, idx) => !(respostas[idx]?.trim()));
      if (faltando) {
        toast.error("Responda todas as perguntas antes de enviar.");
        return;
      }
      if (perguntas.some((p) => !p.id)) {
        toast.error("Perguntas sem id retornado pelo servidor. Recarregue a página.");
        return;
      }
    }

    if (perguntas.length === 0 && !anexo) {
      toast.error("Envie um arquivo do trabalho para registrar a realização.");
      return;
    }

    const payload: RealizacaoPayload | FormData =
      perguntas.length > 0
        ? {
            respostas: perguntas.map((pergunta, idx) => ({
              perguntaId: pergunta.id!,
              resposta: respostas[idx] ?? "",
            })),
          }
        : (() => {
            const formData = new FormData();
            formData.append("arquivo", anexo as File);
            formData.append("dados", new Blob([JSON.stringify({ respostas: [] })], { type: "application/json" }));
            return formData;
          })();

    try {
      await resultadosApi.registrarRealizacao(avaliacao.id.toString(), payload);
      toast.success("Realização registrada!");
      const notas = await resultadosApi.getMinhasNotas();
      setMinhasNotas(notas);
      setAvaliacaoAberta(null);
      setAnexosPorAvaliacao((prev) => ({ ...prev, [avaliacao.id]: null }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível registrar.";
      toast.error(message);
    }
  };

  const handleDownloadConteudo = async (conteudo: Conteudo) => {
    if (!conteudo.arquivoUrl) return;
    setIsDownloadingConteudoId(conteudo.id);
    try {
      const response = await fetch(conteudo.arquivoUrl, { credentials: "include" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = conteudo.arquivoNome || conteudo.titulo || "arquivo";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível baixar o arquivo.";
      toast.error(message);
    } finally {
      setIsDownloadingConteudoId(null);
    }
  };

  const handleDownloadPreview = async () => {
    if (!previewConteudo?.arquivoUrl) return;
    setIsDownloadingPreview(true);
    try {
      const response = await fetch(previewConteudo.arquivoUrl, { credentials: "include" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = previewConteudo.arquivoNome || previewConteudo.titulo || "arquivo";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível baixar o arquivo.";
      toast.error(message);
    } finally {
      setIsDownloadingPreview(false);
    }
  };

  if (isLoadingCurso) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Curso não encontrado</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const isProfessor = user?.tipo === "professor" || user?.tipo === "admin";
  const podeMatricular = !isProfessor && !isMatriculado;
  const dataCriacaoLabel = curso.dataCriacao.toLocaleDateString();

  const hasConteudos = conteudos.length > 0;
  const hasAvaliacoes = avaliacoes.length > 0;
  const isEditingConteudo = editingConteudoId !== null;
  const isEditingAvaliacao = editingAvaliacaoId !== null;
  const arquivoAtualNome = conteudoArquivo?.name ?? formConteudo.arquivoNome;
  const possuiArquivoAtual = Boolean(arquivoAtualNome);
  const notaMaximaNumber = Number(formAvaliacao.notaMaxima) || 0;
  const perguntasAtivas = perguntasForm.filter(
    (p) => p.enunciado.trim() && !Number.isNaN(Number(p.peso)),
  );
  const pesoTotal = perguntasAtivas.reduce((acc, p) => acc + Number(p.peso), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{curso.titulo}</h1>
            <p className="text-lg text-muted-foreground mb-4">{curso.descricao}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Publicado em {dataCriacaoLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Professor: {curso.professor?.nome}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isProfessor && (
              <Button variant="secondary" onClick={() => navigate(`/curso/${id}/notas`)}>
                <ListOrdered className="mr-2 h-4 w-4" />
                Gerenciar notas
              </Button>
            )}
            {podeMatricular && (
              <Button size="lg" onClick={handleMatricula}>
                Matricular-se
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="conteudos" className="w-full">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="conteudos">Conteúdos</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            {isProfessor && <TabsTrigger value="alunos">Ações do professor</TabsTrigger>}
          </TabsList>

          <TabsContent value="conteudos" className="mt-6 space-y-6">
            {isProfessor && (
              <Card>
                <CardHeader>
                  <CardTitle>{isEditingConteudo ? "Editar conteúdo" : "Adicionar conteúdo"}</CardTitle>
                  {isEditingConteudo && (
                    <CardDescription>
                      Você está editando um conteúdo existente. Salve para aplicar as alterações ou cancele
                      para descartar.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSalvarConteudo}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="tituloConteudo">Título</Label>
                        <Input
                          id="tituloConteudo"
                          value={formConteudo.titulo}
                          onChange={(event) =>
                            setFormConteudo((prev) => ({ ...prev, titulo: event.target.value }))
                          }
                          placeholder="Introdução ao módulo 1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <Select
                          value={formConteudo.formatoOriginal}
                          onValueChange={(value) =>
                            setFormConteudo((prev) => ({ ...prev, formatoOriginal: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o formato" />
                          </SelectTrigger>
                          <SelectContent>
                            {formatosDisponiveis.map((formato) => (
                              <SelectItem key={formato.value} value={formato.value}>
                                {formato.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Ao anexar um arquivo, o formato é ajustado automaticamente.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricaoConteudo">Descrição</Label>
                      <Textarea
                        id="descricaoConteudo"
                        value={formConteudo.descricao}
                        onChange={(event) =>
                          setFormConteudo((prev) => ({ ...prev, descricao: event.target.value }))
                        }
                        placeholder="Resumo do conteúdo disponibilizado."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="arquivoConteudo">Arquivo (PDF, PPTX, MP4 ou imagem)</Label>
                      <Input
                        ref={arquivoInputRef}
                        id="arquivoConteudo"
                        type="file"
                        accept=".pdf,.ppt,.pptx,.mp4,.png,.jpg,.jpeg,.gif"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (!file) {
                            setConteudoArquivo(null);
                            return;
                          }
                          const extensao = extrairExtensao(file.name);
                          if (!extensao || !extensoesSuportadas.includes(extensao)) {
                            toast.error("Formato não suportado. Use PDF, PPTX, MP4 ou imagem.");
                            event.target.value = "";
                            setConteudoArquivo(null);
                            return;
                          }
                          setConteudoArquivo(file);
                          setFormConteudo((prev) => ({
                            ...prev,
                            formatoOriginal: extensao,
                            arquivoNome: file.name,
                            arquivoTipo: file.type,
                            arquivoUrl: "",
                          }));
                        }}
                      />
                      {possuiArquivoAtual && (
                        <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs">
                          <span className="flex items-center gap-2">
                            <Upload className="h-3 w-3" />
                            {arquivoAtualNome}
                          </span>
                          <button
                            type="button"
                            aria-label="Remover arquivo"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              if (arquivoInputRef.current) {
                                arquivoInputRef.current.value = "";
                              }
                              setConteudoArquivo(null);
                              setFormConteudo((prev) => ({
                                ...prev,
                                formatoOriginal: "pdf",
                                arquivoNome: "",
                                arquivoTipo: "",
                                arquivoUrl: "",
                              }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        O arquivo será hospedado na plataforma e exibido aos alunos.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conteudoLink">Link ou conteúdo online (opcional)</Label>
                      <Input
                        id="conteudoLink"
                        value={formConteudo.conteudo}
                        onChange={(event) =>
                          setFormConteudo((prev) => ({ ...prev, conteudo: event.target.value }))
                        }
                        placeholder="https://... (vídeo, documento online, etc.)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Informe um link válido ou texto complementar. Obrigatório caso não envie um arquivo.
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      {isEditingConteudo && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelarEdicaoConteudo}
                          disabled={isSavingConteudo}
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button type="submit" disabled={isSavingConteudo}>
                        {isSavingConteudo
                          ? "Salvando..."
                          : isEditingConteudo
                            ? "Atualizar conteúdo"
                            : "Adicionar conteúdo"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {hasConteudos ? (
              <div className="space-y-4">
                {formattedConteudos.map((conteudo) => (
                  <Card key={conteudo.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{conteudo.titulo}</CardTitle>
                            <CardDescription className="capitalize">
                              Formato: {conteudo.formatoOriginal?.toLowerCase() ?? conteudo.formatoLabel}
                            </CardDescription>
                          </div>
                        </div>
                        {isProfessor ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleEditarConteudo(conteudo)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleExcluirConteudo(conteudo.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </Button>
                          </div>
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{conteudo.descricao}</p>
                      {conteudo.conteudoAdaptado && conteudo.conteudoAdaptadoTipo === "TEXT" && (
                        <p className="text-sm">{conteudo.conteudoAdaptado}</p>
                      )}
                      {conteudo.arquivoUrl && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => setPreviewConteudo(conteudo)}>
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDownloadingConteudoId === conteudo.id}
                            onClick={() => handleDownloadConteudo(conteudo)}
                          >
                            {isDownloadingConteudoId === conteudo.id ? "Baixando..." : "Baixar"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardDescription>Nenhum conteúdo disponível ainda</CardDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="avaliacoes" className="mt-6 space-y-6">
            {isProfessor && (
              <Card>
                <CardHeader>
                  <CardTitle>{isEditingAvaliacao ? "Editar avaliação" : "Nova avaliação"}</CardTitle>
                  {isEditingAvaliacao && (
                    <CardDescription>
                      Atualize os dados da avaliação selecionada ou cancele para manter as informações atuais.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSalvarAvaliacao}>
                    <div className="space-y-2">
                      <Label htmlFor="tipoAvaliacao">Tipo</Label>
                      <Input
                        id="tipoAvaliacao"
                        value={formAvaliacao.tipoAvaliacao}
                        onChange={(event) =>
                          setFormAvaliacao((prev) => ({
                            ...prev,
                            tipoAvaliacao: event.target.value,
                          }))
                        }
                        placeholder="Prova 1, Trabalho final..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notaMaxima">Nota máxima</Label>
                      <Input
                        id="notaMaxima"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formAvaliacao.notaMaxima}
                        onChange={(event) =>
                          setFormAvaliacao((prev) => ({
                            ...prev,
                            notaMaxima: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="dataLimite">Data limite</Label>
                      <Input
                        id="dataLimite"
                        type="datetime-local"
                        value={formAvaliacao.dataLimite}
                        onChange={(event) =>
                          setFormAvaliacao((prev) => ({
                            ...prev,
                            dataLimite: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="md:col-span-2 space-y-3 rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ClipboardList className="h-4 w-4" />
                        Perguntas da avaliação (somatório precisa fechar a nota máxima)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total atual: {pesoTotal} / {notaMaximaNumber || "?"}
                      </div>
                      <div className="space-y-3">
                        {perguntasForm.map((pergunta, idx) => (
                          <div key={idx} className="grid gap-3 md:grid-cols-[1fr,120px] items-start">
                            <div className="space-y-1">
                              <Label>Pergunta {idx + 1}</Label>
                              <Textarea
                                value={pergunta.enunciado}
                                placeholder="Enunciado da pergunta"
                                onChange={(event) =>
                                  setPerguntasForm((prev) => {
                                    const atual = [...prev];
                                    atual[idx] = { ...atual[idx], enunciado: event.target.value };
                                    return atual;
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Peso</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={pergunta.peso}
                                onChange={(event) =>
                                  setPerguntasForm((prev) => {
                                    const atual = [...prev];
                                    atual[idx] = { ...atual[idx], peso: event.target.value };
                                    return atual;
                                  })
                                }
                              />
                              {perguntasForm.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="text-xs text-red-600 p-0"
                                  onClick={() =>
                                    setPerguntasForm((prev) => prev.filter((_, index) => index !== idx))
                                  }
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPerguntasForm((prev) => [...prev, perguntaVazia()])}
                        >
                          Adicionar pergunta
                        </Button>
                      </div>
                      {perguntasAtivas.length > 0 && Math.abs(pesoTotal - notaMaximaNumber) > 0.001 && (
                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
                          <Info className="h-4 w-4" />
                          A soma dos pesos precisa ser igual à nota máxima para salvar.
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2">
                      {isEditingAvaliacao && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelarEdicaoAvaliacao}
                          disabled={isSavingAvaliacao}
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button type="submit" disabled={isSavingAvaliacao}>
                        {isSavingAvaliacao
                          ? "Salvando..."
                          : isEditingAvaliacao
                            ? "Atualizar avaliação"
                            : "Publicar avaliação"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {hasAvaliacoes ? (
              <div className="space-y-4">
                {avaliacoes.map((avaliacao) => {
                  const resultado = minhasNotas.find((nota) => nota.avaliacaoId === avaliacao.id);
                  const concluida = Boolean(resultado?.realizado);
                  const podeResponder = !isProfessor && isMatriculado;
                  const perguntas = avaliacao.perguntas ?? [];
                  const respostas = respostasAluno[avaliacao.id] ?? new Array(perguntas.length).fill("");

                  return (
                    <Card key={avaliacao.id} className={concluida ? "border-green-200" : undefined}>
                      <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{avaliacao.tipoAvaliacao}</CardTitle>
                          <CardDescription>
                            Nota máxima: {avaliacao.notaMaxima} | Prazo:{" "}
                            {avaliacao.dataLimite.toLocaleDateString()}
                          </CardDescription>
                          {perguntas.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {perguntas.length} pergunta(s) - pesos somam{" "}
                              {perguntas.reduce((acc, p) => acc + p.peso, 0)}
                            </p>
                          )}
                        </div>
                        {isProfessor ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleEditarAvaliacao(avaliacao)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleExcluirAvaliacao(avaliacao.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant={concluida ? "outline" : "default"}
                            size="sm"
                            className={`gap-2 ${
                              concluida ? "border-green-500 text-green-600 hover:bg-green-50" : ""
                            }`}
                            disabled={!podeResponder || concluida || isLoadingNotas}
                            onClick={() => handleAbrirAvaliacao(avaliacao.id)}
                          >
                            {concluida ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Realizada
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                {perguntas.length ? "Responder" : "Registrar realização"}
                              </>
                            )}
                          </Button>
                        )}
                      </CardHeader>

                      {!isProfessor && avaliacaoAberta === avaliacao.id && (
                        <CardContent className="space-y-4">
                          {perguntas.length === 0 ? (
                            <div className="flex flex-col gap-3">
                              <p className="text-sm text-muted-foreground">
                                Esta avaliação não possui perguntas. Envie o arquivo da sua entrega para registrar
                                a realização.
                              </p>
                              <div className="space-y-2">
                                <Label>Anexo do trabalho</Label>
                                <Input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.rar,.png,.jpg,.jpeg"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    setAnexosPorAvaliacao((prev) => ({ ...prev, [avaliacao.id]: file }));
                                  }}
                                  disabled={concluida}
                                />
                                {anexosPorAvaliacao[avaliacao.id] && (
                                  <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs">
                                    <span className="truncate">
                                      {anexosPorAvaliacao[avaliacao.id]?.name}
                                    </span>
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        setAnexosPorAvaliacao((prev) => ({ ...prev, [avaliacao.id]: null }));
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Formatos aceitos: pdf, docx, pptx, planilhas, zip/rar, imagens.
                                </p>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setAvaliacaoAberta(null)}>
                                  Cancelar
                                </Button>
                                <Button onClick={() => handleEnviarRespostas(avaliacao)} disabled={concluida}>
                                  Registrar realização
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-sm text-muted-foreground">
                                Responda e envie para registrar sua realização.
                              </div>
                              {perguntas.map((pergunta, idx) => (
                                <div key={pergunta.id ?? idx} className="space-y-2">
                                  <Label className="font-semibold">
                                    {idx + 1}. {pergunta.enunciado} (peso {pergunta.peso})
                                  </Label>
                                  <Textarea
                                    value={respostas[idx] ?? ""}
                                    placeholder="Sua resposta"
                                    onChange={(event) =>
                                      handleRespostaChange(avaliacao, idx, event.target.value)
                                    }
                                    disabled={concluida}
                                  />
                                </div>
                              ))}
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setAvaliacaoAberta(null)}>
                                  Cancelar
                                </Button>
                                <Button onClick={() => handleEnviarRespostas(avaliacao)} disabled={concluida}>
                                  Enviar respostas
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardDescription>Nenhuma avaliação disponível</CardDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isProfessor && (
            <TabsContent value="alunos" className="mt-6 space-y-4">
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <CardDescription>
                    Utilize o painel de notas para acompanhar o desempenho e lançar notas.
                  </CardDescription>
                  <Button variant="secondary" onClick={() => navigate(`/curso/${id}/notas`)}>
                    Abrir painel de notas
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {previewConteudo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-6xl h-[92vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b">
              <h3 className="text-lg font-semibold leading-tight">{previewConteudo.titulo}</h3>
            </div>

            <div className="flex-1 bg-neutral-50 overflow-auto">
              {previewConteudo.arquivoUrl ? (
                <iframe
                  title={previewConteudo.titulo}
                  src={previewConteudo.arquivoUrl}
                  className="w-full h-full border-0"
                />
              ) : previewConteudo.conteudoAdaptado && previewConteudo.conteudoAdaptadoTipo === "HTML" ? (
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: previewConteudo.conteudoAdaptado }}
                />
              ) : previewConteudo.conteudoAdaptado && previewConteudo.conteudoAdaptadoTipo === "TEXT" ? (
                <div className="w-full h-full overflow-auto whitespace-pre-wrap text-sm bg-white p-4">
                  {previewConteudo.conteudoAdaptado}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Nenhum conteúdo para exibir.</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-white px-5 py-3">
              {previewConteudo.arquivoUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={previewConteudo.arquivoUrl} target="_blank" rel="noreferrer">
                    Abrir em nova aba
                  </a>
                </Button>
              )}
              {previewConteudo.arquivoUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPreview}
                  disabled={isDownloadingPreview}
                >
                  {isDownloadingPreview ? "Baixando..." : "Baixar"}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setPreviewConteudo(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;