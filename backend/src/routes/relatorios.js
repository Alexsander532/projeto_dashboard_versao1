const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Endpoint para gerar relatório mensal de metas
router.post('/mensal', async (req, res) => {
  try {
    const { mes, ano } = req.body;
    
    if (!mes || !ano) {
      return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
    }
    
    // Formata a data para o formato esperado pelo script Python
    const mesFormatado = String(mes).padStart(2, '0');
    const dataFormatada = `${ano}-${mesFormatado}-01`;
    
    // Caminho para o script Python
    const scriptPath = path.resolve(__dirname, '../../../scripts/gerar_relatorio_mensal.py');
    
    // Executa o script Python com a data como argumento
    console.log(`Executando script: python ${scriptPath} ${dataFormatada}`);
    const { stdout, stderr } = await execAsync(`python ${scriptPath} ${dataFormatada}`);
    
    if (stderr) {
      console.error('Erro ao executar script Python:', stderr);
      return res.status(500).json({ error: 'Erro ao gerar relatório', details: stderr });
    }
    
    // Nome do arquivo gerado pelo script
    const nomeArquivo = `relatorio_mensal_${ano}-${mesFormatado}.pdf`;
    const caminhoArquivo = path.resolve(__dirname, '../../../', nomeArquivo);
    
    console.log('Relatório gerado com sucesso:', nomeArquivo);
    console.log('Caminho do arquivo:', caminhoArquivo);
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ error: 'Arquivo não encontrado após geração' });
    }
    
    // Retorna o caminho do arquivo para download
    res.json({
      success: true,
      arquivo: nomeArquivo,
      mensagem: 'Relatório gerado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
  }
});

// Endpoint para download do relatório
router.get('/download/:nomeArquivo', (req, res) => {
  try {
    const { nomeArquivo } = req.params;
    const caminhoArquivo = path.resolve(__dirname, '../../../', nomeArquivo);
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    // Envia o arquivo para download
    res.download(caminhoArquivo, nomeArquivo, (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
        res.status(500).json({ error: 'Erro ao enviar arquivo', details: err.message });
      }
    });
  } catch (error) {
    console.error('Erro ao processar download:', error);
    res.status(500).json({ error: 'Erro ao processar download', details: error.message });
  }
});

module.exports = router;
