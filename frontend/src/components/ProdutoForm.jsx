import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
  Stack
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapIcon
} from '@mui/icons-material';

export default function ProdutoForm({ open, onClose, onSubmit, produto }) {
  const [formData, setFormData] = useState({
    sku: '',
    nome: '',
    cmv: '',
    estoque: '',
    status: 'ativo',
    imagemUrl: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    if (produto) {
      setFormData(produto);
      setImagePreview(produto.imagemUrl && produto.imagemUrl !== 'https://via.placeholder.com/100' ? produto.imagemUrl : null);
    } else {
      setFormData({
        sku: '',
        nome: '',
        cmv: '',
        estoque: '',
        status: 'ativo',
        imagemUrl: ''
      });
      setImagePreview(null);
    }
    setImageError(null);
  }, [produto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar se é PNG
      if (file.type !== 'image/png') {
        setImageError('Por favor, selecione apenas imagens PNG.');
        return;
      }

      // Verificar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setImageError('A imagem deve ter no máximo 2MB.');
        return;
      }

      setImageError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          imagemUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      imagemUrl: ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (imageError) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {produto ? 'Editar Produto' : 'Novo Produto'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 3,
                  border: '2px dashed',
                  borderColor: imageError ? 'error.main' : 'divider',
                  borderRadius: 2,
                  position: 'relative'
                }}
              >
                {imagePreview ? (
                  <>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{
                        width: 200,
                        height: 200,
                        objectFit: 'contain'
                      }}
                    />
                    <Stack direction="row" spacing={2}>
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<SwapIcon />}
                        color="primary"
                      >
                        Trocar
                        <input
                          type="file"
                          hidden
                          accept="image/png"
                          onChange={handleImageUpload}
                        />
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={handleDeleteImage}
                      >
                        Excluir
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <>
                    <Button
                      component="label"
                      variant="contained"
                      startIcon={<UploadIcon />}
                    >
                      Upload Imagem PNG
                      <input
                        type="file"
                        hidden
                        accept="image/png"
                        onChange={handleImageUpload}
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Formato aceito: PNG. Tamanho máximo: 2MB
                    </Typography>
                  </>
                )}
                {imageError && (
                  <Alert severity="error" sx={{ mt: 1, width: '100%' }}>
                    {imageError}
                  </Alert>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                name="sku"
                label="SKU"
                fullWidth
                value={formData.sku}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                name="nome"
                label="Nome do Produto"
                fullWidth
                value={formData.nome}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                name="cmv"
                label="CMV"
                type="number"
                fullWidth
                value={formData.cmv}
                onChange={handleChange}
                InputProps={{
                  startAdornment: 'R$'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                name="estoque"
                label="Estoque"
                type="number"
                fullWidth
                value={formData.estoque}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={imageError !== null}
          >
            {produto ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 