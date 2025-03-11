import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para logs
api.interceptors.request.use(config => {
    console.log('Requisição:', config.url);
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        console.error('Erro na API:', error.message);
        return Promise.reject(error);
    }
);

export default api; 