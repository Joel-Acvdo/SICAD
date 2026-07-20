// ============================================================================
// authSlice.js — Rama "auth" del estado global: SESIÓN del usuario.
// Guarda quién inició sesión (usuario), su token JWT y el error/carga del login.
// Conectado al BACKEND real: el login llama a POST /api/auth/login (Axios).
// ============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api'; // cliente Axios (adjunta el token JWT en cada petición)

// login: thunk asíncrono. Llama al backend y devuelve { token, usuario }.
// La contraseña ya se valida en el servidor (bcrypt); acepta correo O matrícula.
export const login = createAsyncThunk(
  'auth/login',
  async ({ identificador, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { identificador, password });
      if (typeof window !== 'undefined') {
        // persiste la sesión: el token lo reusa el interceptor de Axios en cada request
        localStorage.setItem('sicad_token', data.token);
        localStorage.setItem('sicad_usuario', JSON.stringify(data.usuario));
      }
      return data; // { token, usuario }
    } catch (err) {
      // Mensaje que manda el backend (ApiError) o uno genérico si no hubo respuesta.
      const msg =
        err.response?.data?.error ||
        (err.response ? 'Credenciales incorrectas.' : 'No se pudo conectar con el servidor.');
      return rejectWithValue(msg);
    }
  }
);

// Al recargar la página, recupera la sesión previa desde localStorage (si existe).
const usuarioInicial =
  typeof window !== 'undefined' && localStorage.getItem('sicad_usuario')
    ? JSON.parse(localStorage.getItem('sicad_usuario'))
    : null;

const authSlice = createSlice({
  name: 'auth', // rama state.auth
  initialState: {
    token: typeof window !== 'undefined' ? localStorage.getItem('sicad_token') : null,
    usuario: usuarioInicial, // objeto del usuario logueado, o null
    cargando: false, // true mientras se espera la respuesta del login
    error: null, // mensaje de error del último intento
  },
  reducers: {
    // limpiarError: borra el mensaje de error (se usa al abrir el login).
    limpiarError: (state) => {
      state.error = null;
    },
    // logout: cierra la sesión y borra lo guardado en el navegador.
    logout: (state) => {
      state.token = null;
      state.usuario = null;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sicad_token');
        localStorage.removeItem('sicad_usuario');
      }
    },
  },
  // extraReducers: reacciona a los estados del thunk (pending/fulfilled/rejected).
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.cargando = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.cargando = false;
        state.token = action.payload.token;
        state.usuario = action.payload.usuario;
      })
      .addCase(login.rejected, (state, action) => {
        state.cargando = false;
        state.error = action.payload || 'No se pudo iniciar sesión.';
      });
  },
});

export const { logout, limpiarError } = authSlice.actions;
export default authSlice.reducer;
