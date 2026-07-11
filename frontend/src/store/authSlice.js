// ============================================================================
// authSlice.js — Rama "auth" del estado global: SESIÓN del usuario.
// Guarda quién inició sesión (usuario), su token y el error de login.
// Modo demo: valida de forma LOCAL contra los usuarios guardados en el
// navegador (localStorage), sin llamar todavía al backend.
// ============================================================================

// createSlice: genera de un solo golpe el reducer + las actions a partir de
// un nombre, un estado inicial y unas funciones (reducers).
import { createSlice } from '@reduxjs/toolkit';

// --- Helper ---------------------------------------------------------------
// Busca un usuario por correo o matrícula dentro de la lista que el userSlice
// dejó en localStorage bajo la llave 'sicad_usuarios'. Devuelve el usuario o undefined.
function buscarUsuario(identificador) {
  if (typeof window === 'undefined') return null; // en el servidor no hay localStorage
  const id = (identificador || '').trim().toLowerCase();
  const usuarios = JSON.parse(localStorage.getItem('sicad_usuarios') || '[]');
  return usuarios.find(
    (u) => u.correo?.toLowerCase() === id || u.matricula_empleado?.toLowerCase() === id
  );
}

// Al recargar la página, recupera la sesión previa desde localStorage (si existe).
const usuarioInicial =
  typeof window !== 'undefined' && localStorage.getItem('sicad_usuario')
    ? JSON.parse(localStorage.getItem('sicad_usuario'))
    : null;

const authSlice = createSlice({
  name: 'auth', // nombre de la rama (state.auth)
  initialState: {
    token: typeof window !== 'undefined' ? localStorage.getItem('sicad_token') : null,
    usuario: usuarioInicial, // objeto del usuario logueado, o null
    error: null, // mensaje de error del último intento de login
  },
  // Cada función recibe (state, action) y modifica el state directamente
  // (Redux Toolkit usa Immer por debajo, por eso se puede "mutar").
  reducers: {
    // login: comprueba que el usuario exista; en la demo cualquier contraseña sirve.
    login: (state, action) => {
      const { identificador, password } = action.payload; // datos que manda la pantalla de login
      const u = buscarUsuario(identificador);
      if (!u) {
        state.error = 'No existe un usuario con ese correo o matrícula.';
        return;
      }
      if (!password) {
        state.error = 'Escribe tu contraseña.';
        return;
      }
      state.usuario = u; // guarda al usuario en el estado global
      state.token = 'demo-' + u.id_usuario;
      state.error = null;
      if (typeof window !== 'undefined') {
        // persiste la sesión para que sobreviva a un refresh
        localStorage.setItem('sicad_token', state.token);
        localStorage.setItem('sicad_usuario', JSON.stringify(u));
      }
    },
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
});

// Se exportan las actions (para dispatch en las páginas) y el reducer (para el store).
export const { login, logout, limpiarError } = authSlice.actions;
export default authSlice.reducer;
