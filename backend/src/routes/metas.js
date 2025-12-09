const express = require('express');
const router = express.Router();
const metasService = require('../services/metasService');

// Buscar metas por mês/ano
router.get('/', async (req, res) => {
  try {
    console.log('Recebida requisição GET /metas');
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      console.error('Parâmetro mes_ano não fornecido');
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    const metas = await metasService.buscarMetasPorMes(mes_ano);
    
    console.log(`✅ Metas retornadas para ${mes_ano}:`, metas.length);
    // Retornar o array de metas diretamente (o frontend faz o processamento)
    res.json(metas);
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
});

// Buscar metas de um mês específico
router.get('/mes/:mes_ano', async (req, res) => {
  try {
    const { mes_ano } = req.params;
    const metas = await metasService.buscarMetasPorMes(mes_ano);
    res.json(metas);
  } catch (error) {
    console.error('Erro ao buscar metas do mês:', error);
    res.status(500).json({ error: 'Erro ao buscar metas do mês' });
  }
});

// Criar ou atualizar meta para um SKU
router.post('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { meta_vendas, meta_margem, mes_ano } = req.body;
    
    console.log('Dados recebidos:', { sku, meta_vendas, meta_margem, mes_ano });

    if (!sku || !mes_ano) {
      return res.status(400).json({ error: 'SKU e mês/ano são obrigatórios' });
    }

    const metaVendas = Number(meta_vendas);
    const metaMargem = Number(meta_margem);

    const resultado = await metasService.criarOuAtualizarMeta(
      sku,
      mes_ano,
      metaVendas,
      metaMargem
    );

    console.log('Meta salva:', resultado);
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
    res.status(500).json({ error: 'Erro ao salvar meta' });
  }
});

// Copiar metas do mês anterior para novo mês
router.post('/copiar-mes', async (req, res) => {
  try {
    const { mes_ano } = req.body;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    const resultado = await metasService.copiarMetasDesMesAnterior(mes_ano);
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao copiar metas:', error);
    res.status(500).json({ error: 'Erro ao copiar metas para novo mês' });
  }
});

// Deletar meta
router.delete('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    await metasService.deletarMeta(sku, mes_ano);
    res.json({ message: 'Meta deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

module.exports = router;