/**
 * Map Supabase column names to the legacy JSON names used in the UI
 */
export const mapSchoolData = (supabaseRow: any) => {
  if (!supabaseRow) return null;

  return {
    ...supabaseRow,
    // Add legacy names for compatibility with dictionary
    CO_ENTIDADE: Number(supabaseRow.codigo_da_escola),
    NO_ENTIDADE: supabaseRow.nome_da_escola,
    NO_MUNICIPIO: supabaseRow.nome_do_municipio,
    TP_DEPENDENCIA: Number(supabaseRow.dependencia_administrativa),
    TP_LOCALIZACAO: Number(supabaseRow.localizacao),
    DS_ENDERECO: supabaseRow.endereco,
    NU_ENDERECO: supabaseRow.numero,
    DS_COMPLEMENTO: supabaseRow.complemento,
    NO_BAIRRO: supabaseRow.bairro,
    CO_CEP: supabaseRow.cep,
    NU_DDD: supabaseRow.ddd,
    NU_TELEFONE: supabaseRow.telefone,
    TP_SITUACAO_FUNCIONAMENTO: Number(supabaseRow.situacao_de_funcionamento),
    // Fields expected by CensoDashboard
    id: Number(supabaseRow.codigo_da_escola),
    nome: supabaseRow.nome_da_escola || "Sem nome",
    municipio: supabaseRow.nome_do_municipio || "Não informado",
    rede: Number(supabaseRow.dependencia_administrativa),
    local: Number(supabaseRow.localizacao),
    internet: !!supabaseRow.acesso_a_internet,
    salas: Number(supabaseRow.numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p || 0),
  };
};

export const mapSchoolSummary = (row: any) => {
  return {
    id: Number(row.codigo_da_escola),
    nome: row.nome_da_escola || "Sem nome",
    municipio: row.nome_do_municipio || "Não informado",
    rede: Number(row.dependencia_administrativa),
    local: Number(row.localizacao),
    internet: !!row.acesso_a_internet,
    salas: Number(row.numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p || 0),
  };
};
