import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, conteudosApi, avaliacoesApi } from '@/services/api';
import type { Avaliacao, Conteudo, Curso } from '@/types';
import { toast } from 'sonner';
import { Calendar, Users, BookOpen, FileText, CheckCircle, ListOrdered, Upload, X } from 'lucide-react';

const formatosDisponiveis = [
  { value: 'pdf', label: 'PDF' },
  { value: 'ppt', label: 'Apresentacao (PPT)' },
  { value: 'pptx', label: 'Apresentacao (PPTX)' },
  { value: 'mp4', label: 'Video (MP4)' },
  { value: 'png', label: 'Imagem (PNG)' },
  { value: 'jpg', label: 'Imagem (JPG)' },
  { value: 'jpeg', label: 'Imagem (JPEG)' },
  { value: 'gif', label: 'Imagem (GIF)' },
  { value: 'link', label: 'Link/Embed' },
  { value: 'text', label: 'Texto' },
];

const extensoesSuportadas = ['pdf', 'ppt', 'pptx', 'mp4', 'png', 'jpg', 'jpeg', 'gif'];

const extrairExtensao = (nome: string) => {
  const partes = nome.toLowerCase().split('.');
  return partes.length > 1 ? partes.pop() ?? '' : '';
};

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoadingCurso, setIsLoadingCurso] = useState(true);
  const [isMatriculado, setIsMatriculado] = useState(false);

  const [formConteudo, setFormConteudo] = useState({
    titulo: '',
    descricao: '',
    formatoOriginal: 'pdf',
    conteudo: '',
  });
  const [conteudoArquivo, setConteudoArquivo] = useState<File | null>(null);
  const arquivoInputRef = useRef<HTMLInputElement | null>(null);
  const [formAvaliacao, setFormAvaliacao] = useState({
    tipoAvaliacao: '',
    notaMaxima: '',
    dataLimite: '',
  });
  const [isSavingConteudo, setIsSavingConteudo] = useState(false);
  const [isSavingAvaliacao, setIsSavingAvaliacao] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    void loadCurso(id);
    void loadConteudos(id);
    void loadAvaliacoes(id);
  }, [id]);

  const loadCurso = async (cursoId: string) => {
    setIsLoadingCurso(true);
    try {
      const data = await api.getCurso(cursoId);
      setCurso(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar curso.';
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
      console.warn('Erro ao carregar conteudos', error);
    }
  };

  const loadAvaliacoes = async (cursoId: string) => {
    try {
      const data = await api.getAvaliacoes(cursoId);
      setAvaliacoes(data);
    } catch (error) {
      console.warn('Erro ao carregar avaliacoes', error);
    }
  };

  const handleMatricula = async () => {
    if (!id) return;
    try {
      await api.matricular(id);
      setIsMatriculado(true);
      toast.success('Matricula realizada com sucesso!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao matricular no curso.';
      if (message.toLowerCase().includes('ja matriculado')) {
        setIsMatriculado(true);
        toast.info('Voce ja esta matriculado neste curso.');
        return;
      }
      toast.error(message);
    }
  };

  const handleSalvarConteudo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    if (!formConteudo.titulo.trim() || !formConteudo.descricao.trim()) {
      toast.error('Informe titulo e descricao do conteudo.');
      return;
    }

    const arquivo = conteudoArquivo;
    const linkOuTexto = formConteudo.conteudo.trim();

    if (!arquivo && !linkOuTexto) {
      toast.error('Envie um arquivo ou informe um link/conteudo.');
      return;
    }

    let formato = formConteudo.formatoOriginal || 'text';
    let arquivoNome: string | null = null;
    let arquivoTipo: string | null = null;

    if (arquivo) {
      const extensao = extrairExtensao(arquivo.name);
      if (!extensao || !extensoesSuportadas.includes(extensao)) {
        toast.error('Formato de arquivo nao suportado. Use PDF, PPTX, MP4 ou imagem.');
        return;
      }
      formato = extensao;
      arquivoNome = arquivo.name;
      arquivoTipo = arquivo.type;
    }

    setIsSavingConteudo(true);
    try {
      const conteudoTexto = linkOuTexto || null;
      const ehUrl = linkOuTexto ? /^https?:\/\//i.test(linkOuTexto) : false;
      const dados = {
        cursoId: Number(id),
        titulo: formConteudo.titulo.trim(),
        descricao: formConteudo.descricao.trim(),
        formatoOriginal: formato,
        conteudo: conteudoTexto,
        arquivoUrl: !arquivo && ehUrl ? linkOuTexto : null,
        arquivoNome: arquivoNome ?? undefined,
        arquivoTipo: arquivoTipo ?? undefined,
      };

      const formData = new FormData();
      formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
      if (arquivo) {
        formData.append('arquivo', arquivo);
      }

      const criado = await conteudosApi.create(id, formData);
      setConteudos((prev) => [criado, ...prev]);
      toast.success('Conteudo adicionado!');
      setFormConteudo({
        titulo: '',
        descricao: '',
        formatoOriginal: 'pdf',
        conteudo: '',
      });
      setConteudoArquivo(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel adicionar o conteudo.';
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
      toast.error('Informe o tipo da avaliacao e uma nota maxima valida.');
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
      };
      const criada = await avaliacoesApi.create(id, payload);
      setAvaliacoes((prev) => [criada, ...prev]);
      toast.success('Avaliacao criada!');
      setFormAvaliacao({
        tipoAvaliacao: '',
        notaMaxima: '',
        dataLimite: '',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel criar a avaliacao.';
      toast.error(message);
    } finally {
      setIsSavingAvaliacao(false);
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
          <p className="text-muted-foreground">Curso nao encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const isProfessor = user?.tipo === 'professor' || user?.tipo === 'admin';
  const podeMatricular = !isProfessor && !isMatriculado;
  const dataCriacaoLabel = curso.dataCriacao.toLocaleDateString();

  const hasConteudos = conteudos.length > 0;
  const hasAvaliacoes = avaliacoes.length > 0;

  const formattedConteudos = useMemo(
    () =>
      conteudos.map((conteudo) => {
        const formato = conteudo.formatoOriginal?.toLowerCase();
        let label = 'Texto';
        if (formato === 'pdf') {
          label = 'PDF';
        } else if (formato === 'ppt' || formato === 'pptx') {
          label = 'Apresentacao';
        } else if (formato === 'mp4' || formato === 'video' || formato === 'link') {
          label = 'Video';
        } else if (formato === 'text') {
          label = 'Texto';
        } else if (formato && ['png', 'jpg', 'jpeg', 'gif', 'image'].includes(formato)) {
          label = 'Imagem';
        } else if (formato && formato !== '') {
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
            <TabsTrigger value="conteudos">Conteudos</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliacoes</TabsTrigger>
            {isProfessor && <TabsTrigger value="alunos">Acoes do professor</TabsTrigger>}
          </TabsList>

          <TabsContent value="conteudos" className="mt-6 space-y-6">
            {isProfessor && (
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar conteudo</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSalvarConteudo}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="tituloConteudo">Titulo</Label>
                          <Input
                            id="tituloConteudo"
                            value={formConteudo.titulo}
                            onChange={(event) =>
                              setFormConteudo((prev) => ({ ...prev, titulo: event.target.value }))
                            }
                            placeholder="Introducao ao modulo 1"
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
                        <Label htmlFor="descricaoConteudo">Descricao</Label>
                        <Textarea
                          id="descricaoConteudo"
                          value={formConteudo.descricao}
                          onChange={(event) =>
                            setFormConteudo((prev) => ({ ...prev, descricao: event.target.value }))
                          }
                          placeholder="Resumo do conteudo disponibilizado."
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
                              toast.error('Formato nao suportado. Use PDF, PPTX, MP4 ou imagem.');
                              event.target.value = '';
                              setConteudoArquivo(null);
                              return;
                            }
                            setConteudoArquivo(file);
                            setFormConteudo((prev) => ({
                              ...prev,
                              formatoOriginal: extensao,
                            }));
                          }}
                        />
                        {conteudoArquivo && (
                          <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs">
                            <span className="flex items-center gap-2">
                              <Upload className="h-3 w-3" />
                              {conteudoArquivo.name}
                            </span>
                            <button
                              type="button"
                              aria-label="Remover arquivo"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                if (arquivoInputRef.current) {
                                  arquivoInputRef.current.value = '';
                                }
                                setConteudoArquivo(null);
                                setFormConteudo((prev) => ({ ...prev, formatoOriginal: 'pdf' }));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          O arquivo sera hospedado na plataforma e exibido aos alunos.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conteudoLink">
                          Link ou conteudo online (opcional)
                        </Label>
                        <Input
                          id="conteudoLink"
                          value={formConteudo.conteudo}
                          onChange={(event) =>
                            setFormConteudo((prev) => ({ ...prev, conteudo: event.target.value }))
                          }
                          placeholder="https://... (video, documento online, etc.)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Informe um link valido ou texto complementar. Obrigatorio caso nao envie um arquivo.
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingConteudo}>
                          {isSavingConteudo ? 'Salvando...' : 'Adicionar conteudo'}
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
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{conteudo.descricao}</p>
                        {conteudo.conteudoAdaptado &&
                          conteudo.conteudoAdaptadoTipo === 'HTML' && (
                            <div
                              className="mt-3 space-y-4 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: conteudo.conteudoAdaptado }}
                            />
                          )}
                        {conteudo.conteudoAdaptado &&
                          conteudo.conteudoAdaptadoTipo === 'TEXT' && (
                            <p className="text-sm">{conteudo.conteudoAdaptado}</p>
                          )}
                        {conteudo.arquivoUrl && (
                          <a
                            href={conteudo.arquivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                        >
                          Download do arquivo
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardDescription>Nenhum conteudo disponivel ainda</CardDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="avaliacoes" className="mt-6 space-y-6">
            {isProfessor && (
              <Card>
                <CardHeader>
                  <CardTitle>Nova avaliacao</CardTitle>
                </CardHeader>
                <CardContent>
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
                      <Label htmlFor="notaMaxima">Nota maxima</Label>
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
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" disabled={isSavingAvaliacao}>
                        {isSavingAvaliacao ? 'Salvando...' : 'Publicar avaliacao'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {hasAvaliacoes ? (
              <div className="space-y-4">
                {avaliacoes.map((avaliacao) => (
                  <Card key={avaliacao.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{avaliacao.tipoAvaliacao}</CardTitle>
                      <CardDescription>
                        Nota maxima: {avaliacao.notaMaxima} | Prazo:{' '}
                        {avaliacao.dataLimite.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardDescription>Nenhuma avaliacao disponivel</CardDescription>
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
                    Utilize o painel de notas para acompanhar o desempenho e lancar notas.
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
    </div>
  );
};

export default CourseDetail;
