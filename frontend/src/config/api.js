import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://projetodashboardversao1-production.up.railway.app/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api; 