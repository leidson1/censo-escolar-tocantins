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

/** Normaliza a chave para bater com o dicionário (Case insensitive e tratamento de underscores) */
function normalizeKey(key: string): string {
  const normalized = key.toUpperCase();
  // Mapeamentos específicos para campos comuns nos dashboards que usam nomes amigáveis no banco
  const aliases: Record<string, string> = {
    "CODIGO_DA_ESCOLA": "CO_ENTIDADE",
    "UNIDADE": "NO_ENTIDADE",
    "MUNICIPIO": "NO_MUNICIPIO"
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }
  
  // Se a chave não existe mas começa com prefixo conhecido sem underscore (ex: TPLOCALIZACAO -> TP_LOCALIZACAO)
  const prefixes = ["TP", "IN", "QT", "CO", "NU", "DS", "NO"];
  if (!dictMap[normalized]) {
    for (const p of prefixes) {
      if (normalized.startsWith(p) && normalized.length > 2 && normalized[2] !== "_") {
        const withUnderscore = p + "_" + normalized.substring(2);
        if (dictMap[withUnderscore]) {
          return withUnderscore;
        }
      }
    }
  }
  
  return normalized;
}

/** Retorna o label legível de um campo (ou o próprio key se não encontrado). */
export function getLabel(key: string): string {
  const normKey = normalizeKey(key);
  return dictMap[normKey]?.descricao || key;
}

/**
 * Traduz o valor de um campo usando o mapa de categorias.
 * Ex: getValueLabel("TP_DEPENDENCIA", 2) → "Estadual"
 * Retorna o valor original formatado se não houver mapeamento.
 */
export function getValueLabel(key: string, value: unknown): string {
  const normKey = normalizeKey(key);
  const entry = dictMap[normKey];
  
  // Specific category mapping from dictionary
  if (entry?.categoria && value !== null && value !== undefined) {
    const strVal = String(value);
    return entry.categoria[strVal] ?? String(value);
  }

  // Handle binary/null flags (1 = Sim, 0 = Não, null = Não Respondeu)
  // Skip "Não" for quantitative fields (QT_) - Case insensitive check
  const isQuantitative = normKey.startsWith("QT_") || normKey.startsWith("NU_") || normKey.startsWith("NUMERO_") || normKey.startsWith("QUANTIDADE_");

  if (value === 1 || value === "1") return isQuantitative ? "1" : "Sim";
  if (value === 0 || value === "0") return isQuantitative ? "0" : "Não";
  
  if (value === null || value === undefined || value === "") return "Não Respondeu";

  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value ?? "");
}

/** Retorna a entrada completa do dicionário para um campo. */
export function getDictEntry(key: string): DictEntry | null {
  const normKey = normalizeKey(key);
  return dictMap[normKey] ?? null;
}

/** Verifica se o campo tem categorias mapeadas. */
export function hasCategoryMap(key: string): boolean {
  const normKey = normalizeKey(key);
  return !!dictMap[normKey]?.categoria;
}
