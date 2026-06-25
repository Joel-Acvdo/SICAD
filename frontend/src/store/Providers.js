'use client';

// Envuelve la app con el Provider de Redux.
import { Provider } from 'react-redux';
import { store } from './store';

export default function Providers({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
