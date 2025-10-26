import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'aluno' | 'professor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo: 'aluno' | 'professor';
  anexo?: File;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao fazer login');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async (registerData: RegisterData) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const formData = new FormData();
    
    formData.append('nome', registerData.nome);
    formData.append('email', registerData.email);
    formData.append('senha', registerData.senha);
    formData.append('tipo', registerData.tipo);
    
    if (registerData.anexo) {
      formData.append('anexo', registerData.anexo);
    }

    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao cadastrar');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
