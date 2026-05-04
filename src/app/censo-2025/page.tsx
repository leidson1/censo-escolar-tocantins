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

export default async function Censo2025Page() {
  // Fetch all data in parallel batches (Supabase has a 1000 row limit per request)
  const schoolFields = 'codigo_da_escola, nome_da_escola, nome_do_municipio, dependencia_administrativa, localizacao, localizacao_diferenciada_da_escola, situacao_de_funcionamento, acesso_a_internet, numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p';
  const genericFields = 'codigo_da_escola, unidade, municipio, numero_de_docentes_da_educacao_basica, numero_de_docentes_do_ensino_fundamental, numero_de_docentes_do_ensino_medio_regular, numero_de_matriculas_da_educacao_basica, numero_de_matriculas_do_ensino_fundamental, numero_de_matriculas_do_ensino_medio_regular, numero_de_turmas_da_educacao_basica, numero_de_turmas_do_ensino_fundamental, numero_de_turmas_do_ensino_medio_regular';

  const [
    s1, s2, s3,
    g1, g2,
    doc1, doc2,
    mat1, mat2,
    tur1, tur2,
    { data: cursosRaw }
  ] = await Promise.all([
    // Escolas (2217 rows)
    supabase.from('escolas_2025_to').select(schoolFields).range(0, 999),
    supabase.from('escolas_2025_to').select(schoolFields).range(1000, 1999),
    supabase.from('escolas_2025_to').select(schoolFields).range(2000, 2999),
    // Gestores (1581 rows)
    supabase.from('gestores_2025_to').select('*').range(0, 999),
    supabase.from('gestores_2025_to').select('*').range(1000, 1999),
    // Docentes (1575 rows)
    supabase.from('docentes_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_docentes_da_educacao_basica, numero_de_docentes_do_ensino_fundamental, numero_de_docentes_do_ensino_medio_regular').range(0, 999),
    supabase.from('docentes_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_docentes_da_educacao_basica, numero_de_docentes_do_ensino_fundamental, numero_de_docentes_do_ensino_medio_regular').range(1000, 1999),
    // Matrículas (1575 rows)
    supabase.from('matriculas_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_matriculas_da_educacao_basica, numero_de_matriculas_do_ensino_fundamental, numero_de_matriculas_do_ensino_medio_regular').range(0, 999),
    supabase.from('matriculas_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_matriculas_da_educacao_basica, numero_de_matriculas_do_ensino_fundamental, numero_de_matriculas_do_ensino_medio_regular').range(1000, 1999),
    // Turmas (1575 rows)
    supabase.from('turmas_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_turmas_da_educacao_basica, numero_de_turmas_do_ensino_fundamental, numero_de_turmas_do_ensino_medio_regular').range(0, 999),
    supabase.from('turmas_2025_to').select('codigo_da_escola, unidade, municipio, numero_de_turmas_da_educacao_basica, numero_de_turmas_do_ensino_fundamental, numero_de_turmas_do_ensino_medio_regular').range(1000, 1999),
    // Cursos (183 rows)
    supabase.from('cursos_tecnicos_2025_to').select('*')
  ]);

  const schoolsRaw = [...(s1.data || []), ...(s2.data || []), ...(s3.data || [])];
  const gestoresRaw = [...(g1.data || []), ...(g2.data || [])];
  const docentesRaw = [...(doc1.data || []), ...(doc2.data || [])];
  const matriculasRaw = [...(mat1.data || []), ...(mat2.data || [])];
  const turmasRaw = [...(tur1.data || []), ...(tur2.data || [])];

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
