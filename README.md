# Dashboard de Vendas - Mercado Livre

Dashboard para análise de vendas do Mercado Livre, desenvolvido com React e Node.js.

## Funcionalidades

- Visualização de métricas importantes (vendas totais, despesas, lucro líquido, total de pedidos)
- Gráfico de tendência de vendas e lucro
- Filtros por data e SKU
- Resumo do período com médias diárias e crescimento
- Tema claro/escuro
- Interface responsiva e moderna

## Tecnologias Utilizadas

### Frontend
- React.js
- Material-UI (MUI)
- Recharts para gráficos
- Context API para gerenciamento de estado
- Date-fns para manipulação de datas

### Backend
- Node.js
- Express
- SQLite para banco de dados
- API RESTful

## Como Executar

1. Clone o repositório
```bash
git clone [URL_DO_SEU_REPOSITORIO]
```

2. Instale as dependências do backend
```bash
cd backend
npm install
```

3. Inicie o servidor backend
```bash
npm start
```

4. Em outro terminal, instale as dependências do frontend
```bash
cd frontend
npm install
```

5. Inicie o servidor frontend
```bash
npm start
```

O aplicativo estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── database/
│   │   └── index.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── contexts/
    │   └── App.js
    └── package.json
```

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
