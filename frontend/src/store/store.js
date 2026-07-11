// ============================================================================
// store.js — Punto central del ESTADO GLOBAL de la aplicación (Redux Toolkit).
// Combina los tres slices en un solo store que envuelve toda la app.
// ============================================================================

// configureStore: crea el store ya configurado (Redux DevTools + middleware).
import { configureStore } from '@reduxjs/toolkit';

// Cada reducer viene de su propio slice (un archivo por dominio del sistema):
import authReducer from './authSlice'; // sesión / usuario autenticado
import usersReducer from './userSlice'; // lista de usuarios de la comunidad
import accessReducer from './accessSlice'; // credenciales, accesos y visitantes

// El store expone tres "ramas" de estado. En los componentes se leen con
// useSelector((state) => state.auth / state.users / state.access).
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    access: accessReducer,
  },
});
