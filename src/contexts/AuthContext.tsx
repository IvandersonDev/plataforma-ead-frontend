import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '@/services/api';
import type { RegisterPayload, Usuario } from '@/types';

type UserRole = 'aluno' | 'professor' | 'admin';

interface User {
  id: number;
  nome: string;
  email: string;
  tipo: UserRole;
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
  tipo?: 'aluno' | 'professor';
  anexo?: string | null;
  anexoFile?: File | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapTipoUsuario = (tipo: Usuario['tipoUsuario']): UserRole => {
  switch (tipo) {
    case 'PROFESSOR':
      return 'professor';
    case 'ADMINISTRADOR':
      return 'admin';
    default:
      return 'aluno';
  }
};

const mapUsuario = (usuario: Usuario): User => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  tipo: mapTipoUsuario(usuario.tipoUsuario),
});

const buildRegisterPayload = (data: RegisterData): RegisterPayload => {
  const anexoNormalizado = data.anexo?.trim();
  const tipoUsuario =
    data.tipo === 'professor'
      ? 'PROFESSOR'
      : data.tipo === 'aluno'
        ? 'ALUNO'
        : undefined;

  return {
    nome: data.nome,
    email: data.email,
    senha: data.senha,
    anexo: anexoNormalizado ? anexoNormalizado : null,
    ...(tipoUsuario && { tipoUsuario }),
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserRaw = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem('user');
      }
    }

    const hydrate = async () => {
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const usuario = await authApi.me();
        const mapped = mapUsuario(usuario);
        setUser(mapped);
        localStorage.setItem('user', JSON.stringify(mapped));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = async (email: string, senha: string) => {
    const { token: jwt } = await authApi.login(email, senha);
    localStorage.setItem('token', jwt);
    setToken(jwt);

    const usuario = await authApi.me();
    const mapped = mapUsuario(usuario);
    setUser(mapped);
    localStorage.setItem('user', JSON.stringify(mapped));
  };

  const register = async (registerData: RegisterData) => {
    const payload = buildRegisterPayload(registerData);
    const formData = new FormData();
    formData.append(
      'usuario',
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    );
    if (registerData.anexoFile) {
      formData.append('anexo', registerData.anexoFile);
    }

    await authApi.register(formData);
    await login(registerData.email, registerData.senha);
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
