// Abreviaturas de 3 letras para las "stats" de la carta FIFA. Las 5
// infracciones de seed tienen una fija y reconocible; cualquier tipo nuevo
// que el admin añada cae al fallback (primeras 3 letras en mayúscula) para
// no romper si el admin mete un tipo que no estaba previsto aquí.
const ABREVIATURAS: Record<string, string> = {
  "Retraso en la convocatoria": "RET",
  "No llevar la camiseta de calentamiento": "CAM",
  "Tarjeta amarilla por conducta evitable": "AMA",
  "Protestas evitables al árbitro": "PRO",
  "Tarjeta roja por conducta antideportiva": "ROJ",
};

export function abreviaturaTipo(nombre: string): string {
  return ABREVIATURAS[nombre] ?? nombre.slice(0, 3).toUpperCase();
}
