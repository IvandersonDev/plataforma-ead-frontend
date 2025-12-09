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
  matriculado?: boolean;
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
  conteudoOriginal?: string | null;
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
  perguntas?: AvaliacaoPergunta[];
}

export interface AvaliacaoPayload {
  cursoId: number;
  tipoAvaliacao: string;
  notaMaxima: number;
  dataLimite: string;
  perguntas?: AvaliacaoPerguntaPayload[];
}

export interface AvaliacaoPergunta {
  id: number;
  enunciado: string;
  peso: number;
}

export interface AvaliacaoPerguntaPayload {
  enunciado: string;
  peso: number;
}

export interface Resultado {
  id: number;
  avaliacaoId: number;
  aluno: Usuario;
  notaObtida: number | null;
  notaMaxima: number;
  tipoAvaliacao: string;
  cursoId: number;
  cursoTitulo: string;
  realizado: boolean;
  anexoNome?: string | null;
  anexoTipo?: string | null;
  anexoUrl?: string | null;
}

export interface ResultadoPayload {
  alunoId: number;
  notaObtida: number;
}

export interface RealizacaoPayload {
  respostas?: Array<{
    perguntaId: number;
    resposta: string;
  }>;
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
      realizado: boolean;
      anexoNome?: string | null;
      anexoUrl?: string | null;
      respostas?: Array<{
        perguntaId: number;
        enunciado: string;
        resposta: string;
      }>;
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
