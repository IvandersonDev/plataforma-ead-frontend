import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: rota inexistente", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-foreground mb-2">
          Página não encontrada
        </h2>
        <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            size="lg"
          >
            Voltar
          </Button>
          <Button 
            onClick={() => window.location.href = "/"} 
            size="lg"
          >
            Ir para a página inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;