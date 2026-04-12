import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://blockvote-api-rithin-2026.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 second hard timeout — fail fast instead of hanging forever
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Silent "wake-up" ping — fires immediately when the app loads
// This warms the Render.com free-tier server in the background
// so it's ready by the time the user hits submit
export const pingServer = () => {
    // Ping the ultra-fast /ping endpoint to wake the server
    // We use the base API_URL which is .../api
    const wakeUp = () => axios.get(`${API_URL}/ping`, { 
        timeout: 30000,
        headers: { 'Cache-Control': 'no-cache' } 
    }).catch(() => {
        // If it fails (likely server is cold), retry after a short delay
        setTimeout(() => axios.get(`${API_URL}/health`, { timeout: 45000 }).catch(() => {}), 5000);
    });

    wakeUp();
};

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),
};

export const voterAPI = {
    register: (data) => api.post('/voters/register', data),
    getAll: () => api.get('/voters'),
    update: (id, data) => api.put(`/voters/${id}`, data),
    delete: (id) => api.delete(`/voters/${id}`)
};

export const votingAPI = {
    authenticateFace: (data) => api.post('/voting/authenticate/face', data),
    authenticateFingerprint: (data) => api.post('/voting/authenticate/fingerprint', data),
    castVote: (data) => api.post('/voting/cast-vote', data),
};

export const electionAPI = {
    getAll: () => api.get('/elections'),
    create: (data) => api.post('/elections', data),
    update: (id, data) => api.put(`/elections/${id}`, data),
    delete: (id) => api.delete(`/elections/${id}`),
    start: (id) => api.put(`/elections/${id}/start`),
    close: (id) => api.put(`/elections/${id}/close`),
    getResults: (id) => api.get(`/elections/${id}/results`),
    getConstituencies: (id) => api.get(`/elections/${id}/constituencies`),
    createConstituency: (data) => api.post('/elections/constituencies', data),
};

export const candidateAPI = {
    getByConstituency: (id) => api.get(`/candidates/constituency/${id}`),
    getByElection: (id) => api.get(`/candidates/election/${id}`),
    create: (data) => api.post('/candidates', data),
};

export default api;
