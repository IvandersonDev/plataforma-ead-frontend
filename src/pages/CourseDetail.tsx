import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Clock, Users, BookOpen, FileText, CheckCircle } from 'lucide-react';

interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: number;
  professorNome?: string;
}

interface Conteudo {
  id: string;
  titulo: string;
  tipo: string;
  ordem: number;
}

interface Avaliacao {
  id: string;
  titulo: string;
  dataLimite: string;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatriculado, setIsMatriculado] = useState(false);

  useEffect(() => {
    if (id) {
      loadCurso();
      loadConteudos();
      loadAvaliacoes();
    }
  }, [id]);

  const loadCurso = async () => {
    try {
      const data = await api.getCurso(id!);
      setCurso(data);
    } catch (error) {
      toast.error('Erro ao carregar curso');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConteudos = async () => {
    try {
      const data = await api.getConteudos(id!);
      setConteudos(data);
    } catch (error) {
      console.error('Erro ao carregar conteúdos');
    }
  };

  const loadAvaliacoes = async () => {
    try {
      const data = await api.getAvaliacoes(id!);
      setAvaliacoes(data);
    } catch (error) {
      console.error('Erro ao carregar avaliações');
    }
  };

  const handleMatricula = async () => {
    try {
      await api.matricular(id!);
      setIsMatriculado(true);
      toast.success('Matrícula realizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao matricular no curso');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <Button className="mt-4" onClick={() => navigate('/')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const isProfessor = user?.tipo === 'professor';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{curso.titulo}</h1>
              <p className="text-lg text-muted-foreground mb-4">{curso.descricao}</p>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{curso.cargaHoraria}h</span>
                </div>
                {curso.professorNome && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Prof. {curso.professorNome}</span>
                  </div>
                )}
              </div>
            </div>

            {!isProfessor && !isMatriculado && (
              <Button size="lg" onClick={handleMatricula}>
                Matricular-se
              </Button>
            )}
          </div>
        </div>

        {/* Course Content */}
        <Tabs defaultValue="conteudos" className="w-full">
          <TabsList>
            <TabsTrigger value="conteudos">Conteúdos</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            {isProfessor && <TabsTrigger value="alunos">Alunos</TabsTrigger>}
          </TabsList>

          <TabsContent value="conteudos" className="mt-6">
            {conteudos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardDescription>Nenhum conteúdo disponível ainda</CardDescription>
                  {isProfessor && (
                    <Button className="mt-4">Adicionar Conteúdo</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {conteudos.map((conteudo) => (
                  <Card key={conteudo.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{conteudo.titulo}</CardTitle>
                            <CardDescription className="capitalize">{conteudo.tipo}</CardDescription>
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="avaliacoes" className="mt-6">
            {avaliacoes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardDescription>Nenhuma avaliação disponível</CardDescription>
                  {isProfessor && (
                    <Button className="mt-4">Criar Avaliação</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {avaliacoes.map((avaliacao) => (
                  <Card key={avaliacao.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{avaliacao.titulo}</CardTitle>
                      <CardDescription>
                        Prazo: {new Date(avaliacao.dataLimite).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {isProfessor && (
            <TabsContent value="alunos" className="mt-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardDescription>Lista de alunos matriculados</CardDescription>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
