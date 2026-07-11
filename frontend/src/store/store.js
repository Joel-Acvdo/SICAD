// Configuración del store global de Redux.
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import usersReducer from './userSlice';
import accessReducer from './accessSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    access: accessReducer,
  },
});
