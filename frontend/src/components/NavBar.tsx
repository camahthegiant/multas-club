"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Jugadores" },
  { href: "/estadisticas", label: "Estadísticas" },
];

// Mismo patrón que el NavBar de Gast-On: pestañas fijas abajo en móvil
// (alcance del pulgar), arriba integradas en escritorio, subrayado en la
// activa. Sin "Salir" porque estas páginas son públicas, sin login.
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-neutral-800 bg-black sm:relative sm:border-t-0 sm:border-b">
      <span className="absolute left-8 top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.3em] text-club-yellow sm:block">
        Multas
      </span>
      <div className="mx-auto flex max-w-2xl items-center justify-center px-6 py-3 sm:justify-end sm:py-6">
        <div className="flex w-full items-center justify-center gap-6 overflow-x-auto sm:w-auto sm:justify-end sm:gap-8">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "shrink-0 border-b-2 px-2 pb-1 text-[11px] font-medium uppercase tracking-widest transition-colors sm:text-xs",
                pathname === item.href
                  ? "border-club-green-bright text-neutral-100"
                  : "border-transparent text-neutral-500 hover:text-neutral-200"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
