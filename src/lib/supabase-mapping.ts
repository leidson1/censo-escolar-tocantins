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
    rede: Number(row.tpdependencia || 0),
    local: Number(row.tplocalizacao || 0),
    localDif: Number(row.tplocalizacaodiferenciada || 0),
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
    QT_GEST_BAS: Number(row.numero_de_gestores_escolares_da_educacao_basica || row.qt_gest_bas || 0),
    QT_GEST_BAS_FEM: Number(row.numero_de_gestores_escolares_da_educacao_basica_feminino || row.qt_gest_bas_fem || 0),
    QT_GEST_BAS_MASC: Number(row.numero_de_gestores_escolares_da_educacao_basica_masculino || row.qt_gest_bas_masc || 0),
    QT_GEST_BAS_BRANCA: Number(row.numero_de_gestores_escolares_da_educacao_basica_corraca_branca || row.qt_gest_bas_branca || 0),
    QT_GEST_BAS_PRETA: Number(row.numero_de_gestores_escolares_da_educacao_basica_corraca_preta || row.qt_gest_bas_preta || 0),
    QT_GEST_BAS_PARDA: Number(row.numero_de_gestores_escolares_da_educacao_basica_corraca_parda || row.qt_gest_bas_parda || 0),
    QT_GEST_BAS_AMARELA: Number(row.numero_de_gestores_escolares_da_educacao_basica_corraca_amarela || row.qt_gest_bas_amarela || 0),
    QT_GEST_BAS_INDIGENA: Number(row.numero_de_gestores_escolares_da_educacao_basica_corraca_indigen || row.qt_gest_bas_indigena || 0),
    QT_GEST_BAS_PCD: Number(row.numero_de_gestores_escolares_da_educacao_basica_com_alguma_defi || row.qt_gest_bas_pcd || 0),
    
    // Ages
    QT_GEST_BAS_0_24: Number(row.numero_de_gestores_escolares_da_educacao_basica_ate_24_anos_de_ || row.qt_gest_bas_0_24 || 0),
    QT_GEST_BAS_25_29: Number(row.numero_de_gestores_escolares_da_educacao_basica_entre_25_e_29_a || row.qt_gest_bas_25_29 || 0),
    QT_GEST_BAS_30_39: Number(row.numero_de_gestores_escolares_da_educacao_basica_entre_30_e_39_a || row.qt_gest_bas_30_39 || 0),
    QT_GEST_BAS_40_49: Number(row.numero_de_gestores_escolares_da_educacao_basica_entre_40_e_49_a || row.qt_gest_bas_40_49 || 0),
    QT_GEST_BAS_50_54: Number(row.numero_de_gestores_escolares_da_educacao_basica_entre_50_e_54_a || row.qt_gest_bas_50_54 || 0),
    QT_GEST_BAS_55_59: Number(row.numero_de_gestores_escolares_da_educacao_basica_entre_55_e_59_a || row.qt_gest_bas_55_59 || 0),
    QT_GEST_BAS_60_MAIS: Number(row.numero_de_gestores_escolares_da_educacao_basica_com_60_ou_mais_ || row.qt_gest_bas_60_mais || 0),

    // Education
    QT_GEST_BAS_ESCO_EF: Number(row.qt_gest_bas_esco_ef || 0),
    QT_GEST_BAS_ESCO_EM: Number(row.qt_gest_bas_esco_em || 0),
    QT_GEST_BAS_ESCO_SUP_GRAD: Number(row.qt_gest_bas_esco_sup_grad || 0),
    QT_GEST_BAS_ESCO_SUP_GRAD_LICEN: Number(row.qt_gest_bas_esco_sup_grad_licen || 0),
    QT_GEST_BAS_ESCO_SUP_POS_ESPEC: Number(row.qt_gest_bas_esco_sup_pos_espec || 0),
    QT_GEST_BAS_ESCO_SUP_POS_MESTRA: Number(row.qt_gest_bas_esco_sup_pos_mestra || 0),
    QT_GEST_BAS_ESCO_SUP_POS_DOUTO: Number(row.qt_gest_bas_esco_sup_pos_douto || 0),
    QT_GEST_BAS_ESCO_SUP_POS_NENHUM: Number(row.qt_gest_bas_esco_sup_pos_nenhum || 0),

    // Access to cargo
    QT_GEST_BAS_ACESSO_CARGO_INDIC: Number(row.qt_gest_bas_acesso_cargo_indic || 0),
    QT_GEST_BAS_ACESSO_CARGO_ELEIC: Number(row.qt_gest_bas_acesso_cargo_eleic || 0),
    QT_GEST_BAS_ACESSO_CARGO_CONC: Number(row.qt_gest_bas_acesso_cargo_conc || 0),
    QT_GEST_BAS_ACESSO_CARGO_SEL: Number(row.qt_gest_bas_acesso_cargo_sel || 0),
    QT_GEST_BAS_ACESSO_CARGO_PROP: Number(row.qt_gest_bas_acesso_cargo_prop || 0),
    QT_GEST_BAS_ACESSO_CARGO_P_SEL: Number(row.qt_gest_bas_acesso_cargo_p_sel || 0),
    QT_GEST_BAS_ACESSO_CARGO_OUTRO: Number(row.qt_gest_bas_acesso_cargo_outro || 0),

    // Vínculo e Função
    QT_GEST_BAS_VINCULO_CONCUR: Number(row.qt_gest_bas_vinculo_concur || 0),
    QT_GEST_BAS_VINCULO_CONTRA: Number(row.qt_gest_bas_vinculo_contra || 0),
    QT_GEST_BAS_DIRETOR: Number(row.qt_gest_bas_diretor || 0),
    QT_GEST_BAS_OUTRO: Number(row.qt_gest_bas_outro || 0),

    // Formação Específica
    QT_GEST_BAS_ESPEC_GESTAO: Number(row.qt_gest_bas_espec_gestao || 0),
    QT_GEST_BAS_ESPEC_EDUC_TIC: Number(row.qt_gest_bas_espec_educ_tic || 0),
    QT_GEST_BAS_ESPEC_NENHUM: Number(row.qt_gest_bas_espec_nenhum || 0),
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

export const mapSchoolSummary = (row: any) => {
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
