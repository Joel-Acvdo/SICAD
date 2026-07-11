import { redirect } from 'next/navigation';

// La raíz manda al login de la comunidad.
export default function Home() {
  redirect('/login');
}
