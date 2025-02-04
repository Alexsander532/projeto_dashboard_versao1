import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import MagazineLuiza from '../pages/MagazineLuiza';
import Estoque from '../pages/Estoque';
import Metas from '../pages/Metas';
import Produtos from '../pages/Produtos';
import Compras from '../pages/Compras';
import Alertas from '../pages/Alertas';
import Configuracoes from '../pages/Configuracoes';
import VisaoGeral from '../pages/VisaoGeral';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<VisaoGeral />} />
      <Route path="/mercado-livre" element={<Dashboard />} />
      <Route path="/magazine-luiza" element={<MagazineLuiza />} />
      <Route path="/estoque" element={<Estoque />} />
      <Route path="/metas" element={<Metas />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/compras" element={<Compras />} />
      <Route path="/alertas" element={<Alertas />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
    </Routes>
  );
} 

