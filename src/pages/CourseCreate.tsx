import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cursosApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';

const CourseCreate = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      toast.error('Preencha titulo e descricao do curso.');
      return;
    }
    setIsSubmitting(true);
    try {
      const curso = await cursosApi.create({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        imagemUrl: imagemUrl.trim() || null,
      });
      toast.success('Curso criado com sucesso!');
      navigate(`/curso/${curso.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel criar o curso.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Criar novo curso</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Introducao a Programacao"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descreva os objetivos do curso."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagemUrl">Imagem (opcional)</Label>
                <Input
                  id="imagemUrl"
                  value={imagemUrl}
                  onChange={(event) => setImagemUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Criar curso'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseCreate;
