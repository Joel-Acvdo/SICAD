'use client';

// Pestañas del portal de caseta: Validar alumno / Registrar externo / Bitácora.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/caseta/validar', label: 'Validar alumno' },
  { href: '/caseta/externos', label: 'Registrar externo' },
  { href: '/caseta/bitacora', label: 'Bitácora' },
];

export default function TabsCaseta() {
  const path = usePathname();
  return (
    <nav className="border-b border-platino-light bg-white">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2">
        {tabs.map((t) => {
          const activo = path === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
                activo ? 'bg-marino text-white' : 'text-marino hover:bg-platino-light'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
