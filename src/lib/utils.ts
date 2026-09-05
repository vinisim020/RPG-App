export function cn(...partes: Array<string | false | null | undefined>) {
  return partes.filter(Boolean).join(" ");
}

export function paraInt(v: FormDataEntryValue | null | undefined, padrao = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.trunc(n) : padrao;
}

export function texto(v: FormDataEntryValue | null | undefined) {
  return String(v ?? "").trim();
}

export function limitar(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function dataBR(d: Date | string) {
  const data = typeof d === "string" ? new Date(d) : d;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
