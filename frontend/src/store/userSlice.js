// ============================================================================
// userSlice.js — Rama "users": USUARIOS de la comunidad (alumnos, docentes,
// personal). CONECTADO AL BACKEND (Axios): lista y CRUD contra /api/usuarios.
// ============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// cargarUsuarios: trae la lista completa (Servicios Escolares / Caseta).
export const cargarUsuarios = createAsyncThunk(
  'users/cargar',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/usuarios');
      return data.usuarios;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudieron cargar los usuarios.');
    }
  }
);

// agregarUsuario: alta. El backend emite la credencial automáticamente.
export const agregarUsuario = createAsyncThunk(
  'users/agregar',
  async (datos, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/usuarios', datos);
      return data.usuario;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudo registrar el usuario.');
    }
  }
);

// actualizarUsuario: edición de un usuario por id.
export const actualizarUsuario = createAsyncThunk(
  'users/actualizar',
  async (datos, { rejectWithValue }) => {
    try {
      const { id_usuario, ...campos } = datos;
      const { data } = await api.put(`/usuarios/${id_usuario}`, campos);
      return data.usuario;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudo actualizar el usuario.');
    }
  }
);

// cambiarEstatusUsuario: activa o revoca. El backend revoca/activa la credencial en cascada.
export const cambiarEstatusUsuario = createAsyncThunk(
  'users/estatus',
  async ({ id_usuario, estatus }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/usuarios/${id_usuario}/estatus`, { estatus });
      return data.usuario;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudo cambiar el estatus.');
    }
  }
);

const userSlice = createSlice({
  name: 'users', // rama state.users
  initialState: {
    lista: [],
    inicializado: false, // true cuando ya se cargaron (evita parpadeos)
    cargando: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarUsuarios.pending, (s) => {
        s.cargando = true;
        s.error = null;
      })
      .addCase(cargarUsuarios.fulfilled, (s, a) => {
        s.cargando = false;
        s.lista = a.payload;
        s.inicializado = true;
      })
      .addCase(cargarUsuarios.rejected, (s, a) => {
        s.cargando = false;
        s.error = a.payload;
        s.inicializado = true;
      })
      .addCase(agregarUsuario.fulfilled, (s, a) => {
        s.lista.push(a.payload);
      })
      .addCase(actualizarUsuario.fulfilled, (s, a) => {
        const i = s.lista.findIndex((u) => u.id_usuario === a.payload.id_usuario);
        if (i !== -1) s.lista[i] = a.payload;
      })
      .addCase(cambiarEstatusUsuario.fulfilled, (s, a) => {
        const i = s.lista.findIndex((u) => u.id_usuario === a.payload.id_usuario);
        if (i !== -1) s.lista[i] = a.payload;
      });
  },
});

export default userSlice.reducer;
