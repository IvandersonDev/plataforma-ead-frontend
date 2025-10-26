import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { BookOpen, Plus, TrendingUp } from 'lucide-react';

interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCursos();
  }, []);

  const loadCursos = async () => {
    try {
      const data = await api.getCursos();
      setCursos(data);
    } catch (error) {
      toast.error('Erro ao carregar cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const isProfessor = user?.tipo === 'professor';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Olá, {user?.nome}!
          </h1>
          <p className="text-xl text-muted-foreground">
            {isProfessor ? 'Gerencie seus cursos e alunos' : 'Continue sua jornada de aprendizado'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {isProfessor ? 'Cursos Criados' : 'Cursos Matriculados'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {isProfessor ? 'Total de Alunos' : 'Horas Estudadas'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conclusão
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Section */}
        {isProfessor && (
          <div className="mb-8">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Criar Novo Curso
            </Button>
          </div>
        )}

        {/* Courses Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isProfessor ? 'Meus Cursos' : 'Cursos Disponíveis'}
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : cursos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardDescription>
                  {isProfessor 
                    ? 'Você ainda não criou nenhum curso. Comece criando seu primeiro curso!'
                    : 'Você ainda não está matriculado em nenhum curso. Explore o catálogo!'}
                </CardDescription>
                <Button className="mt-4" onClick={() => navigate('/')}>
                  {isProfessor ? 'Criar Curso' : 'Explorar Cursos'}
                </Button>
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
                  cargaHoraria={curso.cargaHoraria}
                  onSelect={(id) => navigate(`/curso/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
