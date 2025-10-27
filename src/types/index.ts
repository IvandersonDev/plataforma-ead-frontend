// Tipos de usuário
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: 'aluno' | 'professor' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

// Tipos de autenticação
export interface LoginResponse {
  token: string;
  tipo: 'aluno' | 'professor' | 'admin';
  expiresIn: number;
  user: Usuario;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  anexo?: string | null;
  tipoUsuario?: 'aluno' | 'professor';
}

// Tipos de curso
export interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  imagemUrl?: string;
  professorId?: string;
  professor?: Usuario;
  createdAt: string;
  updatedAt: string;
}

export interface CursoPayload {
  titulo: string;
  descricao: string;
  imagemUrl?: string;
  professorId?: string;
}

// Tipos de conteúdo
export interface Conteudo {
  id: string;
  cursoId: string;
  titulo: string;
  descricao: string;
  formatoOriginal: 'pdf' | 'ppt' | 'video' | 'text' | 'other';
  conteudo: string;
  arquivoNome?: string;
  arquivoTipo?: string;
  arquivoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConteudoPayload {
  titulo: string;
  descricao: string;
  formatoOriginal: 'pdf' | 'ppt' | 'video' | 'text' | 'other';
  conteudo: string;
  arquivoNome?: string;
  arquivoTipo?: string;
  arquivoUrl?: string;
}

// Tipos de avaliação
export interface Avaliacao {
  id: string;
  cursoId: string;
  tipoAvaliacao: string;
  notaMaxima: number;
  dataLimite: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvaliacaoPayload {
  tipoAvaliacao: string;
  notaMaxima: number;
  dataLimite: string; // ISO 8601
}

// Tipos de resultado
export interface Resultado {
  id: string;
  avaliacaoId: string;
  alunoId: string;
  notaObtida: number;
  aluno?: Usuario;
  avaliacao?: Avaliacao;
  createdAt: string;
  updatedAt: string;
}

export interface ResultadoPayload {
  alunoId: string;
  notaObtida: number;
}

// Tipos de dashboard
export interface DashboardResumo {
  cursosAtivos: number;
  avaliacoesPendentes: number;
  totalAlunos: number;
  mediaGeral: number;
}

// Tipos de matrícula
export interface Matricula {
  id: string;
  cursoId: string;
  alunoId: string;
  dataMatricula: string;
  curso?: Curso;
  aluno?: Usuario;
}

// Tipos de erro da API
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

