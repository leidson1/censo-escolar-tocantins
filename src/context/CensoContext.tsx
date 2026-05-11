"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-utils";
import { mapSchoolSummary, mapGenericData } from "@/lib/supabase-mapping";

interface CensoData {
  schools: any[];
  stats: any;
  gestores: any[];
  docentes: any[];
  matriculas: any[];
  turmas: any[];
  cursosTecnicos: any[];
}

interface CensoContextType {
  data: CensoData | null;
  loading: boolean;
  error: string | null;
  loadStep: string;
  fetchCensoData: (force?: boolean) => Promise<void>;
}

const CensoContext = createContext<CensoContextType | undefined>(undefined);

export function CensoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CensoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadStep, setLoadStep] = useState("");

  const schoolFields = 'codigo_da_escola, nome_da_escola, nome_do_municipio, dependencia_administrativa, localizacao, localizacao_diferenciada_da_escola, situacao_de_funcionamento, acesso_a_internet, numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p';

  const fetchCensoData = useCallback(async (force = false) => {
    // If data already exists and not forcing, don't fetch
    if (data && !force) return;
    
    // If already loading, don't trigger another fetch
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch sequence
      setLoadStep("Carregando Escolas...");
      const schoolsRaw = await fetchAllRows(supabase.from('escolas_2025_to').select(schoolFields));
      
      setLoadStep("Carregando Gestores...");
      const gestoresRaw = await fetchAllRows(supabase.from('gestores_2025_to').select('*'));
      
      setLoadStep("Carregando Docentes...");
      const docentesRaw = await fetchAllRows(supabase.from('docentes_2025_to').select('*'));
      
      setLoadStep("Carregando Matrículas...");
      const matriculasRaw = await fetchAllRows(supabase.from('matriculas_2025_to').select('*'));
      
      setLoadStep("Carregando Turmas...");
      const turmasRaw = await fetchAllRows(supabase.from('turmas_2025_to').select('*'));
      
      setLoadStep("Carregando Cursos Técnicos...");
      const cursosRaw = await fetchAllRows(supabase.from('cursos_tecnicos_2025_to').select('*'));

      setLoadStep("Processando dados...");
      
      const schools = schoolsRaw.map(mapSchoolSummary);
      const activeSchools = schools.filter((s: any) => s.situacao === 1);
      
      const stats = {
        total: activeSchools.length,
        estaduais: activeSchools.filter((s: any) => s.rede === 2).length,
        municipais: activeSchools.filter((s: any) => s.rede === 3).length,
        privadas: activeSchools.filter((s: any) => s.rede === 4).length,
        federais: activeSchools.filter((s: any) => s.rede === 1).length,
        comInternet: activeSchools.filter((s: any) => s.internet).length,
      };

      const result: CensoData = {
        schools,
        stats,
        gestores: (gestoresRaw || []).map(mapGenericData),
        docentes: (docentesRaw || []).map(mapGenericData),
        matriculas: (matriculasRaw || []).map(mapGenericData),
        turmas: (turmasRaw || []).map(mapGenericData),
        cursosTecnicos: (cursosRaw || []).map(mapGenericData),
      };

      setData(result);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading Censo data:", err);
      setError(err.message || "Ocorreu um erro ao carregar os dados.");
      setLoading(false);
    }
  }, [data, loading]);

  return (
    <CensoContext.Provider value={{ data, loading, error, loadStep, fetchCensoData }}>
      {children}
    </CensoContext.Provider>
  );
}

export function useCenso() {
  const context = useContext(CensoContext);
  if (context === undefined) {
    throw new Error("useCenso must be used within a CensoProvider");
  }
  return context;
}
