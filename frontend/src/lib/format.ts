export function formatEUR(valor: string | number): string {
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  return num.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function formatFecha(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}
