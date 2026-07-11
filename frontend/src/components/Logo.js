// Logo SICAD (insignia NFC + wordmark). Se usa en los logins.
export default function Logo({ conTexto = true }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-marino font-black tracking-wider text-white">
        NFC
      </div>
      {conTexto && (
        <div className="text-center leading-tight">
          <p className="text-2xl font-black tracking-wide text-marino">SICAD</p>
          <p className="text-[11px] font-semibold text-azulmedio">Control de Acceso Digital</p>
        </div>
      )}
    </div>
  );
}
