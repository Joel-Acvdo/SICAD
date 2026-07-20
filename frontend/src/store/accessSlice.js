// ============================================================================
// accessSlice.js — Rama "access" del estado global. Agrupa:
//   - miCredencial / misAccesos: la credencial y el historial del ALUMNO
//     autenticado — CONECTADOS AL BACKEND (Axios).
//   - credenciales / accesos / visitantes: listados de admin y caseta.
//     (Todavía en localStorage; se conectan en el siguiente paso.)
// ============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const SEED_VERSION = '4'; // súbelo para reiniciar los datos de ejemplo (admin/caseta)

// --- Datos de ejemplo (admin/caseta, aún locales) -------------------------
const credencialesSeed = [
  { id_credencial: 1, codigo_qr: 'QR-UP230571-XYZ', estado: 'ACTIVA', fecha_emision: '2026-01-15T09:00:00.000Z', fecha_vencimiento: '2026-12-31T23:59:59.000Z', id_usuario: 1 },
  { id_credencial: 2, codigo_qr: 'QR-UP230164-ABC', estado: 'ACTIVA', fecha_emision: '2026-01-15T09:10:00.000Z', fecha_vencimiento: '2026-12-31T23:59:59.000Z', id_usuario: 2 },
  { id_credencial: 3, codigo_qr: 'QR-EMP0123-DOC', estado: 'ACTIVA', fecha_emision: '2026-01-10T09:00:00.000Z', fecha_vencimiento: '2027-08-31T23:59:59.000Z', id_usuario: 3 },
  { id_credencial: 4, codigo_qr: 'QR-UP229988-OLD', estado: 'REVOCADA', fecha_emision: '2025-08-01T09:00:00.000Z', fecha_vencimiento: '2025-12-31T23:59:59.000Z', id_usuario: 4 },
];

const accesosSeed = [
  { id_acceso: 1, fecha_hora: '2026-07-10T08:14:00.000Z', tipo_evento: 'ENTRADA', resultado: 'PERMITIDO', punto_nombre: 'Entrada Principal', id_usuario: 1 },
  { id_acceso: 2, fecha_hora: '2026-07-10T10:02:00.000Z', tipo_evento: 'ENTRADA', resultado: 'PERMITIDO', punto_nombre: 'Edificio A', id_usuario: 2 },
  { id_acceso: 3, fecha_hora: '2026-07-10T09:02:00.000Z', tipo_evento: 'ENTRADA', resultado: 'PERMITIDO', punto_nombre: 'Estacionamiento', id_usuario: 3 },
  { id_acceso: 4, fecha_hora: '2026-07-10T09:15:00.000Z', tipo_evento: 'ENTRADA', resultado: 'DENEGADO', punto_nombre: 'Entrada Principal', id_usuario: 4 },
  { id_acceso: 5, fecha_hora: '2026-07-09T18:45:00.000Z', tipo_evento: 'SALIDA', resultado: 'PERMITIDO', punto_nombre: 'Estacionamiento', id_usuario: 1 },
];

const visitantesSeed = [
  { id_visitante: 1, nombre: 'Carlos Méndez', identificacion: 'INE-1042', empresa: 'Proveedora S.A.', motivo: 'Entrega de material', destino: 'Servicios Escolares', fecha_inicio: '2026-07-10T08:00:00.000Z', fecha_fin: '2026-07-10T14:00:00.000Z', estatus: 'VIGENTE', tipo: 'VISITANTE' },
];

// Atajo para guardar cualquier arreglo en localStorage bajo una llave.
function set(key, val) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val));
}

// --- Thunks conectados al BACKEND (flujo del alumno) ----------------------
// cargarMiCredencial: trae la credencial propia (/credenciales/mia) y el
// historial propio (/accesos/mios) del usuario autenticado.
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
      // 404 = el usuario aún no tiene credencial asignada (no es un error grave).
      if (err.response?.status === 404) return { credencial: null, accesos: [] };
      return rejectWithValue(err.response?.data?.error || 'No se pudo cargar tu credencial.');
    }
  }
);

// reportarPerdida: el alumno reporta SU credencial como perdida → se revoca.
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

