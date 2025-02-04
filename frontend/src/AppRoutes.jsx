import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MercadoLivre from './pages/MercadoLivre';
import MagazineLuiza from './pages/MagazineLuiza';
import Estoque from './pages/Estoque';
import Metas from './pages/Metas';
import Produtos from './pages/Produtos';
import Compras from './pages/Compras';
import Alertas from './pages/Alertas';
import Configuracoes from './pages/Configuracoes';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MercadoLivre />} />
      <Route path="/mercadolivre" element={<MercadoLivre />} />
      <Route path="/magazineluiza" element={<MagazineLuiza />} />
      <Route path="/estoque" element={<Estoque />} />
      <Route path="/metas" element={<Metas />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/compras" element={<Compras />} />
      <Route path="/alertas" element={<Alertas />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
    </Routes>
  );
}

export default AppRoutes; 