/**
 * Utilitário para usar o dicionário de variáveis do Censo Escolar 2025.
 * Fornece: descrição legível e mapeamento de categorias para cada campo.
 */
import dictMapRaw from "@/data/dict-map.json";

export interface DictEntry {
  descricao: string;
  categoria: Record<string, string> | null;
}

const dictMap = dictMapRaw as Record<string, DictEntry>;

/** Retorna o label legível de um campo (ou o próprio key se não encontrado). */
export function getLabel(key: string): string {
  return dictMap[key]?.descricao || key;
}

/**
 * Traduz o valor de um campo usando o mapa de categorias.
 * Ex: getValueLabel("TP_DEPENDENCIA", 2) → "Estadual"
 * Retorna o valor original formatado se não houver mapeamento.
 */
export function getValueLabel(key: string, value: unknown): string {
  const entry = dictMap[key];
  if (entry?.categoria && value !== null && value !== undefined) {
    const strVal = String(value);
    return entry.categoria[strVal] ?? String(value);
  }
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value ?? "");
}

/** Retorna a entrada completa do dicionário para um campo. */
export function getDictEntry(key: string): DictEntry | null {
  return dictMap[key] ?? null;
}

/** Verifica se o campo tem categorias mapeadas. */
export function hasCategoryMap(key: string): boolean {
  return !!dictMap[key]?.categoria;
}
