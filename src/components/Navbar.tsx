import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            EduPlatform
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              {user?.tipo === 'aluno' && (
                <Link to="/minhas-notas">
                  <Button variant="ghost" size="sm">Minhas notas</Button>
                </Link>
              )}
              {(user?.tipo === 'professor' || user?.tipo === 'admin') && (
                <Link to="/cursos/novo">
                  <Button variant="ghost" size="sm">Novo curso</Button>
                </Link>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Ola,</span>
                <span className="font-medium">{user?.nome}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/registro">
                <Button size="sm">Cadastre-se</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
