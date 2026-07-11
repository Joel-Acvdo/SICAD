// Estado de AUTENTICACIÓN (modo demo local, valida contra los usuarios en localStorage).
import { createSlice } from '@reduxjs/toolkit';

// Busca al usuario por correo o matrícula dentro de la lista guardada.
function buscarUsuario(identificador) {
  if (typeof window === 'undefined') return null;
  const id = (identificador || '').trim().toLowerCase();
  const usuarios = JSON.parse(localStorage.getItem('sicad_usuarios') || '[]');
  return usuarios.find(
    (u) => u.correo?.toLowerCase() === id || u.matricula_empleado?.toLowerCase() === id
  );
}

const usuarioInicial =
  typeof window !== 'undefined' && localStorage.getItem('sicad_usuario')
    ? JSON.parse(localStorage.getItem('sicad_usuario'))
    : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: typeof window !== 'undefined' ? localStorage.getItem('sicad_token') : null,
    usuario: usuarioInicial,
    error: null,
  },
  reducers: {
    // Inicia sesión: cualquier contraseña sirve en la demo, pero el usuario debe existir.
    login: (state, action) => {
      const { identificador, password } = action.payload;
      const u = buscarUsuario(identificador);
      if (!u) {
        state.error = 'No existe un usuario con ese correo o matrícula.';
        return;
      }
      if (!password) {
        state.error = 'Escribe tu contraseña.';
        return;
      }
      state.usuario = u;
      state.token = 'demo-' + u.id_usuario;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sicad_token', state.token);
        localStorage.setItem('sicad_usuario', JSON.stringify(u));
      }
    },
    limpiarError: (state) => {
      state.error = null;
    },
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
});

export const { login, logout, limpiarError } = authSlice.actions;
export default authSlice.reducer;
