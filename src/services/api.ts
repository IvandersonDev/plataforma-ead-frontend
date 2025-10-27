import type {
  Curso,
  CursoPayload,
  Conteudo,
  ConteudoPayload,
  Avaliacao,
  AvaliacaoPayload,
  Resultado,
  ResultadoPayload,
  DashboardResumo,
  LoginResponse,
  RegisterPayload,
  ApiError,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Helper para converter datas ISO 8601 para Date
const parseDates = <T extends Record<string, any>>(obj: T): T => {
  const dateFields = ['createdAt', 'updatedAt', 'dataLimite', 'dataMatricula'];
  const parsed = { ...obj };
  
  dateFields.forEach(field => {
    if (parsed[field] && typeof parsed[field] === 'string') {
      parsed[field] = new Date(parsed[field] as string) as any;
    }
  });
  
  return parsed;
};

// Client HTTP centralizado com interceptor
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Tratamento de erros 401/403 - redireciona para login
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      let errorMessage = 'Erro na requisição';
      
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.message || errorMessage;
        
        // Tratamento de erros de validação (422)
        if (response.status === 422 && errorData.errors) {
          const validationErrors = Object.values(errorData.errors).flat().join(', ');
          errorMessage = `Erro de validação: ${validationErrors}`;
        }
      } catch {
        // Se não conseguir parsear o JSON, usa mensagem padrão
        errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return parseDates(data);
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      ...(body && { body: JSON.stringify(body) }),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

const client = new ApiClient(API_BASE_URL);

// API de Autenticação
export const authApi = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    return client.post<LoginResponse>('/api/auth/login', { email, senha });
  },

  async register(data: RegisterPayload): Promise<LoginResponse> {
    return client.post<LoginResponse>('/api/auth/register', data);
  },
};

// API de Cursos
export const cursosApi = {
  async getAll(): Promise<Curso[]> {
    return client.get<Curso[]>('/api/cursos');
  },

  async getById(id: string): Promise<Curso> {
    return client.get<Curso>(`/api/cursos/${id}`);
  },

  async create(data: CursoPayload): Promise<Curso> {
    return client.post<Curso>('/api/cursos', data);
  },

  async update(id: string, data: CursoPayload): Promise<Curso> {
    return client.put<Curso>(`/api/cursos/${id}`, data);
  },

  async matricular(cursoId: string): Promise<void> {
    return client.post<void>(`/api/cursos/${cursoId}/matriculas`);
  },
};

// API de Conteúdos
export const conteudosApi = {
  async getByCurso(cursoId: string): Promise<Conteudo[]> {
    return client.get<Conteudo[]>(`/api/cursos/${cursoId}/conteudos`);
  },

  async getById(cursoId: string, conteudoId: string): Promise<Conteudo> {
    return client.get<Conteudo>(`/api/cursos/${cursoId}/conteudos/${conteudoId}`);
  },

  async create(cursoId: string, data: ConteudoPayload): Promise<Conteudo> {
    return client.post<Conteudo>(`/api/cursos/${cursoId}/conteudos`, data);
  },
};

// API de Avaliações
export const avaliacoesApi = {
  async getByCurso(cursoId: string): Promise<Avaliacao[]> {
    return client.get<Avaliacao[]>(`/api/cursos/${cursoId}/avaliacoes`);
  },

  async create(cursoId: string, data: AvaliacaoPayload): Promise<Avaliacao> {
    return client.post<Avaliacao>(`/api/cursos/${cursoId}/avaliacoes`, data);
  },
};

// API de Resultados
export const resultadosApi = {
  async getMinhasNotas(): Promise<Resultado[]> {
    return client.get<Resultado[]>('/api/resultados/minhas-notas');
  },

  async lancarNota(avaliacaoId: string, data: ResultadoPayload): Promise<Resultado> {
    // Validação: notaObtida deve estar presente
    if (!data.notaObtida && data.notaObtida !== 0) {
      throw new Error('A nota obtida é obrigatória');
    }
    return client.post<Resultado>(`/api/resultados/avaliacoes/${avaliacaoId}`, data);
  },

  async getByAvaliacao(avaliacaoId: string): Promise<Resultado[]> {
    return client.get<Resultado[]>(`/api/resultados/avaliacoes/${avaliacaoId}`);
  },

  async getByCurso(cursoId: string): Promise<Resultado[]> {
    return client.get<Resultado[]>(`/api/resultados/cursos/${cursoId}`);
  },
};

// API de Dashboard
export const dashboardApi = {
  async getResumo(): Promise<DashboardResumo> {
    return client.get<DashboardResumo>('/api/dashboard/resumo');
  },
};

// Exportação legada para compatibilidade (será removida gradualmente)
export const api = {
  getCursos: cursosApi.getAll,
  getCurso: cursosApi.getById,
  createCurso: cursosApi.create,
  updateCurso: cursosApi.update,
  matricular: cursosApi.matricular,
  getConteudos: conteudosApi.getByCurso,
  getConteudo: conteudosApi.getById,
  createConteudo: conteudosApi.create,
  getAvaliacoes: avaliacoesApi.getByCurso,
  createAvaliacao: avaliacoesApi.create,
  getMinhasNotas: resultadosApi.getMinhasNotas,
  lancarNota: (avaliacaoId: string, alunoId: string, notaObtida: number) =>
    resultadosApi.lancarNota(avaliacaoId, { alunoId, notaObtida }),
  getResultadosAvaliacao: resultadosApi.getByAvaliacao,
  getResultadosCurso: resultadosApi.getByCurso,
  getDashboardResumo: dashboardApi.getResumo,
};
