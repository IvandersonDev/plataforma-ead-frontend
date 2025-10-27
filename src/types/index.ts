export type TipoUsuario = 'ALUNO' | 'PROFESSOR' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  anexo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  expiresIn: number;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  anexo?: string | null;
  tipoUsuario?: TipoUsuario;
}

export interface Curso {
  id: number;
  titulo: string;
  descricao: string;
  imagemUrl?: string | null;
  professor: Usuario;
  dataCriacao: Date;
}

export interface CursoPayload {
  titulo: string;
  descricao: string;
  imagemUrl?: string | null;
  professorId?: number;
}

export interface Conteudo {
  id: number;
  cursoId: number;
  titulo: string;
  descricao: string;
  formatoOriginal: string;
  conteudoAdaptado: string | null;
  conteudoAdaptadoTipo: string | null;
  dataPublicacao: Date;
  arquivoNome?: string | null;
  arquivoTipo?: string | null;
  arquivoUrl?: string | null;
}

export interface ConteudoPayload {
  cursoId: number;
  titulo: string;
  descricao: string;
  formatoOriginal?: string | null;
  conteudo?: string | null;
  arquivoNome?: string | null;
  arquivoTipo?: string | null;
  arquivoUrl?: string | null;
}

export interface Avaliacao {
  id: number;
  cursoId: number;
  tipoAvaliacao: string;
  notaMaxima: number;
  dataLimite: Date;
}

export interface AvaliacaoPayload {
  cursoId: number;
  tipoAvaliacao: string;
  notaMaxima: number;
  dataLimite: string;
}

export interface Resultado {
  id: number;
  avaliacaoId: number;
  aluno: Usuario;
  notaObtida: number;
  notaMaxima: number;
  tipoAvaliacao: string;
  cursoId: number;
  cursoTitulo: string;
}

export interface ResultadoPayload {
  alunoId: number;
  notaObtida: number;
}

export interface ProfessorNotasResponse {
  cursoId: number;
  cursoTitulo: string;
  alunos: Array<{
    alunoId: number;
    alunoNome: string;
    alunoEmail: string;
    avaliacoes: Array<{
      avaliacaoId: number;
      tipoAvaliacao: string;
      notaObtida: number | null;
      notaMaxima: number;
    }>;
  }>;
}

export interface DashboardResumo {
  cursosAtivos: number;
  avaliacoesPublicadas: number;
  alunosMatriculados: number;
  mediaNotasGerais: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
