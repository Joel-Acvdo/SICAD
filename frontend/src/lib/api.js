// Cliente Axios centralizado. Adjunta el token JWT a cada petición.
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
});

// Interceptor: agrega el token guardado en localStorage.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sicad_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta: si el token expira (401), limpia la sesión.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sicad_token');
    }
    return Promise.reject(error);
  }
);

export default api;
