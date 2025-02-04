import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';
import VisaoGeral from './pages/VisaoGeral';
import MercadoLivre from './pages/MercadoLivre';
import MagazineLuiza from './pages/MagazineLuiza';
import Estoque from './pages/Estoque';
import Metas from './pages/Metas';
import Produtos from './pages/Produtos';
import Alertas from './pages/Alertas';
import Configuracoes from './pages/Configuracoes';
import Compras from './pages/Compras';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <VisaoGeral /> },
      { path: '/visao-geral', element: <VisaoGeral /> },
      { path: '/mercado-livre', element: <MercadoLivre /> },
      { path: '/magazine-luiza', element: <MagazineLuiza /> },
      { path: '/compras', element: <Compras /> },
      { path: '/estoque', element: <Estoque /> },
      { path: '/metas', element: <Metas /> },
      { path: '/produtos', element: <Produtos /> },
      { path: '/alertas', element: <Alertas /> },
      { path: '/configuracoes', element: <Configuracoes /> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
