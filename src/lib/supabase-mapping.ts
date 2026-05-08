/**
 * Map Supabase column names to the legacy JSON names used in the UI
 */
export const mapGenericData = (row: any): Record<string, any> => {
  if (!row) return {};
  
  // Helper for numeric conversion
  const n = (v: unknown) => Number(v || 0);

  return {
    ...row,
    CO_ENTIDADE: n(row.codigo_da_escola || (row.nome_da_escola && /^\d+$/.test(row.nome_da_escola) ? row.nome_da_escola : 0) || row.co_entidade),
    NO_ENTIDADE: (row.unidade && !/^\d+$/.test(row.unidade)) ? row.unidade : (row.nome_da_escola || row.unidade),
    UNIDADE: (row.unidade && !/^\d+$/.test(row.unidade)) ? row.unidade : (row.nome_da_escola || row.unidade),
    NO_MUNICIPIO: row.municipio || row.nome_do_municipio,
    
    // Filters (handling different names)
    rede: n(row.tpdependencia || row.dependencia_administrativa || row.tp_dependencia || 0),
    local: n(row.tplocalizacao || row.localizacao || row.tp_localizacao || 0),
    localDif: n(row.tplocalizacaodiferenciada || row.localizacao_diferenciada_da_escola || 0),
    situacao: n(row.tpsituacaofuncionamento || row.situacao_de_funcionamento || 0),

    // Docentes
    QT_DOC_BAS: n(row.numero_de_docentes_da_educacao_basica || row.qt_doc_bas || 0),
    QT_DOC_INF: n(row.numero_de_docentes_da_educacao_infantil || 0),
    QT_DOC_FUND: n(row.numero_de_docentes_do_ensino_fundamental || row.qt_doc_fund || 0),
    QT_DOC_MED: n(row.numero_de_docentes_do_ensino_medio_regular || row.qt_doc_med || 0),
    
    // Docentes Post-grad (Independent fields)
    QT_DOC_BAS_ESCO_SUP_POS_ESPEC: n(row.numero_de_docentes_da_educacao_basica_posgraduacao_concluida_es || 0),
    QT_DOC_BAS_ESCO_SUP_POS_MESTRA: n(row.numero_de_docentes_da_educacao_basica_posgraduacao_concluida_me || 0),
    QT_DOC_BAS_ESCO_SUP_POS_DOUTO: n(row.numero_de_docentes_da_educacao_basica_posgraduacao_concluida_do || 0),
    QT_DOC_BAS_ESCO_SUP_POS_NENHUM: n(row.numero_de_docentes_da_educacao_basica_posgraduacao_concluida_na || 0),

    // Matrículas
    QT_MAT_BAS: n(row.numero_de_matriculas_da_educacao_basica || row.qt_mat_bas || 0),
    QT_MAT_INF: n(row.numero_de_matriculas_da_educacao_infantil || row.qt_mat_inf || 0),
    QT_MAT_FUND: n(row.numero_de_matriculas_do_ensino_fundamental || row.qt_mat_fund || 0),
    QT_MAT_FUND_AI: n(row.numero_de_matriculas_do_ensino_fundamental_anos_iniciais || row.qt_mat_fund_ai || 0),
    QT_MAT_FUND_AF: n(row.numero_de_matriculas_do_ensino_fundamental_anos_finais || row.qt_mat_fund_af || 0),
    QT_MAT_MED: n(row.numero_de_matriculas_do_ensino_medio_regular || row.qt_mat_med || 0),
    QT_MAT_PROF: n(row.numero_de_matriculas_da_educacao_profissional || row.qt_mat_prof || 0),
    QT_MAT_EJA: n(row.numero_de_matriculas_da_educacao_de_jovens_e_adultos_eja || row.qt_mat_eja || 0),

    // Turmas
    QT_TUR_BAS: n(row.numero_de_turmas_da_educacao_basica || row.qt_tur_bas || 0),
    QT_TUR_INF: n(row.numero_de_turmas_da_educacao_infantil || row.qt_tur_inf || 0),
    QT_TUR_FUND: n(row.numero_de_turmas_do_ensino_fundamental || row.qt_tur_fund || 0),
    QT_TUR_FUND_AI: n(row.numero_de_turmas_do_ensino_fundamental_anos_iniciais || row.qt_tur_fund_ai || 0),
    QT_TUR_FUND_AF: n(row.numero_de_turmas_do_ensino_fundamental_anos_finais || row.qt_tur_fund_af || 0),
    QT_TUR_MED: n(row.numero_de_turmas_do_ensino_medio_regular || row.qt_tur_med || 0),
    QT_TUR_PROF: n(row.numero_de_turmas_da_educacao_profissional || row.qt_tur_prof || 0),
    QT_TUR_EJA: n(row.numero_de_turmas_da_educacao_de_jovens_e_adultos_eja || row.qt_tur_eja || 0),

    // Gestores
    QT_GEST_BAS: n(row.numero_de_gestores_escolares_da_educacao_basica || row.qt_gest_bas || 0),
    QT_GEST_BAS_FEM: n(row.numero_de_gestores_escolares_da_educacao_basica_feminino || row.qt_gest_bas_fem || 0),
    QT_GEST_BAS_MASC: n(row.numero_de_gestores_escolares_da_educacao_basica_masculino || row.qt_gest_bas_masc || 0),
    QT_GEST_BAS_PCD: n(row.numero_de_gestores_escolares_da_educacao_basica_com_alguma_defi || row.qt_gest_bas_pcd || 0),
    
    // Gestores Ages
    QT_GEST_BAS_0_24: n(row.numero_de_gestores_escolares_da_educacao_basica_ate_24_anos_de_ || row.qt_gest_bas_0_24 || 0),
    QT_GEST_BAS_25_29: n(row.numero_de_gestores_escolares_da_educacao_basica_entre_25_e_29_a || row.qt_gest_bas_25_29 || 0),
    QT_GEST_BAS_30_39: n(row.numero_de_gestores_escolares_da_educacao_basica_entre_30_e_39_a || row.qt_gest_bas_30_39 || 0),
    QT_GEST_BAS_40_49: n(row.numero_de_gestores_escolares_da_educacao_basica_entre_40_e_49_a || row.qt_gest_bas_40_49 || 0),
    QT_GEST_BAS_50_54: n(row.numero_de_gestores_escolares_da_educacao_basica_entre_50_e_54_a || row.qt_gest_bas_50_54 || 0),
    QT_GEST_BAS_55_59: n(row.numero_de_gestores_escolares_da_educacao_basica_entre_55_e_59_a || row.qt_gest_bas_55_59 || 0),
    QT_GEST_BAS_60_MAIS: n(row.numero_de_gestores_escolares_da_educacao_basica_com_60_ou_mais_ || row.qt_gest_bas_60_mais || 0),

    // Gestores Education
    QT_GEST_BAS_ESCO_EF: n(row.qt_gest_bas_esco_ef || 0),
    QT_GEST_BAS_ESCO_EM: n(row.qt_gest_bas_esco_em || 0),
    QT_GEST_BAS_ESCO_SUP_GRAD: n(row.qt_gest_bas_esco_sup_grad || 0),
    QT_GEST_BAS_ESCO_SUP_GRAD_LICEN: n(row.qt_gest_bas_esco_sup_grad_licen || 0),
    QT_GEST_BAS_ESCO_SUP_POS_ESPEC: n(row.qt_gest_bas_esco_sup_pos_espec || 0),
    QT_GEST_BAS_ESCO_SUP_POS_MESTRA: n(row.qt_gest_bas_esco_sup_pos_mestra || 0),
    QT_GEST_BAS_ESCO_SUP_POS_DOUTO: n(row.qt_gest_bas_esco_sup_pos_douto || 0),
    QT_GEST_BAS_ESCO_SUP_POS_NENHUM: n(row.qt_gest_bas_esco_sup_pos_nenhum || 0),

    // Access to cargo
    QT_GEST_BAS_ACESSO_CARGO_INDIC: n(row.qt_gest_bas_acesso_cargo_indic || 0),
    QT_GEST_BAS_ACESSO_CARGO_ELEIC: n(row.qt_gest_bas_acesso_cargo_eleic || 0),
    QT_GEST_BAS_ACESSO_CARGO_CONC: n(row.qt_gest_bas_acesso_cargo_conc || 0),
    QT_GEST_BAS_ACESSO_CARGO_SEL: n(row.qt_gest_bas_acesso_cargo_sel || 0),
    QT_GEST_BAS_ACESSO_CARGO_PROP: n(row.qt_gest_bas_acesso_cargo_prop || 0),
    QT_GEST_BAS_ACESSO_CARGO_P_SEL: n(row.qt_gest_bas_acesso_cargo_p_sel || 0),
    QT_GEST_BAS_ACESSO_CARGO_OUTRO: n(row.qt_gest_bas_acesso_cargo_outro || 0),

    // Vinculo and Specialization
    QT_GEST_BAS_VINCULO_CONCUR: n(row.qt_gest_bas_vinculo_concur || 0),
    QT_GEST_BAS_VINCULO_CONTRA: n(row.qt_gest_bas_vinculo_contra || 0),
    QT_GEST_BAS_DIRETOR: n(row.qt_gest_bas_diretor || 0),
    QT_GEST_BAS_OUTRO: n(row.qt_gest_bas_outro || 0),
    QT_GEST_BAS_ESPEC_GESTAO: n(row.qt_gest_bas_espec_gestao || 0),
    QT_GEST_BAS_ESPEC_EDUC_TIC: n(row.qt_gest_bas_espec_educ_tic || 0),
    QT_GEST_BAS_ESPEC_NENHUM: n(row.qt_gest_bas_espec_nenhum || 0),

    // Cursos Técnicos
    QT_CURSO_TEC: n(row.numero_de_cursos_tecnicos || 0),
    QT_MAT_CURSO_TEC: n(row.numero_de_matriculas_em_cursos_tecnicos || 0),
    QT_MAT_CURSO_TEC_CONC: n(row.qt_mat_curso_tec_conc || 0),
    QT_MAT_CURSO_TEC_EJA: n(row.numero_de_matriculas_em_cursos_tecnicos_curso_tecnico_integrado || 0),
    QT_MAT_CURSO_TEC_SUBS: n(row.qt_mat_curso_tec_subs || 0),
    QT_MAT_CURSO_TEC_IFTP_CT: n(row.numero_de_matriculas_em_cursos_tecnicos_da_educacao_profissiona || 0),
    QT_MAT_CURSO_TEC_IFTP: n(row.numero_de_matriculas_em_cursos_tecnicos_ensino_medio_regular_ar || 0),
    QT_MAT_CURSO_TEC_NM: n(row.numero_de_matriculas_em_cursos_tecnicos_ensino_medio_regular_mo || 0),
    NO_CURSO_EDUC_PROFISSIONAL: row.nome_do_cursos_tecnico,
    NO_AREA_CURSO_PROFISSIONAL: row.nome_da_area_do_curso_tecnico,
  };
};

