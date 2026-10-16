// Recorte de escudo FIFA compartido por todas las cartas (la de la rejilla y
// la grande del detalle). Un único <clipPath> montado una vez en el layout,
// referenciado por el resto vía `clip-path: url(#carta-shield)` — con
// clipPathUnits="objectBoundingBox" se reescala solo al tamaño de cada
// elemento que lo use, así que una carta pequeña y una grande comparten
// exactamente el mismo contorno sin duplicar el path.
export function CartaShieldDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <clipPath id="carta-shield" clipPathUnits="objectBoundingBox">
          <path
            d="M0.12,0 L0.88,0
               C0.95,0 1,0.05 1,0.12
               L1,0.80 C1,0.885 0.955,0.935 0.885,0.96
               L0.5,1 L0.115,0.96
               C0.045,0.935 0,0.885 0,0.80
               L0,0.12 C0,0.05 0.05,0 0.12,0 Z"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
