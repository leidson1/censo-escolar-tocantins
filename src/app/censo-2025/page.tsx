import MainLayout from "@/components/layout/MainLayout";
import fs from 'fs';
import path from 'path';
import DatasetSelector from "@/components/censo/DatasetSelector";

export const metadata = {
  title: "Censo Escolar 2025 | Portal Censo Escolar Tocantins",
  description: "Dados completos das escolas, gestores, docentes, matrículas, turmas e cursos técnicos do Tocantins no Censo Escolar 2025.",
};

function readJson(file: string) {
  const filePath = path.join(process.cwd(), 'src', 'data', file);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
    return [];
  }
}

export default async function Censo2025Page() {
  const [schools, stats, gestores, docentes, matriculas, turmas, cursosTecnicos] = await Promise.all([
    Promise.resolve(readJson('escolas-resumo.json')),
    Promise.resolve(readJson('censo-stats.json')),
    Promise.resolve(readJson('gestores_escolares_2025_TO.json')),
    Promise.resolve(readJson('docentes_2025_TO.json')),
    Promise.resolve(readJson('matriculas_2025_TO.json')),
    Promise.resolve(readJson('turmas_2025_TO.json')),
    Promise.resolve(readJson('cursos_tecnicos_2025_TO.json')),
  ]);

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