export const mapSchoolData = (supabaseRow: any): Record<string, any> => {
  if (!supabaseRow) return {};

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
    // Infrastructure Mapping
    IN_AGUA_POTAVEL: supabaseRow.fornece_agua_potavel_para_o_consumo_humano,
    IN_ENERGIA_REDE_PUBLICA: supabaseRow.abastecimento_de_energia_eletrica_rede_publica,
    IN_ESGOTO_REDE_PUBLICA: supabaseRow.esgoto_sanitario_rede_publica,
    IN_LIXO_SERVICO_COLETA: supabaseRow.destinacao_do_lixo_servico_de_coleta,
    IN_ALIMENTACAO: supabaseRow.fornece_alimentacao_escolar_para_os_alunos,
    IN_INTERNET: supabaseRow.acesso_a_internet,
    IN_BANDA_LARGA: supabaseRow.acesso_a_internet_banda_larga,
    IN_LABORATORIO_INFORMATICA: supabaseRow.dependencia_fisica_laboratorio_de_informatica,
    QT_DESKTOP_ALUNO: supabaseRow.quantidade_de_computadores_desktop_em_uso_pelos_alunos,
    
    // Fields expected by CensoDashboard
    id: Number(supabaseRow.codigo_da_escola),
    nome: supabaseRow.nome_da_escola || "Sem nome",
    municipio: supabaseRow.nome_do_municipio || "Não informado",
    rede: Number(supabaseRow.dependencia_administrativa),
    local: Number(supabaseRow.localizacao),
    internet: Number(supabaseRow.acesso_a_internet) === 1,
    salas: Number(supabaseRow.numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p || 0),
  };
};

export const mapSchoolSummary = (row: any): Record<string, any> => {
  return {
    id: Number(row.codigo_da_escola),
    nome: row.nome_da_escola || "Sem nome",
    municipio: row.nome_do_municipio || "Não informado",
    rede: Number(row.dependencia_administrativa),
    local: Number(row.localizacao),
    localDiferenciada: Number(row.localizacao_diferenciada_da_escola || 0),
    situacao: Number(row.situacao_de_funcionamento || 0),
    internet: Number(row.acesso_a_internet) === 1,
    salas: Number(row.numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p || 0),
  };
};
