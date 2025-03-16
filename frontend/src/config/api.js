import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor para logging
api.interceptors.request.use(config => {
    console.log('Requisição:', config.url);
    return config;
}, error => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
});

api.interceptors.response.use(response => {
    return response;
}, error => {
    console.error('Erro na API:', error.message);
    return Promise.reject(error);
});

export default api;