// Estado global de los USUARIOS de la comunidad (alumnos y personal).
// Modo demo: los datos viven en localStorage (aún no hay backend conectado).
import { createSlice } from '@reduxjs/toolkit';

// Sube este número para reiniciar los datos de ejemplo en el navegador.
const SEED_VERSION = '3';

// Datos de ejemplo (coinciden con los mockups de Pencil).
const usuariosSeed = [
  { id_usuario: 1, nombre: 'Joel Alberto', apellidos: 'Acevedo Moreno', correo: 'joel.acevedo@upa.edu.mx', matricula_empleado: 'UP230571', tipo: 'ALUMNO', carrera: 'Ing. en Sistemas Computacionales', estatus: 'ACTIVO', fecha_registro: '2026-01-15T09:00:00.000Z' },
  { id_usuario: 2, nombre: 'Andrei', apellidos: 'Torres Sánchez', correo: 'andrei.torres@upa.edu.mx', matricula_empleado: 'UP230164', tipo: 'ALUMNO', carrera: 'Ing. en Sistemas Computacionales', estatus: 'ACTIVO', fecha_registro: '2026-01-15T09:10:00.000Z' },
  { id_usuario: 3, nombre: 'María Fernanda', apellidos: 'Pérez', correo: 'maria.perez@upa.edu.mx', matricula_empleado: 'EMP0123', tipo: 'DOCENTE', carrera: 'Departamento de Docencia', estatus: 'ACTIVO', fecha_registro: '2026-01-10T09:00:00.000Z' },
  { id_usuario: 4, nombre: 'Luis', apellidos: 'Ramírez Gómez', correo: 'luis.ramirez@upa.edu.mx', matricula_empleado: 'UP229988', tipo: 'ALUMNO', carrera: 'Ing. Industrial', estatus: 'INACTIVO', fecha_registro: '2025-08-01T09:00:00.000Z' },
  { id_usuario: 5, nombre: 'Servicios', apellidos: 'Escolares', correo: 'admin@upa.edu.mx', matricula_empleado: 'EMP1001', tipo: 'ADMINISTRATIVO', carrera: 'Administración', estatus: 'ACTIVO', fecha_registro: '2026-01-01T08:00:00.000Z' },
  { id_usuario: 6, nombre: 'Caseta', apellidos: 'Seguridad', correo: 'caseta@upa.edu.mx', matricula_empleado: 'EMP1002', tipo: 'SEGURIDAD', carrera: 'Vigilancia', estatus: 'ACTIVO', fecha_registro: '2026-01-01T06:00:00.000Z' },
];

function guardar(lista) {
  if (typeof window !== 'undefined') localStorage.setItem('sicad_usuarios', JSON.stringify(lista));
}

const userSlice = createSlice({
  name: 'users',
  initialState: { lista: [], inicializado: false },
  reducers: {
    // Carga los usuarios; si la versión de datos cambió, reinicia con el seed.
    cargarUsuarios: (state) => {
      if (typeof window === 'undefined') return;
      const version = localStorage.getItem('sicad_v_users');
      const guardados = localStorage.getItem('sicad_usuarios');
      if (version !== SEED_VERSION || !guardados) {
        localStorage.setItem('sicad_usuarios', JSON.stringify(usuariosSeed));
        localStorage.setItem('sicad_v_users', SEED_VERSION);
        state.lista = usuariosSeed;
      } else {
        state.lista = JSON.parse(guardados);
      }
      state.inicializado = true;
    },
    agregarUsuario: (state, action) => {
      const nuevo = {
        ...action.payload,
        id_usuario: state.lista.length ? Math.max(...state.lista.map((u) => u.id_usuario)) + 1 : 1,
        fecha_registro: new Date().toISOString(),
        estatus: action.payload.estatus || 'ACTIVO',
      };
      state.lista.push(nuevo);
      guardar(state.lista);
    },
    actualizarUsuario: (state, action) => {
      const i = state.lista.findIndex((u) => u.id_usuario === action.payload.id_usuario);
      if (i !== -1) {
        state.lista[i] = { ...state.lista[i], ...action.payload };
        guardar(state.lista);
      }
    },
    cambiarEstatusUsuario: (state, action) => {
      const { id_usuario, estatus } = action.payload;
      const i = state.lista.findIndex((u) => u.id_usuario === id_usuario);
      if (i !== -1) {
        state.lista[i].estatus = estatus;
        guardar(state.lista);
      }
    },
  },
});

export const { cargarUsuarios, agregarUsuario, actualizarUsuario, cambiarEstatusUsuario } = userSlice.actions;
export default userSlice.reducer;
