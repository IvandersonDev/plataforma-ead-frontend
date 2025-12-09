import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, BookOpen } from 'lucide-react';

interface CourseCardProps {
  id: number;
  titulo: string;
  descricao: string;
  professorNome?: string;
  dataCriacao?: Date;
  imagemUrl?: string | null;
  onSelect: (id: number) => void;
}

const resolveImagemUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

export const CourseCard = ({
  id,
  titulo,
  descricao,
  professorNome,
  dataCriacao,
  imagemUrl,
  onSelect,
}: CourseCardProps) => {
  const dataCriacaoLabel = dataCriacao
    ? dataCriacao.toLocaleDateString()
    : undefined;
  const capa = resolveImagemUrl(imagemUrl);

  const handleClick = () => onSelect(id);

  return (
    <Card
      className="h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader>
        {capa ? (
          <div className="w-full h-40 rounded-lg mb-4 overflow-hidden bg-muted">
            <img
              src={capa}
              alt={`Capa do curso ${titulo}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
        )}
        <CardTitle className="line-clamp-2">{titulo}</CardTitle>
        <CardDescription className="line-clamp-3">{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {professorNome && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{professorNome}</span>
            </div>
          )}
          {dataCriacaoLabel && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{dataCriacaoLabel}</span>
            </div>
          )}
        </div>
        <Button className="w-full" onClick={handleClick}>
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
};
