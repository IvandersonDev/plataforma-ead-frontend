import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { BookOpen, Users, Award } from 'lucide-react';
import { toast } from 'sonner';
import type { Curso } from '@/types';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Aprenda sem Limites
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Plataforma completa de educação online com os melhores cursos e professores
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/registro')}>
                Comece Agora
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-2">500+</h3>
              <p className="text-muted-foreground">Cursos Disponíveis</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
                <Users className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-3xl font-bold mb-2">10k+</h3>
              <p className="text-muted-foreground">Alunos Ativos</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-3xl font-bold mb-2">95%</h3>
              <p className="text-muted-foreground">Taxa de Satisfação</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Catálogo de Cursos</h2>
            <p className="text-xl text-muted-foreground">
              Explore nossa seleção de cursos de alta qualidade
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : cursos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum curso disponível no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursos.map((curso) => (
                <CourseCard
                  key={curso.id}
                  id={curso.id}
                  titulo={curso.titulo}
                  descricao={curso.descricao}
                  professorNome={curso.professor?.nome}
                  dataCriacao={curso.dataCriacao}
                  onSelect={(id) => navigate(`/curso/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
