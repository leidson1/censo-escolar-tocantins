import MainLayout from "@/components/layout/MainLayout";
import DatasetSelector from "@/components/censo/DatasetSelector";

export const metadata = {
  title: "Censo Escolar 2025 | Portal Censo Escolar Tocantins",
  description: "Dados completos das escolas, gestores, docentes, matrículas, turmas e cursos técnicos do Tocantins no Censo Escolar 2025.",
};

import { supabase } from "@/lib/supabase";
import { mapSchoolSummary, mapGenericData } from "@/lib/supabase-mapping";
import stats from "@/data/censo-stats.json";

export default async function Censo2025Page() {
  // Fetch all data in parallel
  const [
    { data: schoolsRaw },
    { data: gestoresRaw },
    { data: docentesRaw },
    { data: matriculasRaw },
    { data: turmasRaw },
    { data: cursosRaw }
  ] = await Promise.all([
    supabase.from('escolas_2025_to').select('codigo_da_escola, nome_da_escola, nome_do_municipio, dependencia_administrativa, localizacao, acesso_a_internet, numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p'),
    supabase.from('gestores_2025_to').select('*'),
    supabase.from('docentes_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_docentes_da_educacao_basica, numero_de_docentes_do_ensino_fundamental, numero_de_docentes_do_ensino_medio_regular'),
    supabase.from('matriculas_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_matriculas_da_educacao_basica, numero_de_matriculas_do_ensino_fundamental, numero_de_matriculas_do_ensino_medio_regular'),
    supabase.from('turmas_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_turmas_da_educacao_basica, numero_de_turmas_do_ensino_fundamental, numero_de_turmas_do_ensino_medio_regular'),
    supabase.from('cursos_tecnicos_2025_to').select('*')
  ]);

  const schools = (schoolsRaw || []).map(mapSchoolSummary);
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
        stats={stats}
        gestores={gestores}
        docentes={docentes}
        matriculas={matriculas}
        turmas={turmas}
        cursosTecnicos={cursosTecnicos}
      />
    </MainLayout>
  );
}
