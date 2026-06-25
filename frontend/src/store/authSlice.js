// Slice de autenticación con Redux Toolkit.
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// Thunk para iniciar sesión contra el backend.
export const login = createAsyncThunk(
  'auth/login',
  async ({ correo, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { correo, password });
      if (typeof window !== 'undefined') {
        localStorage.setItem('sicad_token', data.token);
      }
      return data; // { token, usuario }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Error al iniciar sesión');
    }
  }
);

const tokenInicial =
  typeof window !== 'undefined' ? localStorage.getItem('sicad_token') : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: tokenInicial,
    usuario: null,
    cargando: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.usuario = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sicad_token');
      }
    },
  },
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
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
