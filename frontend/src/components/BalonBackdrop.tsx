// Marca de agua decorativa: un balón de rugby solo de contorno girando
// despacio de fondo, equivalente al € de Gast-On pero con los colores y el
// tema del club. Fixed + z negativo para quedar detrás del contenido en
// todas las páginas sin moverse con el scroll.
export function BalonBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden"
    >
      <svg
        className="h-[110vmin] w-[110vmin] animate-spin-slow text-emerald-500/[0.07]"
        viewBox="0 0 100 100"
      >
        <ellipse
          cx="50"
          cy="50"
          rx="46"
          ry="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
        />
        <path d="M 6 50 Q 50 36 94 50" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <path d="M30 42 L30 58 M42 38 L42 62 M58 38 L58 62 M70 42 L70 58" stroke="currentColor" strokeWidth="0.6" />
      </svg>
    </div>
  );
}
