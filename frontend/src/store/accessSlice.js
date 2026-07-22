// ============================================================================
// accessSlice.js — Rama "access": credenciales, bitácora de accesos y
// visitantes. CONECTADO AL BACKEND (Axios).
//   - Alumno:  miCredencial / misAccesos  (/credenciales/mia, /accesos/mios)
//   - Admin/Caseta: credenciales / accesos / visitantes (listados y registro)
// ============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// --- Flujo del ALUMNO -----------------------------------------------------
export const cargarMiCredencial = createAsyncThunk(
  'access/cargarMiCredencial',
  async (_, { rejectWithValue }) => {
    try {
      const [cred, acc] = await Promise.all([
        api.get('/credenciales/mia'),
        api.get('/accesos/mios'),
      ]);
      return { credencial: cred.data.credencial, accesos: acc.data.accesos };
    } catch (err) {
      if (err.response?.status === 404) return { credencial: null, accesos: [] };
      return rejectWithValue(err.response?.data?.error || 'No se pudo cargar tu credencial.');
    }
  }
);

export const reportarPerdida = createAsyncThunk(
  'access/reportarPerdida',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/credenciales/mia/perdida');
      return data.credencial;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudo reportar la pérdida.');
    }
  }
);

// --- Flujo de ADMIN / CASETA ----------------------------------------------
// cargarAccesosYCredenciales: listados completos (credenciales, bitácora y visitantes).
export const cargarAccesosYCredenciales = createAsyncThunk(
  'access/cargarTodo',
  async (_, { rejectWithValue }) => {
    try {
      const [cred, acc, vis] = await Promise.all([
        api.get('/credenciales'),
        api.get('/accesos'),
        api.get('/visitantes'),
      ]);
      return {
        credenciales: cred.data.credenciales,
        accesos: acc.data.accesos,
        visitantes: vis.data.visitantes,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudieron cargar los datos de acceso.');
    }
  }
);

// registrarAcceso: registra un evento en la bitácora (terminal y validación de caseta).
export const registrarAcceso = createAsyncThunk(
  'access/registrarAcceso',
  async (datos, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/accesos', datos);
      return data.acceso;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudo registrar el acceso.');
    }
  }
);

// renovarVigencia: edita la vigencia de la credencial de un usuario, ya sea
// sumando "meses" o fijando una "fecha_vencimiento" exacta (YYYY-MM-DD).
export const renovarVigencia = createAsyncThunk(
  'access/renovarVigencia',
  async ({ id_usuario, meses, fecha_vencimiento }, { rejectWithValue }) => {
    try {
      const body = fecha_vencimiento ? { fecha_vencimiento } : { meses };
      const { data } = await api.patch(`/credenciales/usuario/${id_usuario}/vigencia`, body);
      return data.credencial;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudo editar la vigencia.');
    }
  }
);

// registrarVisitante: alta de un externo; el backend deja su acceso de entrada en la bitácora (caseta).
export const registrarVisitante = createAsyncThunk(
  'access/registrarVisitante',
  async (datos, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/visitantes', datos);
      return data.visitante;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'No se pudo registrar al visitante.');
    }
  }
);

const accessSlice = createSlice({
  name: 'access', // rama state.access
  initialState: {
    miCredencial: null,
    misAccesos: [],
    cargandoMia: false,
    credenciales: [],
    accesos: [],
    visitantes: [],
    inicializado: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Alumno
      .addCase(cargarMiCredencial.pending, (s) => {
        s.cargandoMia = true;
      })
      .addCase(cargarMiCredencial.fulfilled, (s, a) => {
        s.cargandoMia = false;
        s.miCredencial = a.payload.credencial;
        s.misAccesos = a.payload.accesos;
        s.inicializado = true;
      })
      .addCase(cargarMiCredencial.rejected, (s) => {
        s.cargandoMia = false;
        s.inicializado = true;
      })
      .addCase(reportarPerdida.fulfilled, (s, a) => {
        s.miCredencial = a.payload;
      })
      // Admin / Caseta
      .addCase(cargarAccesosYCredenciales.fulfilled, (s, a) => {
        s.credenciales = a.payload.credenciales;
        s.accesos = a.payload.accesos;
        s.visitantes = a.payload.visitantes;
        s.inicializado = true;
      })
      .addCase(cargarAccesosYCredenciales.rejected, (s, a) => {
        s.error = a.payload;
        s.inicializado = true;
      })
      .addCase(registrarAcceso.fulfilled, (s, a) => {
        s.accesos.unshift(a.payload);
      })
      .addCase(renovarVigencia.fulfilled, (s, a) => {
        const i = s.credenciales.findIndex((c) => c.id_credencial === a.payload.id_credencial);
        if (i !== -1) s.credenciales[i] = a.payload;
      })
      .addCase(registrarVisitante.fulfilled, (s, a) => {
        s.visitantes.unshift(a.payload);
      });
  },
});

export default accessSlice.reducer;