const accessSlice = createSlice({
  name: 'access', // rama state.access
  initialState: {
    // Alumno (backend)
    miCredencial: null,
    misAccesos: [],
    cargandoMia: false,
    // Admin/caseta (localStorage, por ahora)
    credenciales: [],
    accesos: [],
    visitantes: [],
    inicializado: false,
  },
  reducers: {
    // cargarAccesosYCredenciales: llena las tres listas (resiembra si cambió la versión).
    cargarAccesosYCredenciales: (state) => {
      if (typeof window === 'undefined') return;
      const version = localStorage.getItem('sicad_v_access');
      if (version !== SEED_VERSION) {
        set('sicad_credenciales', credencialesSeed);
        set('sicad_accesos', accesosSeed);
        set('sicad_visitantes', visitantesSeed);
        localStorage.setItem('sicad_v_access', SEED_VERSION);
        state.credenciales = credencialesSeed;
        state.accesos = accesosSeed;
        state.visitantes = visitantesSeed;
      } else {
        state.credenciales = JSON.parse(localStorage.getItem('sicad_credenciales') || '[]');
        state.accesos = JSON.parse(localStorage.getItem('sicad_accesos') || '[]');
        state.visitantes = JSON.parse(localStorage.getItem('sicad_visitantes') || '[]');
      }
      state.inicializado = true;
    },
    // registrarAcceso: agrega un evento a la bitácora (lo pone al inicio = más reciente).
    registrarAcceso: (state, action) => {
      const nuevo = {
        ...action.payload,
        id_acceso: state.accesos.length ? Math.max(...state.accesos.map((a) => a.id_acceso)) + 1 : 1,
        fecha_hora: new Date().toISOString(),
      };
      state.accesos.unshift(nuevo);
      set('sicad_accesos', state.accesos);
    },
    // cambiarEstadoCredencial: pone la credencial de un usuario en ACTIVA/REVOCADA/etc.
    cambiarEstadoCredencial: (state, action) => {
      const { id_usuario, estado } = action.payload;
      const i = state.credenciales.findIndex((c) => c.id_usuario === id_usuario);
      if (i !== -1) {
        state.credenciales[i].estado = estado;
      } else {
        state.credenciales.push({
          id_credencial: state.credenciales.length ? Math.max(...state.credenciales.map((c) => c.id_credencial)) + 1 : 1,
          codigo_qr: `QR-USER${id_usuario}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          estado,
          fecha_emision: new Date().toISOString(),
          fecha_vencimiento: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          id_usuario,
        });
      }
      set('sicad_credenciales', state.credenciales);
    },
    // renovarVigencia: cambia la fecha de vencimiento de la credencial de un usuario.
    renovarVigencia: (state, action) => {
      const { id_usuario, fecha_vencimiento } = action.payload;
      const i = state.credenciales.findIndex((c) => c.id_usuario === id_usuario);
      if (i !== -1) {
        state.credenciales[i].fecha_vencimiento = fecha_vencimiento;
        if (state.credenciales[i].estado === 'VENCIDA') state.credenciales[i].estado = 'ACTIVA';
        set('sicad_credenciales', state.credenciales);
      }
    },
    // registrarVisitante: alta de un externo con pase temporal (lo usa la caseta).
    registrarVisitante: (state, action) => {
      const nuevo = {
        ...action.payload,
        id_visitante: state.visitantes.length ? Math.max(...state.visitantes.map((v) => v.id_visitante)) + 1 : 1,
        estatus: 'VIGENTE',
      };
      state.visitantes.unshift(nuevo);
      set('sicad_visitantes', state.visitantes);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cargarMiCredencial.pending, (state) => {
        state.cargandoMia = true;
      })
      .addCase(cargarMiCredencial.fulfilled, (state, action) => {
        state.cargandoMia = false;
        state.miCredencial = action.payload.credencial;
        state.misAccesos = action.payload.accesos;
        state.inicializado = true;
      })
      .addCase(cargarMiCredencial.rejected, (state) => {
        state.cargandoMia = false;
        state.inicializado = true;
      })
      .addCase(reportarPerdida.fulfilled, (state, action) => {
        state.miCredencial = action.payload;
      });
  },
});

export const {
  cargarAccesosYCredenciales,
  registrarAcceso,
  cambiarEstadoCredencial,
  renovarVigencia,
  registrarVisitante,
} = accessSlice.actions;
export default accessSlice.reducer;
