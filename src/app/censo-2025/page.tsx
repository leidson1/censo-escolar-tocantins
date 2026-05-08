import MainLayout from "@/components/layout/MainLayout";
import DatasetSelector from "@/components/censo/DatasetSelector";

export const metadata = {
  title: "Censo Escolar 2025 | Portal Censo Escolar Tocantins",
  description: "Dados completos das escolas, gestores, docentes, matrículas, turmas e cursos técnicos do Tocantins no Censo Escolar 2025.",
};

import { supabase } from "@/lib/supabase";
import { mapSchoolSummary, mapGenericData } from "@/lib/supabase-mapping";
import stats from "@/data/censo-stats.json";
import CensoDictionary from "@/components/censo/CensoDictionary";

import { fetchAllRows } from "@/lib/supabase-utils";

export default async function Censo2025Page() {
  // Fetch all data using the fetchAllRows utility to bypass the 1000 row limit automatically
  const schoolFields = 'codigo_da_escola, nome_da_escola, nome_do_municipio, dependencia_administrativa, localizacao, localizacao_diferenciada_da_escola, situacao_de_funcionamento, acesso_a_internet, numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p';
  const genericFields = 'codigo_da_escola, unidade, municipio, numero_de_docentes_da_educacao_basica, numero_de_docentes_do_ensino_fundamental, numero_de_docentes_do_ensino_medio_regular, numero_de_matriculas_da_educacao_basica, numero_de_matriculas_do_ensino_fundamental, numero_de_matriculas_do_ensino_medio_regular, numero_de_turmas_da_educacao_basica, numero_de_turmas_do_ensino_fundamental, numero_de_turmas_do_ensino_medio_regular';

  const [
    schoolsRaw,
    gestoresRaw,
    docentesRaw,
    matriculasRaw,
    turmasRaw,
    cursosRaw
  ] = await Promise.all([
    fetchAllRows(supabase.from('escolas_2025_to').select(schoolFields)),
    fetchAllRows(supabase.from('gestores_2025_to').select('*')),
    fetchAllRows(supabase.from('docentes_2025_to').select('*')),
    fetchAllRows(supabase.from('matriculas_2025_to').select('*')),
    fetchAllRows(supabase.from('turmas_2025_to').select('*')),
    fetchAllRows(supabase.from('cursos_tecnicos_2025_to').select('*'))
  ]);

  const schools = schoolsRaw.map(mapSchoolSummary);
  
  // Calculate stats dynamically for "Em Atividade" (situacao === 1)
  const activeSchools = schools.filter(s => s.situacao === 1);
  const dynamicStats = {
    total: activeSchools.length,
    estaduais: activeSchools.filter(s => s.rede === 2).length,
    municipais: activeSchools.filter(s => s.rede === 3).length,
    privadas: activeSchools.filter(s => s.rede === 4).length,
    federais: activeSchools.filter(s => s.rede === 1).length,
    comInternet: activeSchools.filter(s => s.internet).length,
  };

  const gestores = (gestoresRaw || []).map(mapGenericData);
  const docentes = (docentesRaw || []).map(mapGenericData);
  const matriculas = (matriculasRaw || []).map(mapGenericData);
  const turmas = (turmasRaw || []).map(mapGenericData);
  const cursosTecnicos = (cursosRaw || []).map(mapGenericData);

  return (
    <MainLayout title="Dados do Censo Escolar 2025">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Painel do Censo Escolar 2025</h1>
        <p className="text-gray-500">
          Consulte informações completas de escolas, gestores, docentes, matrículas, turmas e cursos técnicos
          das unidades escolares do Tocantins.
        </p>
      </div>

      <DatasetSelector
        schools={schools}
        stats={dynamicStats}
        gestores={gestores}
        docentes={docentes}
        matriculas={matriculas}
        turmas={turmas}
        cursosTecnicos={cursosTecnicos}
      />

      {/* Floating Dictionary Button */}
      <CensoDictionary />
    </MainLayout>
  );
}
