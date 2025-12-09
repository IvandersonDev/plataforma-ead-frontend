import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, dashboardApi } from "@/services/api";
import type { Curso, DashboardResumo } from "@/types";
import { toast } from "sonner";
import { BookOpen, Plus, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [isLoadingCursos, setIsLoadingCursos] = useState(true);
  const navigate = useNavigate();
  const isProfessor = user?.tipo === "professor" || user?.tipo === "admin";

  useEffect(() => {
    loadCursos();
  }, []);

  useEffect(() => {
    if (isProfessor) {
      loadResumo();
    }
  }, [isProfessor]);

  const loadCursos = async () => {
    try {
      const data = await api.getCursos();
      setCursos(data);
    } catch (error) {
      toast.error("Erro ao carregar cursos");
    } finally {
      setIsLoadingCursos(false);
    }
  };

  const loadResumo = async () => {
    try {
      const data = await dashboardApi.getResumo();
      setResumo(data);
    } catch (error) {
      console.warn("Não foi possível carregar o resumo do dashboard", error);
    }
  };

  const cursosLabel = isProfessor ? "Cursos criados" : "Cursos disponíveis";
  const totalAlunos = resumo?.alunosMatriculados ?? 0;
  const totalAvaliacoes = resumo?.avaliacoesPublicadas ?? 0;
  const mediaNotas = resumo ? resumo.mediaNotasGerais.toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Olá, {user?.nome}!</h1>
          <p className="text-xl text-muted-foreground">
            {isProfessor ? "Gerencie seus cursos e alunos" : "Continue sua jornada de aprendizado"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{cursosLabel}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {isProfessor ? "Total de alunos" : "Avaliações publicadas"}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isProfessor ? totalAlunos : totalAvaliacoes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Média de notas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaNotas}</div>
            </CardContent>
          </Card>
        </div>

        {isProfessor && (
          <div className="mb-8">
            <Button size="lg" className="gap-2" onClick={() => navigate("/cursos/novo")}>
              <Plus className="h-5 w-5" />
              Criar novo curso
            </Button>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isProfessor ? "Meus cursos" : "Cursos disponíveis"}
          </h2>

          {isLoadingCursos ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : cursos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <BookOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <CardDescription>
                  {isProfessor
                    ? "Você ainda não criou nenhum curso. Utilize o botão acima para cadastrar o primeiro."
                    : "Você ainda não está matriculado em nenhum curso. Explore o catálogo!"}
                </CardDescription>
                {!isProfessor && (
                  <Button onClick={() => navigate("/")}>Explorar cursos</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursos.map((curso) => (
                <CourseCard
                  key={curso.id}
                  id={curso.id}
                  titulo={curso.titulo}
                  descricao={curso.descricao}
                  imagemUrl={curso.imagemUrl}
                  professorNome={curso.professor?.nome}
                  dataCriacao={curso.dataCriacao}
                  onSelect={(id) => navigate(`/curso/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;