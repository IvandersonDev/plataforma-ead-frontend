const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const api = {
  // Cursos
  async getCursos() {
    const response = await fetch(`${API_BASE_URL}/api/cursos`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar cursos');
    return response.json();
  },

  async getCurso(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar curso');
    return response.json();
  },

  async createCurso(curso: any) {
    const response = await fetch(`${API_BASE_URL}/api/cursos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(curso),
    });
    if (!response.ok) throw new Error('Erro ao criar curso');
    return response.json();
  },

  async updateCurso(id: string, curso: any) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(curso),
    });
    if (!response.ok) throw new Error('Erro ao atualizar curso');
    return response.json();
  },

  async matricular(cursoId: string) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}/matriculas`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao matricular');
    return response.json();
  },

  // Conteúdos
  async getConteudos(cursoId: string) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}/conteudos`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar conteúdos');
    return response.json();
  },

  async getConteudo(cursoId: string, conteudoId: string) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}/conteudos/${conteudoId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar conteúdo');
    return response.json();
  },

  async createConteudo(cursoId: string, conteudo: any) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}/conteudos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(conteudo),
    });
    if (!response.ok) throw new Error('Erro ao criar conteúdo');
    return response.json();
  },

  // Avaliações
  async getAvaliacoes(cursoId: string) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}/avaliacoes`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar avaliações');
    return response.json();
  },

  async createAvaliacao(cursoId: string, avaliacao: any) {
    const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}/avaliacoes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(avaliacao),
    });
    if (!response.ok) throw new Error('Erro ao criar avaliação');
    return response.json();
  },

  // Resultados
  async getMinhasNotas() {
    const response = await fetch(`${API_BASE_URL}/api/resultados/minhas-notas`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar notas');
    return response.json();
  },

  async lancarNota(avaliacaoId: string, alunoId: string, nota: number) {
    const response = await fetch(`${API_BASE_URL}/api/resultados/avaliacoes/${avaliacaoId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alunoId, nota }),
    });
    if (!response.ok) throw new Error('Erro ao lançar nota');
    return response.json();
  },

  async getResultadosAvaliacao(avaliacaoId: string) {
    const response = await fetch(`${API_BASE_URL}/api/resultados/avaliacoes/${avaliacaoId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar resultados');
    return response.json();
  },

  async getResultadosCurso(cursoId: string) {
    const response = await fetch(`${API_BASE_URL}/api/resultados/cursos/${cursoId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar resultados do curso');
    return response.json();
  },

  // Dashboard
  async getDashboardResumo() {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/resumo`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar resumo');
    return response.json();
  },
};
