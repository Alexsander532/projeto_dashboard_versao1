import api from '../config/api';

// Buscar todos os produtos
export const fetchProdutos = async () => {
  try {
    const response = await api.get('/api/produtos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

// Adicionar novo produto
export const addProduto = async (produto) => {
  try {
    const response = await api.post('/api/produtos', produto);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    throw error;
  }
};

// Atualizar produto existente
export const updateProduto = async (sku, produto) => {
  try {
    const response = await api.put(`/api/produtos/${sku}`, produto);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    throw error;
  }
};

// Excluir produto
export const deleteProduto = async (sku) => {
  try {
    const response = await api.delete(`/api/produtos/${sku}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    throw error;
  }
}; 