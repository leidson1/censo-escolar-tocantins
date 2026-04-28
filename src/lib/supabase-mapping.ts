/**
 * Map Supabase column names to the legacy JSON names used in the UI
 */
export const mapGenericData = (row: any) => {
  if (!row) return null;
  return {
    ...row,
    CO_ENTIDADE: Number(row.codigo_da_escola || row.co_entidade),
    NO_ENTIDADE: row.unidade || row.nome_da_escola,
    UNIDADE: row.unidade || row.nome_da_escola, // GestoresDashboard uses UNIDADE
    NO_MUNICIPIO: row.municipio,
    // Docentes
    QT_DOC_BAS: row.numero_de_docentes_da_educacao_basica,
    QT_DOC_FUND: row.numero_de_docentes_do_ensino_fundamental,
    QT_DOC_MED: row.numero_de_docentes_do_ensino_medio_regular,
    // Matrículas
    QT_MAT_BAS: row.numero_de_matriculas_da_educacao_basica,
    QT_MAT_FUND: row.numero_de_matriculas_do_ensino_fundamental,
    QT_MAT_MED: row.numero_de_matriculas_do_ensino_medio_regular,
    // Turmas
    QT_TUR_BAS: row.numero_de_turmas_da_educacao_basica,
    QT_TUR_FUND: row.numero_de_turmas_do_ensino_fundamental,
    QT_TUR_MED: row.numero_de_turmas_do_ensino_medio_regular,
    // Gestores
    QT_GEST_BAS: row.numero_de_gestores_escolares_da_educacao_basica,
    // Cursos Técnicos
    QT_CURSO_TEC: row.numero_de_cursos_tecnicos,
    QT_MAT_CURSO_TEC: row.numero_de_matriculas_em_cursos_tecnicos,
    NO_CURSO_EDUC_PROFISSIONAL: row.nome_do_cursos_tecnico,
    NO_AREA_CURSO_PROFISSIONAL: row.nome_da_area_do_curso_tecnico,
  };
};

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
