import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, BookOpen } from 'lucide-react';

interface CourseCardProps {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria?: number;
  totalAlunos?: number;
  onSelect: (id: string) => void;
}

export const CourseCard = ({ id, titulo, descricao, cargaHoraria, totalAlunos, onSelect }: CourseCardProps) => {
  return (
    <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer" onClick={() => onSelect(id)}>
      <CardHeader>
        <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center">
          <BookOpen className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="line-clamp-2">{titulo}</CardTitle>
        <CardDescription className="line-clamp-3">{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {cargaHoraria && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{cargaHoraria}h</span>
            </div>
          )}
          {totalAlunos !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{totalAlunos} alunos</span>
            </div>
          )}
        </div>
        <Button className="w-full" onClick={() => onSelect(id)}>
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
};
