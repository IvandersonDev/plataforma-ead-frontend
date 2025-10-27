import type {
  Curso,
  CursoPayload,
  Conteudo,
  Avaliacao,
  AvaliacaoPayload,
  Resultado,
  ResultadoPayload,
  DashboardResumo,
  LoginResponse,
  Usuario,
  ProfessorNotasResponse,
  ApiError,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Helper para converter datas ISO 8601 em Date
const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'dataLimite',
  'dataMatricula',
  'dataCriacao',
  'dataPublicacao',
]);

const parseDates = <T>(payload: T): T => {
  const convert = (value: unknown): unknown => {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(convert);
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
        (acc, [key, val]) => {
          if (DATE_FIELDS.has(key) && typeof val === 'string') {
            acc[key] = new Date(val);
            return acc;
          }

          acc[key] = convert(val);
          return acc;
        },
        {},
      );
    }

    return value;
  };

  return convert(payload) as T;
};

// Client HTTP centralizado com interceptor
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getHeaders(options?: { isForm?: boolean }): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (!options?.isForm) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Tratamento de erros 401/403 - redireciona para login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sessao expirada. Faca login novamente.');
    }
    if (response.status === 403) {
      throw new Error('Voce nao possui permissao para realizar esta operacao.');
    }

    if (!response.ok) {
      let errorMessage = 'Erro na requisicao';

      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.message || errorMessage;

        // Tratamento de erros de validacao (422)
        if (response.status === 422 && errorData.errors) {
          const validationErrors = Object.values(errorData.errors).flat().join(', ');
          errorMessage = `Erro de validacao: ${validationErrors}`;
        }
      } catch {
        // Se nao conseguir parsear o JSON, usa mensagem padrao
        errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    const text = await response.text();

    if (!text) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');

    if (contentType && !contentType.toLowerCase().includes('application/json')) {
      return text as unknown as T;
    }

    try {
      const data = JSON.parse(text);
      return parseDates(data);
    } catch {
      throw new Error('Erro ao interpretar resposta do servidor.');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const isForm = body instanceof FormData;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders({ isForm }),
      ...(body !== undefined && {
        body: isForm ? body : JSON.stringify(body),
      }),
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

// API de Autenticacao
export const authApi = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    return client.post<LoginResponse>('/api/auth/login', { email, senha });
  },

  async register(data: FormData): Promise<Usuario> {
    return client.post<Usuario>('/api/auth/register', data);
  },

  async me(): Promise<Usuario> {
    return client.get<Usuario>('/api/auth/me');
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

// API de Conteudos
export const conteudosApi = {
  async getByCurso(cursoId: string): Promise<Conteudo[]> {
    return client.get<Conteudo[]>(`/api/cursos/${cursoId}/conteudos`);
  },

  async getById(cursoId: string, conteudoId: string): Promise<Conteudo> {
    return client.get<Conteudo>(`/api/cursos/${cursoId}/conteudos/${conteudoId}`);
  },

  async create(cursoId: string, data: FormData): Promise<Conteudo> {
    return client.post<Conteudo>(`/api/cursos/${cursoId}/conteudos`, data);
  },
};

// API de Avaliacoes
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
    // Validacao: notaObtida deve estar presente
    if (!data.notaObtida && data.notaObtida !== 0) {
      throw new Error('A nota obtida e obrigatoria');
    }
    return client.post<Resultado>(`/api/resultados/avaliacoes/${avaliacaoId}`, data);
  },

  async getByAvaliacao(avaliacaoId: string): Promise<Resultado[]> {
    return client.get<Resultado[]>(`/api/resultados/avaliacoes/${avaliacaoId}`);
  },

  async getByCurso(cursoId: string): Promise<ProfessorNotasResponse> {
    return client.get<ProfessorNotasResponse>(`/api/resultados/cursos/${cursoId}`);
  },
};

// API de Dashboard
export const dashboardApi = {
  async getResumo(): Promise<DashboardResumo> {
    return client.get<DashboardResumo>('/api/dashboard/resumo');
  },
};

// Exportacao legada para compatibilidade (sera removida gradualmente)
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
  lancarNota: (avaliacaoId: string, alunoId: number, notaObtida: number) =>
    resultadosApi.lancarNota(avaliacaoId, { alunoId, notaObtida }),
  getResultadosAvaliacao: resultadosApi.getByAvaliacao,
  getResultadosCurso: resultadosApi.getByCurso,
  getDashboardResumo: dashboardApi.getResumo,
};
