'use client'; // Componente de cliente: Redux vive en el navegador, no en el servidor.

// Providers.js — Conecta el store de Redux con TODA la app.
// Se usa una sola vez, en app/layout.js, envolviendo {children}.

// Provider: componente de react-redux que "reparte" el store a todos los
// componentes hijos para que puedan usar useSelector / useDispatch.
import { Provider } from 'react-redux';
// store: el estado global que definimos en store.js.
import { store } from './store';

// Recibe {children} (todas las páginas) y las envuelve con el Provider.
export default function Providers({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
