import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cursosApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif']);

const CourseCreate = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!titulo.trim() || !descricao.trim()) {
      toast.error('Preencha titulo e descricao do curso.');
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      imagemUrl: imagemUrl.trim() || null,
    };

    const formData = new FormData();
    formData.append('dados', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (imagemArquivo) {
      formData.append('imagem', imagemArquivo);
    }

    setIsSubmitting(true);
    try {
      const curso = await cursosApi.create(formData);
      toast.success('Curso criado com sucesso!');
      navigate(`/curso/${curso.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel criar o curso.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImagemArquivo(null);
      return;
    }

    if (!allowedImageTypes.has(file.type)) {
      toast.error('Envie apenas imagens PNG, JPG ou GIF.');
      event.target.value = '';
      setImagemArquivo(null);
      return;
    }

    setImagemArquivo(file);
  };

  const handleRemoveFile = () => {
    setImagemArquivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
      <div className='container mx-auto px-4 py-8'>
        <Card className='max-w-2xl mx-auto'>
          <CardHeader>
            <CardTitle className='text-2xl'>Criar novo curso</CardTitle>
          </CardHeader>
          <CardContent>
            <form className='space-y-6' onSubmit={handleSubmit}>
              <div className='space-y-2'>
                <Label htmlFor='titulo'>Titulo</Label>
                <Input
                  id='titulo'
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder='Introducao a Programacao'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='descricao'>Descricao</Label>
                <Textarea
                  id='descricao'
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder='Descreva os objetivos do curso.'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label>Imagem do curso (opcional)</Label>
                <Input
                  ref={fileInputRef}
                  type='file'
                  accept='image/png,image/jpeg,image/jpg,image/gif'
                  onChange={handleFileChange}
                />
                {imagemArquivo && (
                  <div className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
                    <span className='flex items-center gap-2 truncate'>
                      <Upload className='h-4 w-4' />
                      {imagemArquivo.name}
                    </span>
                    <button
                      type='button'
                      onClick={handleRemoveFile}
                      className='text-muted-foreground hover:text-foreground'
                      aria-label='Remover imagem selecionada'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                )}
                <p className='text-xs text-muted-foreground'>
                  Formatos aceitos: PNG, JPG ou GIF. Este campo é opcional.
                </p>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='imagemUrl'>URL da imagem (opcional)</Label>
                <Input
                  id='imagemUrl'
                  value={imagemUrl}
                  onChange={(event) => setImagemUrl(event.target.value)}
                  placeholder='https://...'
                />
                <p className='text-xs text-muted-foreground'>
                  Caso prefira utilizar uma imagem hospedada, informe a URL acima.
                </p>
              </div>
              <div className='flex items-center justify-end gap-2'>
                <Button variant='outline' type='button' onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSubmitting}>
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
