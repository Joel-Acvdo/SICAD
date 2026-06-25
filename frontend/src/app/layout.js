import './globals.css';
import Providers from '@/store/Providers';

export const metadata = {
  title: 'SICAD — Control de Acceso Digital',
  description: 'Sistema de Control de Acceso Digital · UPA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
