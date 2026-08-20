"use client";

import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, UserPlus, PlusCircle, Edit3, Trash2, Shield,
  FileSpreadsheet, FileText, Calendar, MapPin, DollarSign, ListOrdered, CheckCircle2,
  Route, ExternalLink, Loader2, Hash, School, X, Lock, Unlock, Filter, CalendarRange, LogOut,
  Users, UserMinus, Printer
} from "lucide-react";
import AccessCodeModal from "@/components/censo/AccessCodeModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { exportDiariasToExcel } from "@/lib/exportExcel";
import { exportDiariasToPdf } from "@/lib/exportPdf";

interface Tecnico {
  matricula: string;
  nome: string;
  regional: string;
}

interface Escola {
  codigo_escola: number;
  codigo_municipio: number;
  sre: string;
  municipio: string;
  escola: string;
  localizacao: string;
  dependencia: string;
}

// A school added to a diária's form, together with the education stages to monitor there
interface EscolaMonitorada extends Escola {
  etapas: string[];
}

const ETAPAS_OPCOES = [
  "Educação Infantil",
  "Ensino Fundamental - I",
  "Ensino Fundamental - II",
  "Ensino Médio",
];

const SRE_OPCOES = [
  "SEDE",
  "Araguaína",
  "Araguatins",
  "Arraias",
  "Colinas do Tocantins",
  "Dianópolis",
  "Guaraí",
  "Gurupi",
  "Miracema do Tocantins",
  "Palmas",
  "Paraíso do Tocantins",
  "Pedro Afonso",
  "Porto Nacional",
  "Tocantinópolis",
];

interface Diaria {
  id: string;
  matricula_tecnico: string;
  destino: string;
  data_saida: string;
  data_retorno: string;
  ordem_servico: string;
  valor_diaria: number;
  quantidade_diarias: number;
  origem_rota?: string;
  distancia_km?: number;
  // Presente quando a diária foi gerada a partir de um lançamento em
  // equipe (ver `equipes_monitoramento`); nula para lançamentos individuais.
  equipe_id?: string | null;
  tecnicos: {
    matricula: string;
    nome: string;
    regional: string;
  };
  diarias_escolas?: { etapas: string[] | null; escolas: Escola }[];
  escolas?: EscolaMonitorada[];
}

// Flatten the nested diarias_escolas -> escolas join into a simple escolas[] array
function normalizeDiarias(list: Diaria[]): Diaria[] {
  return list.map((d) => ({
    ...d,
    escolas: (d.diarias_escolas || [])
      .filter((de) => de.escolas)
      .map((de) => ({ ...de.escolas, etapas: de.etapas || [] })),
  }));
}

export default function DiariasPage() {
  // Authentication & Mode states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Search & Technician states
  const [searchMatricula, setSearchMatricula] = useState("");
  const [activeTecnico, setActiveTecnico] = useState<Tecnico | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // New Technician registration modal/state
  const [isRegisteringTecnico, setIsRegisteringTecnico] = useState(false);
  const [newTecnicoNome, setNewTecnicoNome] = useState("");
  const [newTecnicoRegional, setNewTecnicoRegional] = useState("");
  const [regError, setRegError] = useState("");

  // Form states (Diaria)
  const [editingDiariaId, setEditingDiariaId] = useState<string | null>(null);
  const [destino, setDestino] = useState("");
  // Origem selecionada no dropdown; destinos pode conter um ou mais municípios.
  // "destino" é montado automaticamente como "Origem/Destino1/Destino2/.../Origem".
  const [origemMunicipio, setOrigemMunicipio] = useState("");
  const [destinosMunicipios, setDestinosMunicipios] = useState<string[]>([]);
  const [destinoMunicipioAtual, setDestinoMunicipioAtual] = useState("");
  const [destinoError, setDestinoError] = useState("");
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
  const [dataSaida, setDataSaida] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");
  // OS: gerada automaticamente pelo sistema a cada lançamento (individual ou
  // de equipe), via a função `proximo_numero_os()` no banco — é ela que
  // separa os lançamentos/equipes no relatório exportado. O admin não define
  // mais uma OS fixa para o período. Ao editar uma diária existente, o campo
  // apenas exibe a OS já atribuída (não é regerada).
  const [ordemServico, setOrdemServico] = useState("");
  // Valor da diária: definido pelo administrador para o período de
  // monitoramento corrente (diarias_configuracao). Técnicos apenas visualizam.
  const [valorDiariaConfig, setValorDiariaConfig] = useState(335.00);
  const [valorDiaria, setValorDiaria] = useState(335.00);
  const [quantidadeDiarias, setQuantidadeDiarias] = useState<number>(0);
  const [qtdManuallyEdited, setQtdManuallyEdited] = useState(false);

  // Modo de lançamento: diária individual (comportamento original) ou para
  // toda a equipe de monitoramento do técnico responsável.
  const [modoLancamento, setModoLancamento] = useState<"individual" | "equipe">("individual");
  // Integrantes ADICIONAIS da equipe (o técnico responsável — activeTecnico —
  // já faz parte da equipe automaticamente e não entra nesta lista).
  const [equipeMembros, setEquipeMembros] = useState<Tecnico[]>([]);
  // Ao editar uma diária lançada em equipe: id do registro em
  // `equipes_monitoramento` (== diaria.equipe_id) e o mapeamento
  // matrícula -> id da linha em `diarias` para os integrantes que já
  // faziam parte da equipe antes desta edição. Integrantes presentes em
  // `equipeMembros` mas ausentes daqui são NOVOS (adicionados durante a
  // edição) e geram uma diária nova ao salvar.
  const [editingEquipeId, setEditingEquipeId] = useState<string | null>(null);
  const [equipeExistingRows, setEquipeExistingRows] = useState<Record<string, string>>({});
  const [equipeMatriculaInput, setEquipeMatriculaInput] = useState("");
  const [isSearchingEquipeMembro, setIsSearchingEquipeMembro] = useState(false);
  const [equipeMembroError, setEquipeMembroError] = useState("");
  // Cadastro inline de um novo integrante, quando a matrícula buscada não existe
  const [isRegisteringEquipeMembro, setIsRegisteringEquipeMembro] = useState(false);
  const [novoMembroNome, setNovoMembroNome] = useState("");
  const [novoMembroRegional, setNovoMembroRegional] = useState("");
  const [novoMembroRegError, setNovoMembroRegError] = useState("");

  // Route states
  const [showRotaSection, setShowRotaSection] = useState(false);
  const [origemRota, setOrigemRota] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanciaError, setDistanciaError] = useState("");

  // Escolas monitoradas (form states)
  const [escolaCodigoInput, setEscolaCodigoInput] = useState("");
  const [selectedEscolas, setSelectedEscolas] = useState<EscolaMonitorada[]>([]);
  const [isSearchingEscola, setIsSearchingEscola] = useState(false);
  const [escolaSearchError, setEscolaSearchError] = useState("");
  const [openEtapasFor, setOpenEtapasFor] = useState<number | null>(null);
  // School just found via search, awaiting mandatory etapa selection in the modal
  // before it is actually added to selectedEscolas.
  const [escolaPendente, setEscolaPendente] = useState<EscolaMonitorada | null>(null);

  // Status states
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List states
  const [minhasDiarias, setMinhasDiarias] = useState<Diaria[]>([]);
  const [todasDiarias, setTodasDiarias] = useState<Diaria[]>([]);

  // Bloqueio global do período de lançamento de diárias (controlado pelo admin)
  const [periodoBloqueado, setPeriodoBloqueado] = useState(false);
  const [isTogglingBloqueio, setIsTogglingBloqueio] = useState(false);

  // Valor da diária para o período de monitoramento (campo do admin)
  const [novoValorDiariaConfig, setNovoValorDiariaConfig] = useState("335.00");
  const [isSalvandoValorDiaria, setIsSalvandoValorDiaria] = useState(false);
  const [valorDiariaSalvoMsg, setValorDiariaSalvoMsg] = useState(false);

  // Filtro de data para a tabela/exportação do painel admin
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroOS, setFiltroOS] = useState("");

  // Formatos e relatórios selecionados para a exportação (admin)
  const [exportarExcel, setExportarExcel] = useState(true);
  const [exportarPdf, setExportarPdf] = useState(true);
  const [incluirRelatorioDiarias, setIncluirRelatorioDiarias] = useState(true);
  const [incluirRelatorioEscolas, setIncluirRelatorioEscolas] = useState(true);

  // Auto-calculate QTD when dates change
  useEffect(() => {
    if (!qtdManuallyEdited && dataSaida && dataRetorno) {
      const start = new Date(dataSaida);
      const end = new Date(dataRetorno);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        setQuantidadeDiarias(diffDays + 0.5);
      }
    }
  }, [dataSaida, dataRetorno, qtdManuallyEdited]);

  // Load the distinct list of municípios from the escolas table, to populate
  // the Origem/Destino dropdowns.
  const fetchMunicipios = async () => {
    setIsLoadingMunicipios(true);
    try {
      // Usa a view `municipios_escolas` (municípios distintos) em vez de
      // buscar a coluna "municipio" da tabela `escolas` inteira: o PostgREST
      // limita consultas a 1000 linhas por padrão, e a tabela `escolas` já
      // passa desse total — buscar direto nela truncava a lista e podia
      // esconder municípios (ex.: Paranã) do dropdown de Origem/Destino.
      const { data, error } = await supabase.from("municipios_escolas").select("municipio");
      if (!error && data) {
        const unicos = Array.from(new Set(data.map((r: { municipio: string }) => r.municipio))).sort((a, b) =>
          a.localeCompare(b, "pt-BR")
        );
        setMunicipios(unicos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMunicipios(false);
    }
  };

  useEffect(() => {
    fetchMunicipios();
  }, []);

  // Auto-compose "destino" as Origem/Destino1/Destino2/.../Origem sempre que a
  // origem e ao menos um destino estiverem definidos.
  useEffect(() => {
    if (origemMunicipio && destinosMunicipios.length > 0) {
      setDestino(`${origemMunicipio}/${destinosMunicipios.join("/")}/${origemMunicipio}`);
    } else {
      setDestino("");
    }
  }, [origemMunicipio, destinosMunicipios]);

  // Add a destination municipality to the trip (avoids duplicates and the origin itself)
  const handleAddDestino = () => {
    const m = destinoMunicipioAtual;
    if (!m) return;
    if (m === origemMunicipio) {
      setDestinoError("O destino não pode ser igual à origem.");
      return;
    }
    if (destinosMunicipios.includes(m)) {
      setDestinoMunicipioAtual("");
      return;
    }
    setDestinoError("");
    setDestinosMunicipios((prev) => [...prev, m]);
    setDestinoMunicipioAtual("");
  };

  const handleRemoveDestino = (m: string) => {
    setDestinosMunicipios((prev) => prev.filter((d) => d !== m));
  };

  // Default the route's "Cidade de Origem" field (used for Google Maps) from Origem, if still empty
  useEffect(() => {
    if (origemMunicipio && !origemRota) {
      setOrigemRota(origemMunicipio);
    }
  }, [origemMunicipio]);

  // Find technician in DB
  const handleSearchTecnico = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchMatricula.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setActiveTecnico(null);
    setMinhasDiarias([]);
    setFormMessage(null);
    setEditingDiariaId(null);
    setEditingEquipeId(null);
    setEquipeExistingRows({});
    setModoLancamento("individual");
    setEquipeMembros([]);
    setSelectedEscolas([]);
    setEscolaCodigoInput("");
    setEscolaSearchError("");
    setEscolaPendente(null);
    setOpenEtapasFor(null);

    try {
      const { data, error } = await supabase
        .from("tecnicos")
        .select("*")
        .eq("matricula", searchMatricula.trim())
        .single();

      if (error || !data) {
        setSearchError("Técnico não encontrado. Caso queira, você pode cadastrá-lo abaixo.");
      } else {
        setActiveTecnico(data);
        fetchMinhasDiarias(data.matricula);
      }
    } catch (err) {
      setSearchError("Erro ao pesquisar técnico.");
    } finally {
      setIsSearching(false);
    }
  };

  // Log out of the current technician session, returning to the search screen
  const handleSairTecnico = () => {
    setActiveTecnico(null);
    setSearchMatricula("");
    setMinhasDiarias([]);
    setSearchError("");
    setIsRegisteringTecnico(false);
    setFormMessage(null);
    setEditingDiariaId(null);
    setDestino("");
    setOrigemMunicipio("");
    setDestinosMunicipios([]);
    setDestinoMunicipioAtual("");
    setDestinoError("");
    setDataSaida("");
    setDataRetorno("");
    setOrdemServico("");
    setValorDiaria(valorDiariaConfig);
    setQuantidadeDiarias(0);
    setQtdManuallyEdited(false);
    setOrigemRota("");
    setDistanciaKm("");
    setShowRotaSection(false);
    setDistanciaError("");
    setSelectedEscolas([]);
    setEscolaCodigoInput("");
    setEscolaSearchError("");
    setOpenEtapasFor(null);
    setEscolaPendente(null);
    setModoLancamento("individual");
    setEquipeMembros([]);
    setEditingEquipeId(null);
    setEquipeExistingRows({});
    setEquipeMatriculaInput("");
    setEquipeMembroError("");
    setIsRegisteringEquipeMembro(false);
    setNovoMembroNome("");
    setNovoMembroRegional("");
    setNovoMembroRegError("");
  };

  // Fetch technician's individual diaries
  const fetchMinhasDiarias = async (matricula: string) => {
    try {
      const { data, error } = await supabase
        .from("diarias")
        .select(`
          *,
          tecnicos:matricula_tecnico (
            matricula,
            nome,
            regional
          ),
          diarias_escolas (
            etapas,
            escolas ( codigo_escola, codigo_municipio, sre, municipio, escola, localizacao, dependencia )
          )
        `)
        .eq("matricula_tecnico", matricula)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMinhasDiarias(normalizeDiarias(data as unknown as Diaria[]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch ALL diaries for admin panel
  const fetchTodasDiarias = async () => {
    try {
      const { data, error } = await supabase
        .from("diarias")
        .select(`
          *,
          tecnicos:matricula_tecnico (
            matricula,
            nome,
            regional
          ),
          diarias_escolas (
            etapas,
            escolas ( codigo_escola, codigo_municipio, sre, municipio, escola, localizacao, dependencia )
          )
        `)
        .order("ordem_servico", { ascending: true });

      if (!error && data) {
        setTodasDiarias(normalizeDiarias(data as unknown as Diaria[]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTodasDiarias();
    }
  }, [isAdmin]);

  // Fetch the global "lançamento bloqueado" flag and the fixed valor_diaria
  // — needed for both technicians and admin. A OS não é mais lida daqui:
  // ela é gerada automaticamente pelo sistema a cada lançamento.
  const fetchConfiguracao = async () => {
    try {
      const { data, error } = await supabase
        .from("diarias_configuracao")
        .select("bloqueado, valor_diaria")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setPeriodoBloqueado(!!data.bloqueado);
        if (data.valor_diaria != null) {
          const v = Number(data.valor_diaria);
          setValorDiariaConfig(v);
          setValorDiaria(v);
          setNovoValorDiariaConfig(v.toFixed(2));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfiguracao();
  }, []);

  // Admin action: update the fixed valor_diaria used for the current monitoring period
  const handleSalvarValorDiaria = async () => {
    const novoValor = parseFloat(novoValorDiariaConfig.replace(",", "."));
    if (isNaN(novoValor) || novoValor <= 0) {
      alert("Informe um valor de diária válido.");
      return;
    }

    setIsSalvandoValorDiaria(true);
    setValorDiariaSalvoMsg(false);
    try {
      const { error } = await supabase
        .from("diarias_configuracao")
        .update({ valor_diaria: novoValor, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (!error) {
        setValorDiariaConfig(novoValor);
        if (!editingDiariaId) setValorDiaria(novoValor);
        setValorDiariaSalvoMsg(true);
        setTimeout(() => setValorDiariaSalvoMsg(false), 3000);
      } else {
        alert("Erro ao atualizar o valor da diária. Tente novamente.");
      }
    } catch (err) {
      alert("Erro ao atualizar o valor da diária.");
    } finally {
      setIsSalvandoValorDiaria(false);
    }
  };

  // Admin action: toggle the global block on new/edited diária submissions
  const handleToggleBloqueio = async () => {
    setIsTogglingBloqueio(true);
    try {
      const novoValor = !periodoBloqueado;
      const { error } = await supabase
        .from("diarias_configuracao")
        .update({ bloqueado: novoValor, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (!error) {
        setPeriodoBloqueado(novoValor);
      } else {
        alert("Erro ao atualizar o bloqueio do período. Tente novamente.");
      }
    } catch (err) {
      alert("Erro ao atualizar o bloqueio do período.");
    } finally {
      setIsTogglingBloqueio(false);
    }
  };

  // Handle register new technician
  const handleRegisterTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMatricula.trim() || !newTecnicoNome.trim() || !newTecnicoRegional.trim()) {
      setRegError("Preencha todos os campos.");
      return;
    }
    if (!/^\d+$/.test(searchMatricula.trim())) {
      setRegError("A matrícula deve conter apenas números.");
      return;
    }

    setRegError("");
    try {
      const { data, error } = await supabase
        .from("tecnicos")
        .insert([
          { 
            matricula: searchMatricula.trim(), 
            nome: newTecnicoNome.trim(), 
            regional: newTecnicoRegional.trim() 
          }
        ])
        .select()
        .single();

      if (error) {
        setRegError("Erro ao salvar técnico. A matrícula pode já estar em uso.");
      } else {
        setActiveTecnico(data);
        setIsRegisteringTecnico(false);
        setNewTecnicoNome("");
        setNewTecnicoRegional("");
        fetchMinhasDiarias(data.matricula);
      }
    } catch (err) {
      setRegError("Erro ao cadastrar técnico.");
    }
  };

  // Search a colleague by matrícula and add them to the team being assembled
  // for a "lançamento em equipe". If not found, opens the inline registration
  // mini-form so the responsible técnico can cadastrar the colleague on the spot.
  const handleAddEquipeMembro = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRegisteringEquipeMembro) return;

    const matricula = equipeMatriculaInput.trim();
    if (!matricula) return;

    if (activeTecnico && matricula === activeTecnico.matricula) {
      setEquipeMembroError("Você já é o responsável por este lançamento.");
      return;
    }
    if (equipeMembros.some((m) => m.matricula === matricula)) {
      setEquipeMembroError("Este técnico já foi adicionado à equipe.");
      return;
    }

    setIsSearchingEquipeMembro(true);
    setEquipeMembroError("");
    try {
      const { data, error } = await supabase
        .from("tecnicos")
        .select("*")
        .eq("matricula", matricula)
        .single();

      if (error || !data) {
        setEquipeMembroError("Técnico não encontrado. Você pode cadastrá-lo abaixo.");
        setIsRegisteringEquipeMembro(true);
      } else {
        setEquipeMembros((prev) => [...prev, data]);
        setEquipeMatriculaInput("");
      }
    } catch (err) {
      setEquipeMembroError("Erro ao pesquisar técnico.");
    } finally {
      setIsSearchingEquipeMembro(false);
    }
  };

  const handleRemoveEquipeMembro = (matricula: string) => {
    setEquipeMembros((prev) => prev.filter((m) => m.matricula !== matricula));
  };

  const handleCancelRegisterEquipeMembro = () => {
    setIsRegisteringEquipeMembro(false);
    setNovoMembroNome("");
    setNovoMembroRegional("");
    setNovoMembroRegError("");
  };

  // Register a colleague inline (from the team-builder) and add them straight to the team
  const handleRegisterEquipeMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    const matricula = equipeMatriculaInput.trim();
    if (!matricula || !novoMembroNome.trim() || !novoMembroRegional.trim()) {
      setNovoMembroRegError("Preencha todos os campos.");
      return;
    }
    if (!/^\d+$/.test(matricula)) {
      setNovoMembroRegError("A matrícula deve conter apenas números.");
      return;
    }

    setNovoMembroRegError("");
    try {
      const { data, error } = await supabase
        .from("tecnicos")
        .insert([{ matricula, nome: novoMembroNome.trim(), regional: novoMembroRegional.trim() }])
        .select()
        .single();

      if (error) {
        setNovoMembroRegError("Erro ao salvar técnico. A matrícula pode já estar em uso.");
      } else {
        setEquipeMembros((prev) => [...prev, data]);
        setEquipeMatriculaInput("");
        setEquipeMembroError("");
        handleCancelRegisterEquipeMembro();
      }
    } catch (err) {
      setNovoMembroRegError("Erro ao cadastrar técnico.");
    }
  };

  // Calculate distance via Google Maps Directions API (requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
  const handleCalcularDistancia = async () => {
    if (!origemRota.trim() || !destino.trim()) {
      setDistanciaError("Preencha a origem e o destino para calcular a distância.");
      return;
    }
    setDistanciaError("");
    setIsCalculatingDistance(true);

    try {
      // Use Google Maps Directions API via a client-side call
      // This uses the Maps JavaScript API DirectionsService (no CORS issues)
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        // Fallback: open Maps in new tab, user enters manually
        handleAbrirMaps();
        setDistanciaError("Chave de API não configurada. Veja a rota no Maps e insira a distância manualmente.");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        if ((window as any).google?.maps) { resolve(); return; }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Falha ao carregar Google Maps API'));
        document.head.appendChild(script);
      });

      const { google } = window as any;
      const service = new google.maps.DirectionsService();
      const result = await new Promise<any>((resolve, reject) => {
        service.route(
          {
            origin: origemRota.trim(),
            destination: destino.trim(),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (res: any, status: string) => {
            if (status === 'OK') resolve(res);
            else reject(new Error(`Erro: ${status}`));
          }
        );
      });

      const distanceMeters = result.routes[0].legs[0].distance.value;
      const distanceKm = (distanceMeters / 1000).toFixed(1);
      setDistanciaKm(distanceKm);
    } catch (err: any) {
      setDistanciaError("Não foi possível calcular a distância. Insira manualmente.");
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  // Open route in Google Maps new tab
  const handleAbrirMaps = () => {
    const origem = encodeURIComponent(origemRota.trim() || activeTecnico?.regional || "");
    const dest = encodeURIComponent(destino.trim());
    window.open(`https://www.google.com/maps/dir/${origem}/${dest}`, '_blank');
  };

  // Search a school by its INEP code and add it to the current diaria's list
  const handleAddEscola = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (escolaPendente) return; // block new searches while the etapa modal is open

    const codigo = escolaCodigoInput.trim();
    if (!codigo) return;

    if (selectedEscolas.some((esc) => String(esc.codigo_escola) === codigo)) {
      setEscolaSearchError("Essa escola já foi adicionada.");
      return;
    }

    setIsSearchingEscola(true);
    setEscolaSearchError("");

    try {
      const { data, error } = await supabase
        .from("escolas")
        .select("*")
        .eq("codigo_escola", codigo)
        .single();

      if (error || !data) {
        setEscolaSearchError("Escola não encontrada para o código INEP informado.");
      } else {
        // Stage the school in the modal; it only joins selectedEscolas once
        // at least one etapa is confirmed.
        setEscolaPendente({ ...(data as Escola), etapas: [] });
        setEscolaCodigoInput("");
      }
    } catch (err) {
      setEscolaSearchError("Erro ao buscar a escola.");
    } finally {
      setIsSearchingEscola(false);
    }
  };

  const handleRemoveEscola = (codigoEscola: number) => {
    setSelectedEscolas((prev) => prev.filter((esc) => esc.codigo_escola !== codigoEscola));
    setOpenEtapasFor((prev) => (prev === codigoEscola ? null : prev));
  };

  // Toggle an education stage (etapa) for a specific monitored school already confirmed
  const handleToggleEtapa = (codigoEscola: number, etapa: string) => {
    setSelectedEscolas((prev) =>
      prev.map((esc) => {
        if (esc.codigo_escola !== codigoEscola) return esc;
        const has = esc.etapas.includes(etapa);
        return {
          ...esc,
          etapas: has ? esc.etapas.filter((e) => e !== etapa) : [...esc.etapas, etapa],
        };
      })
    );
  };

  // Toggle an etapa for the school currently staged in the mandatory modal
  const handleTogglePendingEtapa = (etapa: string) => {
    setEscolaPendente((prev) => {
      if (!prev) return prev;
      const has = prev.etapas.includes(etapa);
      return { ...prev, etapas: has ? prev.etapas.filter((e) => e !== etapa) : [...prev.etapas, etapa] };
    });
  };

  // Confirm the staged school (requires at least one etapa) and add it to the list
  const handleConfirmEscolaPendente = () => {
    if (!escolaPendente || escolaPendente.etapas.length === 0) return;
    setSelectedEscolas((prev) => [...prev, escolaPendente]);
    setEscolaPendente(null);
  };

  // Discard the staged school without adding it
  const handleCancelEscolaPendente = () => {
    setEscolaPendente(null);
  };

  // Handle Submit or Edit of Diaria
  const handleSubmitDiaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTecnico) return;
    if (periodoBloqueado && !isAdmin) {
      setFormMessage({ type: "error", text: "O período de lançamento de diárias está bloqueado pelo administrador." });
      return;
    }
    if (!origemMunicipio || destinosMunicipios.length === 0 || !dataSaida || !dataRetorno) {
      setFormMessage({ type: "error", text: "Preencha os campos obrigatórios: Origem, ao menos um Destino, Data de Saída e Data de Retorno." });
      return;
    }
    if (destinosMunicipios.includes(origemMunicipio)) {
      setFormMessage({ type: "error", text: "O destino não pode ser igual à origem." });
      return;
    }
    if (dataRetorno < dataSaida) {
      setFormMessage({ type: "error", text: "A Data de Retorno não pode ser anterior à Data de Saída." });
      return;
    }
    if (!(quantidadeDiarias > 0)) {
      setFormMessage({ type: "error", text: "A Quantidade de Diárias (QTD) deve ser maior que zero." });
      return;
    }
    if (selectedEscolas.length === 0) {
      setFormMessage({ type: "error", text: "Adicione ao menos uma escola para monitoramento." });
      return;
    }

    const isNovaEquipe = modoLancamento === "equipe" && !editingDiariaId;
    // Editando uma diária que já foi lançada em equipe: qualquer integrante
    // (ou o Admin) pode acrescentar novos técnicos, além de alterar
    // destino/datas/escolas, que passam a valer para toda a equipe.
    const isEdicaoEquipe = modoLancamento === "equipe" && !!editingDiariaId;
    // O responsável (activeTecnico) sempre faz parte da equipe; em modo
    // individual a "equipe" é só ele mesmo.
    const membrosEquipe: Tecnico[] =
      isNovaEquipe || isEdicaoEquipe ? [activeTecnico, ...equipeMembros] : [activeTecnico];

    setIsSubmitting(true);
    setFormMessage(null);

    // Dados da viagem compartilhados por todos os integrantes do lançamento
    const dadosViagemBase = {
      destino: destino.trim(),
      data_saida: dataSaida,
      data_retorno: dataRetorno,
      valor_diaria: valorDiaria,
      quantidade_diarias: quantidadeDiarias,
      origem_rota: origemRota.trim() || null,
      distancia_km: distanciaKm ? parseFloat(distanciaKm) : null,
      updated_at: new Date().toISOString()
    };

    try {
      // A OS é gerada automaticamente pelo sistema para cada NOVO lançamento
      // (individual ou de equipe) — é ela que separa os lançamentos/equipes
      // no relatório exportado. Ao editar, a OS já atribuída é preservada.
      let osGerada = ordemServico;
      if (!editingDiariaId) {
        const { data: osData, error: osError } = await supabase.rpc("proximo_numero_os");
        if (osError) throw osError;
        osGerada = String(osData);
      }

      if (isEdicaoEquipe) {
        // Mantém o registro agregador (equipes_monitoramento) em sincronia
        // com os dados da viagem que acabaram de ser editados.
        if (editingEquipeId) {
          const { error: equipeUpdateError } = await supabase
            .from("equipes_monitoramento")
            .update(dadosViagemBase)
            .eq("id", editingEquipeId);
          if (equipeUpdateError) throw equipeUpdateError;
        }

        // Integrantes que faziam parte da equipe antes desta edição, mas que
        // foram removidos da lista agora: exclui a diária deles e o vínculo
        // com a equipe.
        const matriculasAtuais = new Set(membrosEquipe.map((m) => m.matricula));
        const membrosRemovidos = Object.entries(equipeExistingRows).filter(
          ([matricula]) => !matriculasAtuais.has(matricula)
        );
        for (const [matriculaRemovida, diariaRemovidaId] of membrosRemovidos) {
          await supabase.from("diarias_escolas").delete().eq("diaria_id", diariaRemovidaId);
          const { error: deleteDiariaError } = await supabase.from("diarias").delete().eq("id", diariaRemovidaId);
          if (deleteDiariaError) throw deleteDiariaError;
          if (editingEquipeId) {
            await supabase
              .from("equipes_monitoramento_membros")
              .delete()
              .eq("equipe_id", editingEquipeId)
              .eq("matricula_tecnico", matriculaRemovida);
          }
        }

        let integrantesNovos = 0;
        for (const membro of membrosEquipe) {
          const diariaExistenteId = equipeExistingRows[membro.matricula];

          if (diariaExistenteId) {
            // Integrante já fazia parte da equipe: apenas sincroniza os
            // dados da viagem e as escolas monitoradas na sua diária.
            const { error: updateError } = await supabase
              .from("diarias")
              .update({ ordem_servico: osGerada, ...dadosViagemBase })
              .eq("id", diariaExistenteId);
            if (updateError) throw updateError;

            await supabase.from("diarias_escolas").delete().eq("diaria_id", diariaExistenteId);
            if (selectedEscolas.length > 0) {
              const escolaRows = selectedEscolas.map((esc) => ({
                diaria_id: diariaExistenteId,
                codigo_escola: esc.codigo_escola,
                etapas: esc.etapas,
              }));
              const { error: escolasError } = await supabase.from("diarias_escolas").insert(escolaRows);
              if (escolasError) throw escolasError;
            }
          } else if (editingEquipeId) {
            // Integrante novo, acrescentado durante a edição: cria a diária
            // dele e o vincula à equipe.
            const { data: novaDiaria, error: insertError } = await supabase
              .from("diarias")
              .insert([{
                matricula_tecnico: membro.matricula,
                equipe_id: editingEquipeId,
                ordem_servico: osGerada,
                ...dadosViagemBase,
              }])
              .select()
              .single();
            if (insertError) throw insertError;

            const { error: membroError } = await supabase
              .from("equipes_monitoramento_membros")
              .insert([{ equipe_id: editingEquipeId, matricula_tecnico: membro.matricula }]);
            if (membroError) throw membroError;

            if (selectedEscolas.length > 0) {
              const escolaRows = selectedEscolas.map((esc) => ({
                diaria_id: novaDiaria.id,
                codigo_escola: esc.codigo_escola,
                etapas: esc.etapas,
              }));
              const { error: escolasError } = await supabase.from("diarias_escolas").insert(escolaRows);
              if (escolasError) throw escolasError;
            }
            integrantesNovos += 1;
          }
        }

        const partesMsg: string[] = [];
        if (integrantesNovos > 0) partesMsg.push(`${integrantesNovos} novo(s) integrante(s) adicionado(s)`);
        if (membrosRemovidos.length > 0) partesMsg.push(`${membrosRemovidos.length} integrante(s) removido(s)`);
        setFormMessage({
          type: "success",
          text:
            partesMsg.length > 0
              ? `Diária da equipe atualizada! ${partesMsg.join(" e ")}.`
              : "Diária da equipe atualizada com sucesso!",
        });
      } else if (isNovaEquipe) {
        // 1) Registro agregador da viagem da equipe
        const { data: equipeData, error: equipeError } = await supabase
          .from("equipes_monitoramento")
          .insert([{
            matricula_responsavel: activeTecnico.matricula,
            ordem_servico: osGerada,
            ...dadosViagemBase,
          }])
          .select()
          .single();
        if (equipeError) throw equipeError;
        const equipeId = equipeData.id;

        try {
          // 2) Integrantes da equipe
          const membrosRows = membrosEquipe.map((m) => ({
            equipe_id: equipeId,
            matricula_tecnico: m.matricula,
          }));
          const { error: membrosError } = await supabase
            .from("equipes_monitoramento_membros")
            .insert(membrosRows);
          if (membrosError) throw membrosError;

          // 3) Uma diária individual por integrante, todas com a mesma OS/viagem
          const diariasRows = membrosEquipe.map((m) => ({
            matricula_tecnico: m.matricula,
            equipe_id: equipeId,
            ordem_servico: osGerada,
            ...dadosViagemBase,
          }));
          const { data: diariasInseridas, error: diariasError } = await supabase
            .from("diarias")
            .insert(diariasRows)
            .select();
          if (diariasError) throw diariasError;

          // 4) Escolas monitoradas replicadas para a diária de cada integrante
          const escolasRows = (diariasInseridas || []).flatMap((d: { id: string }) =>
            selectedEscolas.map((esc) => ({
              diaria_id: d.id,
              codigo_escola: esc.codigo_escola,
              etapas: esc.etapas,
            }))
          );
          if (escolasRows.length > 0) {
            const { error: escolasError } = await supabase.from("diarias_escolas").insert(escolasRows);
            if (escolasError) throw escolasError;
          }

          setFormMessage({
            type: "success",
            text: `Diária lançada com sucesso para ${membrosEquipe.length} integrante(s) da equipe! OS gerada: ${osGerada}`,
          });
        } catch (innerErr) {
          // Evita deixar o registro de equipe órfão se um passo seguinte falhar
          await supabase.from("equipes_monitoramento").delete().eq("id", equipeId);
          throw innerErr;
        }
      } else {
        const diariaData = {
          matricula_tecnico: activeTecnico.matricula,
          ordem_servico: osGerada,
          ...dadosViagemBase,
        };

        let diariaId = editingDiariaId;

        if (editingDiariaId) {
          // Edit existing
          const { error } = await supabase
            .from("diarias")
            .update(diariaData)
            .eq("id", editingDiariaId);

          if (error) throw error;
          setFormMessage({ type: "success", text: "Diária atualizada com sucesso!" });
        } else {
          // Create new
          const { data, error } = await supabase
            .from("diarias")
            .insert([diariaData])
            .select()
            .single();

          if (error) throw error;
          diariaId = data.id;
          setFormMessage({ type: "success", text: `Diária lançada com sucesso! OS gerada: ${osGerada}` });
        }

        // Sync monitored schools (delete previous links, then re-insert current selection)
        if (diariaId) {
          await supabase.from("diarias_escolas").delete().eq("diaria_id", diariaId);
          if (selectedEscolas.length > 0) {
            const escolaRows = selectedEscolas.map((esc) => ({
              diaria_id: diariaId,
              codigo_escola: esc.codigo_escola,
              etapas: esc.etapas,
            }));
            const { error: escolasError } = await supabase.from("diarias_escolas").insert(escolaRows);
            if (escolasError) throw escolasError;
          }
        }
      }

      // Reset form
      setEditingDiariaId(null);
      setDestino("");
      setOrigemMunicipio("");
      setDestinosMunicipios([]);
      setDestinoMunicipioAtual("");
      setDestinoError("");
      setDataSaida("");
      setDataRetorno("");
      setOrdemServico("");
      setValorDiaria(valorDiariaConfig);
      setQuantidadeDiarias(0);
      setQtdManuallyEdited(false);
      setOrigemRota("");
      setDistanciaKm("");
      setShowRotaSection(false);
      setDistanciaError("");
      setSelectedEscolas([]);
      setEscolaCodigoInput("");
      setEscolaSearchError("");
      setOpenEtapasFor(null);
      setEscolaPendente(null);
      setModoLancamento("individual");
      setEquipeMembros([]);
      setEditingEquipeId(null);
      setEquipeExistingRows({});
      setEquipeMatriculaInput("");
      setEquipeMembroError("");
      handleCancelRegisterEquipeMembro();

      // Refresh list
      fetchMinhasDiarias(activeTecnico.matricula);
      if (isAdmin) fetchTodasDiarias();
    } catch (err) {
      setFormMessage({ type: "error", text: "Erro ao salvar a diária. Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit action
  const handleEditClick = async (diaria: Diaria) => {
    setEditingDiariaId(diaria.id);
    setEquipeMatriculaInput("");
    setEquipeMembroError("");
    handleCancelRegisterEquipeMembro();

    // Diárias lançadas em equipe continuam em modo "equipe" ao editar: isso
    // permite que qualquer integrante (ou o Admin) acrescente novos técnicos,
    // além de alterar destino/escolas para toda a equipe. Diárias individuais
    // continuam se comportando como antes.
    if (diaria.equipe_id) {
      setModoLancamento("equipe");
      setEditingEquipeId(diaria.equipe_id);
      try {
        const { data, error } = await supabase
          .from("diarias")
          .select(`id, matricula_tecnico, tecnicos:matricula_tecnico ( matricula, nome, regional )`)
          .eq("equipe_id", diaria.equipe_id)
          .neq("id", diaria.id);

        if (!error && data) {
          const rows = data as unknown as { id: string; matricula_tecnico: string; tecnicos: Tecnico }[];
          setEquipeMembros(rows.filter((r) => r.tecnicos).map((r) => r.tecnicos));
          const existingRows: Record<string, string> = { [diaria.matricula_tecnico]: diaria.id };
          rows.forEach((r) => { existingRows[r.matricula_tecnico] = r.id; });
          setEquipeExistingRows(existingRows);
        } else {
          setEquipeMembros([]);
          setEquipeExistingRows({ [diaria.matricula_tecnico]: diaria.id });
        }
      } catch (err) {
        setEquipeMembros([]);
        setEquipeExistingRows({ [diaria.matricula_tecnico]: diaria.id });
      }
    } else {
      setModoLancamento("individual");
      setEditingEquipeId(null);
      setEquipeMembros([]);
      setEquipeExistingRows({});
    }
    setDestino(diaria.destino);
    // Try to recompose the Origem/Destinos dropdowns from the saved
    // "Origem/Destino1/.../DestinoN/Origem" string
    const partesDestino = diaria.destino.split("/");
    if (partesDestino.length >= 3 && partesDestino[0] === partesDestino[partesDestino.length - 1]) {
      setOrigemMunicipio(partesDestino[0]);
      setDestinosMunicipios(partesDestino.slice(1, -1));
    } else {
      setOrigemMunicipio("");
      setDestinosMunicipios([]);
    }
    setDestinoMunicipioAtual("");
    setDestinoError("");
    setDataSaida(diaria.data_saida);
    setDataRetorno(diaria.data_retorno);
    setOrdemServico(diaria.ordem_servico || "");
    setValorDiaria(Number(diaria.valor_diaria));
    setQuantidadeDiarias(Number(diaria.quantidade_diarias));
    setQtdManuallyEdited(true); // when editing, preserve saved value
    setOrigemRota(diaria.origem_rota || "");
    setDistanciaKm(diaria.distancia_km ? String(diaria.distancia_km) : "");
    if (diaria.origem_rota || diaria.distancia_km) setShowRotaSection(true);
    setSelectedEscolas(diaria.escolas || []);
    setEscolaCodigoInput("");
    setEscolaSearchError("");
    setFormMessage(null);

    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Delete action
  const handleDeleteClick = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta diária?")) return;

    try {
      const { error } = await supabase
        .from("diarias")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (activeTecnico) {
        fetchMinhasDiarias(activeTecnico.matricula);
      }
      if (isAdmin) fetchTodasDiarias();
    } catch (err) {
      alert("Erro ao excluir diária.");
    }
  };

  // Admin access validation
  const handleAdminSuccess = () => {
    setIsAdmin(true);
    setIsAdminModalOpen(false);
  };

  // Lista de OS distintas presentes nos lançamentos, usada no filtro por OS
  const osDisponiveis = Array.from(new Set(todasDiarias.map((d) => d.ordem_servico).filter(Boolean))).sort(
    (a, b) => Number(a) - Number(b) || a.localeCompare(b)
  );

  // Diárias filtradas por período (data de saída) e/ou OS, usadas na tabela e na exportação do admin
  const diariasFiltradas = todasDiarias.filter((diaria) => {
    if (filtroDataInicio && diaria.data_saida < filtroDataInicio) return false;
    if (filtroDataFim && diaria.data_saida > filtroDataFim) return false;
    if (filtroOS && diaria.ordem_servico !== filtroOS) return false;
    return true;
  });

  const handleLimparFiltroData = () => {
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setFiltroOS("");
  };

  // Municípios da rota atual (origem + destinos) — usado para avisar quando uma
  // escola monitorada não pertence a nenhum deles.
  const rotaMunicipios = origemMunicipio ? [origemMunicipio, ...destinosMunicipios] : [];

  // Aviso (não bloqueante): o técnico já tem outra diária lançada com período
  // sobreposto ao que está sendo preenchido/editado agora.
  const diariaSobreposta =
    dataSaida && dataRetorno
      ? minhasDiarias.find(
          (d) => d.id !== editingDiariaId && !(dataRetorno < d.data_saida || dataSaida > d.data_retorno)
        )
      : null;

  return (
    <MainLayout title="Gerenciamento de Diárias de Viagem">
      {/* Access Control Modal */}
      <AccessCodeModal
        isOpen={isAdminModalOpen}
        resourceName="Painel Administrativo de Diárias"
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* Modal obrigatório: selecionar etapa(s) antes de confirmar a escola adicionada */}
      {escolaPendente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-8 w-full max-w-md">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-100">
                <School size={36} className="text-[#0D6E3F]" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
              Selecione a(s) Etapa(s) a Monitorar
            </h2>
            <p className="text-gray-500 text-center text-sm mb-1">
              <span className="font-semibold text-gray-700">{escolaPendente.escola}</span>
            </p>
            <p className="text-gray-400 text-center text-xs mb-6">
              INEP {escolaPendente.codigo_escola} · {escolaPendente.municipio} · {escolaPendente.dependencia} · {escolaPendente.localizacao}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              {ETAPAS_OPCOES.map((et) => {
                const checked = escolaPendente.etapas.includes(et);
                return (
                  <label
                    key={et}
                    className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border cursor-pointer transition-colors select-none ${
                      checked
                        ? "bg-[#0D6E3F] text-white border-[#0D6E3F]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => handleTogglePendingEtapa(et)}
                    />
                    {et}
                  </label>
                );
              })}
            </div>

            {escolaPendente.etapas.length === 0 && (
              <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4 mt-2">
                ⚠ Selecione ao menos uma etapa para confirmar esta escola.
              </p>
            )}

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={handleCancelEscolaPendente}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEscolaPendente}
                disabled={escolaPendente.etapas.length === 0}
                className="flex-1 bg-[#0D6E3F] hover:bg-[#0a5c35] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-all cursor-pointer"
              >
                Confirmar Escola
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full space-y-8">
        
        {/* Header / Intro Box */}
        <div className="bg-gradient-to-r from-[#0D6E3F] to-[#128a4f] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-extrabold mb-3">Lançamento de Diárias de Viagem</h1>
            <p className="text-green-50 leading-relaxed mx-auto max-w-2xl">
              Portal para os técnicos da SEDUC declararem seus deslocamentos para monitoramento do Censo Escolar.
              Digite sua matrícula para começar.
            </p>
          </div>
          {/* Decorative graphic background details */}
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <DollarSign size={200} />
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          {/* Matrícula lookup form */}
          <form onSubmit={handleSearchTecnico} className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchMatricula}
                onChange={(e) => setSearchMatricula(e.target.value.replace(/\D/g, ''))}
                placeholder="Insira sua Matrícula (somente números)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] focus:ring-2 focus:ring-green-100 transition-all text-gray-800"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#0D6E3F] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0a5c35] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Buscar
            </button>
          </form>

          {/* Admin Toggle */}
          <button
            onClick={() => isAdmin ? setIsAdmin(false) : setIsAdminModalOpen(true)}
            className={`px-5 py-2.5 rounded-lg border font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isAdmin 
                ? "bg-red-50 text-red-650 border-red-200 hover:bg-red-100"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <Shield size={18} />
            {isAdmin ? "Sair do Painel Admin" : "Painel do Administrador"}
          </button>
        </div>

        {/* Search status / Registration box */}
        <AnimatePresence mode="wait">
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <p className="font-medium">{searchError}</p>
              {!isRegisteringTecnico && (
                <button
                  type="button"
                  onClick={() => setIsRegisteringTecnico(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <UserPlus size={16} />
                  Cadastrar Técnico
                </button>
              )}
            </motion.div>
          )}

          {isRegisteringTecnico && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="text-[#0D6E3F]" size={20} />
                Cadastrar Técnico para Matrícula: <span className="text-[#0D6E3F]">{searchMatricula}</span>
              </h3>
              <form onSubmit={handleRegisterTecnico} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newTecnicoNome}
                    onChange={(e) => setNewTecnicoNome(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">SRE/SEDE</label>
                  <SearchableSelect
                    value={newTecnicoRegional}
                    onChange={setNewTecnicoRegional}
                    options={SRE_OPCOES}
                    placeholder="Selecione a SRE/SEDE"
                    emptyLabel="Nenhuma SRE/SEDE encontrada"
                  />
                  {/* SearchableSelect não é um <select> nativo — "required" já é
                      validado no submit do formulário (handleRegisterTecnico). */}
                </div>
                {regError && <p className="text-red-500 text-sm md:col-span-2">{regError}</p>}
                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisteringTecnico(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0D6E3F] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#0a5c35] cursor-pointer"
                  >
                    Salvar Técnico
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Technician and Form Dashboard
            Hidden while browsing as admin — only shown for the normal technician flow,
            or when the admin explicitly clicked "Editar" on a diária (editingDiariaId set). */}
        {activeTecnico && (!isAdmin || editingDiariaId) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Form column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Technician Info Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-4 rounded-full text-[#0D6E3F]">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Técnico Identificado</span>
                    <h3 className="text-xl font-bold text-gray-800">{activeTecnico.nome}</h3>
                    <p className="text-sm text-gray-500">Matrícula: {activeTecnico.matricula} | Regional: {activeTecnico.regional}</p>
                  </div>
                </div>
                <button
                  onClick={handleSairTecnico}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                  title="Sair"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>

              {/* Lançar Form Card */}
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <PlusCircle className="text-[#0D6E3F]" size={22} />
                      {editingDiariaId ? "Editar Lançamento de Diária" : "Lançar Nova Diária"}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Preencha os dados da viagem abaixo.{" "}
                      <span className="text-red-500 font-semibold">*</span> campos obrigatórios.
                    </p>
                  </div>

                  {/* Alternância individual / equipe — só faz sentido para um novo lançamento */}
                  {!editingDiariaId && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setModoLancamento("individual")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-all cursor-pointer ${
                          modoLancamento === "individual"
                            ? "bg-[#0D6E3F] text-white border-[#0D6E3F]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        Diária Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoLancamento("equipe")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-all cursor-pointer ${
                          modoLancamento === "equipe"
                            ? "bg-[#0D6E3F] text-white border-[#0D6E3F]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <Users size={16} />
                        Lançar para Minha Equipe
                      </button>
                    </div>
                  )}
                </div>

                {periodoBloqueado && !isAdmin ? (
                  <div className="flex flex-col items-center text-center gap-3 py-10">
                    <div className="bg-red-50 p-4 rounded-full text-red-500">
                      <Lock size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Lançamentos Bloqueados</h3>
                    <p className="text-sm text-gray-500 max-w-md">
                      O período de lançamento de diárias está temporariamente bloqueado pelo administrador.
                      Aguarde a liberação para lançar ou editar diárias.
                    </p>
                  </div>
                ) : (
                <form onSubmit={handleSubmitDiaria} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OS — gerada automaticamente pelo sistema a cada lançamento */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <ListOrdered size={16} className="text-gray-400" />
                        Ordem de Serviço (OS)
                      </label>
                      <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold flex items-center gap-2">
                        <Lock size={14} className="text-gray-400" />
                        {editingDiariaId ? (ordemServico || "—") : "Gerada automaticamente ao lançar"}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {editingDiariaId
                          ? "OS já atribuída a este lançamento; não é alterada ao editar."
                          : "O sistema atribui a OS automaticamente ao confirmar o lançamento — ela separa os lançamentos/equipes no relatório."}
                      </p>
                    </div>

                    {/* Equipe — em novos lançamentos no modo "equipe", ou ao editar uma
                        diária que já foi lançada em equipe (qualquer integrante ou o
                        Admin pode acrescentar novos técnicos nesse momento) */}
                    {modoLancamento === "equipe" && (
                      <div className="md:col-span-2 border border-green-100 rounded-xl overflow-hidden">
                        <div className="p-4 bg-green-50/60 flex items-center gap-2 font-semibold text-[#0D6E3F]">
                          <Users size={18} />
                          Integrantes da Equipe
                        </div>
                        <div className="p-4 space-y-3 bg-white border-t border-green-100">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-[#0D6E3F] px-2.5 py-1 rounded-full font-medium">
                              <CheckCircle2 size={12} />
                              {activeTecnico?.nome} {editingDiariaId ? "(você)" : "(responsável)"}
                            </span>
                            {equipeMembros.map((m) => {
                              const jaEstavaNaEquipe = editingDiariaId ? Boolean(equipeExistingRows[m.matricula]) : false;
                              return (
                                <span
                                  key={m.matricula}
                                  className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-700 pl-2.5 pr-1.5 py-1 rounded-full font-medium"
                                >
                                  {m.nome} <span className="text-gray-400">({m.regional})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        jaEstavaNaEquipe &&
                                        !confirm(
                                          `Remover ${m.nome} da equipe? A diária dele para este período será excluída ao salvar.`
                                        )
                                      ) {
                                        return;
                                      }
                                      handleRemoveEquipeMembro(m.matricula);
                                    }}
                                    className="p-0.5 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                                    title="Remover integrante"
                                  >
                                    <UserMinus size={12} />
                                  </button>
                                </span>
                              );
                            })}
                          </div>

                          {!isRegisteringEquipeMembro && (
                            <div className="flex flex-col md:flex-row gap-2">
                              <input
                                type="text"
                                value={equipeMatriculaInput}
                                onChange={(e) => setEquipeMatriculaInput(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); handleAddEquipeMembro(); }
                                }}
                                placeholder="Matrícula do colega (somente números)"
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddEquipeMembro()}
                                disabled={isSearchingEquipeMembro || !equipeMatriculaInput.trim()}
                                className="flex items-center justify-center gap-2 bg-[#0D6E3F] hover:bg-[#0a5c35] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
                              >
                                {isSearchingEquipeMembro ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                                Adicionar
                              </button>
                            </div>
                          )}

                          {equipeMembroError && !isRegisteringEquipeMembro && (
                            <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                              ⚠ {equipeMembroError}
                            </p>
                          )}

                          {isRegisteringEquipeMembro && (
                            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 space-y-3">
                              <p className="text-sm text-amber-800 font-semibold">
                                Cadastrar técnico para a matrícula: <span className="text-[#0D6E3F]">{equipeMatriculaInput}</span>
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={novoMembroNome}
                                  onChange={(e) => setNovoMembroNome(e.target.value)}
                                  placeholder="Nome completo"
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                                />
                                <SearchableSelect
                                  value={novoMembroRegional}
                                  onChange={setNovoMembroRegional}
                                  options={SRE_OPCOES}
                                  placeholder="Selecione a SRE/SEDE"
                                  emptyLabel="Nenhuma SRE/SEDE encontrada"
                                />
                              </div>
                              {novoMembroRegError && <p className="text-red-500 text-sm">{novoMembroRegError}</p>}
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelRegisterEquipeMembro}
                                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRegisterEquipeMembro}
                                  className="bg-[#0D6E3F] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#0a5c35] cursor-pointer"
                                >
                                  Salvar e Adicionar
                                </button>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-gray-400">
                            {editingDiariaId
                              ? "Os dados da viagem abaixo (destino, datas, escolas) valem para toda a equipe e serão atualizados na diária de cada integrante já existente. Novos técnicos adicionados aqui ganham uma diária própria ao salvar."
                              : "Os dados da viagem abaixo (origem, destino, datas, escolas) valem para toda a equipe — será gerada uma diária individual para cada integrante."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Origem */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <MapPin size={16} className="text-gray-400" />
                        Origem <span className="text-red-500">*</span>
                      </label>
                      <div className={!origemMunicipio ? "rounded-lg ring-1 ring-amber-300" : ""}>
                        <SearchableSelect
                          value={origemMunicipio}
                          onChange={setOrigemMunicipio}
                          options={municipios}
                          disabled={isLoadingMunicipios}
                          placeholder={isLoadingMunicipios ? "Carregando municípios..." : "Selecione o município de origem"}
                          emptyLabel="Nenhum município encontrado"
                        />
                      </div>
                      {/* SearchableSelect não é um <select> nativo — "required" já é
                          validado no submit do formulário (handleLancarDiaria). */}
                    </div>

                    {/* Destino(s) — é possível adicionar mais de um município de destino */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <MapPin size={16} className="text-gray-400" />
                        Destino(s) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <div className={`flex-1 ${destinosMunicipios.length === 0 ? "rounded-lg ring-1 ring-amber-300" : ""}`}>
                          <SearchableSelect
                            value={destinoMunicipioAtual}
                            onChange={setDestinoMunicipioAtual}
                            options={municipios}
                            disabled={isLoadingMunicipios}
                            placeholder={isLoadingMunicipios ? "Carregando municípios..." : "Selecione um município de destino"}
                            emptyLabel="Nenhum município encontrado"
                            className="flex-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddDestino}
                          disabled={!destinoMunicipioAtual}
                          className="flex items-center justify-center gap-2 bg-[#0D6E3F] hover:bg-[#0a5c35] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
                        >
                          <PlusCircle size={16} />
                          Adicionar
                        </button>
                      </div>

                      {destinosMunicipios.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {destinosMunicipios.map((m, idx) => (
                            <span
                              key={m}
                              className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-[#0D6E3F] pl-2.5 pr-1.5 py-1 rounded-full font-medium"
                            >
                              {idx + 1}. {m}
                              <button
                                type="button"
                                onClick={() => handleRemoveDestino(m)}
                                className="p-0.5 hover:bg-green-100 rounded-full transition-colors cursor-pointer"
                                title="Remover destino"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {destinosMunicipios.length === 0 && (
                        <p className="text-xs text-gray-400 mt-1">Nenhum destino adicionado ainda.</p>
                      )}

                      {destinoError && (
                        <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mt-2">
                          ⚠ {destinoError}
                        </p>
                      )}

                      {origemMunicipio && destinosMunicipios.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Rota: <span className="font-semibold text-gray-600">{destino}</span>
                        </p>
                      )}
                    </div>

                    {/* Data Saída */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Calendar size={16} className="text-gray-400" />
                        Data de Saída <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dataSaida}
                        onChange={(e) => { setDataSaida(e.target.value); setQtdManuallyEdited(false); }}
                        required
                        className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 transition-all ${
                          dataSaida ? "border-gray-200" : "border-amber-300 bg-amber-50/40"
                        }`}
                      />
                    </div>

                    {/* Data Retorno */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Calendar size={16} className="text-gray-400" />
                        Data de Retorno <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dataRetorno}
                        onChange={(e) => { setDataRetorno(e.target.value); setQtdManuallyEdited(false); }}
                        required
                        className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 transition-all ${
                          dataRetorno ? "border-gray-200" : "border-amber-300 bg-amber-50/40"
                        }`}
                      />
                    </div>

                    {/* Valor Diária — fixo, definido pelo administrador para o período */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <DollarSign size={16} className="text-gray-400" />
                        Valor Unitário da Diária (R$)
                      </label>
                      <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold flex items-center gap-2">
                        <Lock size={14} className="text-gray-400" />
                        {valorDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Valor fixo definido pelo administrador para o período de monitoramento.
                      </p>
                    </div>

                    {/* Quantidade Diárias — auto-calculated */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Hash size={16} className="text-gray-400" />
                        Quantidade de Diárias (QTD) <span className="text-red-500">*</span>
                        {dataSaida && dataRetorno && !qtdManuallyEdited && (
                          <span className="ml-1 text-xs text-[#0D6E3F] font-normal">⚡ automático</span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={quantidadeDiarias}
                        onChange={(e) => {
                          setQuantidadeDiarias(parseFloat(e.target.value));
                          setQtdManuallyEdited(true);
                        }}
                        required
                        className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 transition-all ${
                          dataSaida && dataRetorno && !qtdManuallyEdited
                            ? "border-green-300 bg-green-50"
                            : quantidadeDiarias > 0
                            ? "border-gray-200"
                            : "border-amber-300 bg-amber-50/40"
                        }`}
                      />
                      {dataSaida && dataRetorno && !qtdManuallyEdited && (
                        <p className="text-xs text-gray-400 mt-1">
                          Calculado: dias entre datas + 0,5 (meio dia de retorno)
                        </p>
                      )}
                    </div>
                  </div>

                  {diariaSobreposta && (
                    <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                      ⚠ Você já tem uma diária lançada de {new Date(diariaSobreposta.data_saida).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(diariaSobreposta.data_retorno).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} que se sobrepõe a este período. Confira se não é um lançamento duplicado.
                    </p>
                  )}

                  {/* Seção de Rota */}
                  <div className="border border-blue-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowRotaSection(!showRotaSection)}
                      className="w-full flex items-center justify-between p-4 bg-blue-50/60 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 font-semibold text-blue-700">
                        <Route size={18} />
                        Traçar Rota com Google Maps
                        <span className="text-xs font-normal text-blue-500">(opcional)</span>
                      </div>
                      <span className="text-xs text-blue-400 font-medium">
                        {showRotaSection ? "▲ Ocultar" : "▼ Expandir"}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showRotaSection && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-4 bg-white border-t border-blue-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Origem da rota */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Cidade de Origem
                                </label>
                                <input
                                  type="text"
                                  value={origemRota}
                                  onChange={(e) => setOrigemRota(e.target.value)}
                                  placeholder="Ex: Palmas - TO"
                                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-gray-800"
                                />
                              </div>

                              {/* Distância auto/manual */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                  Distância Total (km)
                                  {isCalculatingDistance && (
                                    <Loader2 size={14} className="animate-spin text-blue-500" />
                                  )}
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={distanciaKm}
                                  onChange={(e) => setDistanciaKm(e.target.value)}
                                  placeholder="Preenchido automaticamente ou manual"
                                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-gray-800"
                                />
                              </div>
                            </div>

                            {distanciaError && (
                              <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                                ⚠ {distanciaError}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleCalcularDistancia}
                                disabled={isCalculatingDistance || !origemRota.trim() || !destino.trim()}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                              >
                                {isCalculatingDistance ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Route size={15} />
                                )}
                                Calcular Distância
                              </button>

                              <button
                                type="button"
                                onClick={handleAbrirMaps}
                                disabled={!destino.trim()}
                                className="flex items-center gap-2 border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                              >
                                <ExternalLink size={15} />
                                Ver no Google Maps
                              </button>
                            </div>

                            <p className="text-xs text-gray-400">
                              💡 Para calcular automaticamente, configure <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> no arquivo <code className="bg-gray-100 px-1 rounded">.env.local</code>.
                              Sem a chave, use o botão "Ver no Google Maps" e insira a distância manualmente.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Seção de Escolas Monitoradas */}
                  <div
                    className={`border rounded-xl overflow-hidden ${
                      selectedEscolas.length === 0 ? "border-amber-300" : "border-green-100"
                    }`}
                  >
                    <div
                      className={`p-4 flex items-center gap-2 font-semibold text-[#0D6E3F] ${
                        selectedEscolas.length === 0 ? "bg-amber-50" : "bg-green-50/60"
                      }`}
                    >
                      <School size={18} />
                      Escolas para Monitoramento
                      <span className="text-xs font-normal text-red-500">*</span>
                    </div>
                    <div className="p-4 space-y-3 bg-white border-t border-green-100">
                      <div className="flex flex-col md:flex-row gap-2">
                        <input
                          type="text"
                          value={escolaCodigoInput}
                          onChange={(e) => setEscolaCodigoInput(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); handleAddEscola(); }
                          }}
                          disabled={!!escolaPendente}
                          placeholder="Código INEP da escola (Ex: 17010535)"
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddEscola()}
                          disabled={isSearchingEscola || !escolaCodigoInput.trim() || !!escolaPendente}
                          className="flex items-center justify-center gap-2 bg-[#0D6E3F] hover:bg-[#0a5c35] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
                        >
                          {isSearchingEscola ? <Loader2 size={16} className="animate-spin" /> : <School size={16} />}
                          Adicionar Escola
                        </button>
                      </div>

                      {escolaSearchError && (
                        <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                          ⚠ {escolaSearchError}
                        </p>
                      )}

                      {selectedEscolas.length > 0 && (
                        <div className="space-y-2">
                          {selectedEscolas.map((esc) => {
                            const foraDaRota = rotaMunicipios.length > 0 && !rotaMunicipios.includes(esc.municipio);
                            return (
                            <div
                              key={esc.codigo_escola}
                              className="bg-green-50/50 border border-green-100 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-sm">
                                  <p className="font-semibold text-gray-800">{esc.escola}</p>
                                  <p className="text-xs text-gray-500">
                                    INEP {esc.codigo_escola} · {esc.municipio} · {esc.dependencia} · {esc.localizacao}
                                  </p>
                                  {foraDaRota && (
                                    <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                                      ⚠ Município fora da rota da viagem (origem/destino)
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEscola(esc.codigo_escola)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                                  title="Remover escola"
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              {/* Etapas a monitorar nesta escola */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-green-100">
                                {esc.etapas.length > 0 ? (
                                  esc.etapas.map((et) => (
                                    <span
                                      key={et}
                                      className="text-[11px] bg-[#0D6E3F] text-white px-2 py-0.5 rounded-full font-medium"
                                    >
                                      {et}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic">Nenhuma etapa selecionada</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenEtapasFor(openEtapasFor === esc.codigo_escola ? null : esc.codigo_escola)
                                  }
                                  className="ml-auto text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  {openEtapasFor === esc.codigo_escola ? "Fechar" : "+ Etapas"}
                                </button>
                              </div>

                              <AnimatePresence>
                                {openEtapasFor === esc.codigo_escola && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                      {ETAPAS_OPCOES.map((et) => {
                                        const checked = esc.etapas.includes(et);
                                        return (
                                          <label
                                            key={et}
                                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors select-none ${
                                              checked
                                                ? "bg-[#0D6E3F] text-white border-[#0D6E3F]"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              className="hidden"
                                              checked={checked}
                                              onChange={() => handleToggleEtapa(esc.codigo_escola, et)}
                                            />
                                            {et}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedEscolas.length === 0 && !escolaSearchError && (
                        <p className="text-xs text-gray-400">Nenhuma escola adicionada ainda.</p>
                      )}
                    </div>
                  </div>

                  {formMessage && (
                    <div className={`p-4 rounded-lg text-sm font-semibold ${
                      formMessage.type === "success" 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {formMessage.text}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    {editingDiariaId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDiariaId(null);
                          setModoLancamento("individual");
                          setEquipeMembros([]);
                          setEditingEquipeId(null);
                          setEquipeExistingRows({});
                          setEquipeMatriculaInput("");
                          setEquipeMembroError("");
                          handleCancelRegisterEquipeMembro();
                          setDestino("");
                          setOrigemMunicipio("");
                          setDestinosMunicipios([]);
                          setDestinoMunicipioAtual("");
                          setDestinoError("");
                          setDataSaida("");
                          setDataRetorno("");
                          setOrdemServico("");
                          setValorDiaria(valorDiariaConfig);
                          setQuantidadeDiarias(3.5);
                          setSelectedEscolas([]);
                          setEscolaCodigoInput("");
                          setEscolaSearchError("");
                          setOpenEtapasFor(null);
                          setEscolaPendente(null);
                        }}
                        className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0D6E3F] hover:bg-[#0a5c35] text-white px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {editingDiariaId ? "Atualizar Diária" : "Lançar Diária"}
                    </button>
                  </div>
                </form>
                )}
              </div>

            </div>

            {/* Right/List column (My Diaries) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Minhas Diárias Lançadas</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Seus lançamentos cadastrados no sistema.</p>
                  </div>
                  {minhasDiarias.length > 0 && (
                    <button
                      type="button"
                      onClick={() => exportDiariasToPdf(minhasDiarias)}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-[#0D6E3F] hover:border-green-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Imprimir todas as minhas diárias"
                    >
                      <Printer size={14} />
                      Imprimir Todas
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {minhasDiarias.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">Nenhuma diária cadastrada ainda.</p>
                  ) : (
                    minhasDiarias.map((diaria) => (
                      <div key={diaria.id} className="p-4 bg-gray-50 border border-gray-150 rounded-lg hover:border-green-150 transition-all flex justify-between items-start gap-2">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-800">OS {diaria.ordem_servico}</span>
                            <span className="text-xs bg-green-100 text-[#0D6E3F] px-2 py-0.5 rounded-full font-semibold">
                              {diaria.quantidade_diarias}d
                            </span>
                            {diaria.equipe_id && (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <Users size={11} /> Lançada em equipe
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]" title={diaria.destino}>
                            {diaria.destino}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(diaria.data_saida).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(diaria.data_retorno).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </p>
                          <p className="text-xs font-semibold text-gray-700">
                            Total: {(Number(diaria.valor_diaria) * Number(diaria.quantidade_diarias)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          {diaria.escolas && diaria.escolas.length > 0 && (
                            <p className="text-xs text-[#0D6E3F] flex items-center gap-1">
                              <School size={12} /> {diaria.escolas.length} escola(s) monitorada(s)
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => exportDiariasToPdf([diaria])}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            title="Imprimir esta diária"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handleEditClick(diaria)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(diaria.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Admin Dashboard Area */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-xl border border-gray-100 shadow-lg space-y-6"
          >
            <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Shield size={24} className="text-[#0D6E3F]" />
                  Painel Geral de Monitoramento (Admin)
                </h2>
                <p className="text-sm text-gray-400 mt-1">Consolidação e exportação de todas as diárias do sistema.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleToggleBloqueio}
                  disabled={isTogglingBloqueio}
                  className={`px-5 py-3 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-50 ${
                    periodoBloqueado
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  {isTogglingBloqueio ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : periodoBloqueado ? (
                    <Unlock size={18} />
                  ) : (
                    <Lock size={18} />
                  )}
                  {periodoBloqueado ? "Liberar Lançamento de Diárias" : "Bloquear Lançamento de Diárias"}
                </button>
                <div className="flex flex-col gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase w-16 shrink-0">Formato</span>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportarExcel}
                        onChange={(e) => setExportarExcel(e.target.checked)}
                        className="accent-[#0D6E3F] w-4 h-4 cursor-pointer"
                      />
                      <FileSpreadsheet size={16} className="text-[#0D6E3F]" />
                      Excel
                    </label>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportarPdf}
                        onChange={(e) => setExportarPdf(e.target.checked)}
                        className="accent-red-600 w-4 h-4 cursor-pointer"
                      />
                      <FileText size={16} className="text-red-600" />
                      PDF
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase w-16 shrink-0">Relatório</span>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={incluirRelatorioDiarias}
                        onChange={(e) => setIncluirRelatorioDiarias(e.target.checked)}
                        className="accent-[#0D6E3F] w-4 h-4 cursor-pointer"
                      />
                      Diárias
                    </label>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={incluirRelatorioEscolas}
                        onChange={(e) => setIncluirRelatorioEscolas(e.target.checked)}
                        className="accent-[#0D6E3F] w-4 h-4 cursor-pointer"
                      />
                      Escolas Monitoradas
                    </label>
                    <button
                      onClick={() => {
                        const opts = { incluirDiarias: incluirRelatorioDiarias, incluirEscolas: incluirRelatorioEscolas };
                        if (exportarExcel) exportDiariasToExcel(diariasFiltradas, opts);
                        if (exportarPdf) exportDiariasToPdf(diariasFiltradas, opts);
                      }}
                      disabled={
                        diariasFiltradas.length === 0 ||
                        (!exportarExcel && !exportarPdf) ||
                        (!incluirRelatorioDiarias && !incluirRelatorioEscolas)
                      }
                      className="ml-auto bg-[#0D6E3F] hover:bg-[#0a5c35] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-50"
                    >
                      <FileSpreadsheet size={18} />
                      Exportar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {periodoBloqueado && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                <Lock size={18} />
                O lançamento de diárias está bloqueado para os técnicos. Clique em "Liberar Lançamento de Diárias" para reabrir.
              </div>
            )}

            {/* Configuração do valor fixo da diária para o período de monitoramento */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm shrink-0">
                <DollarSign size={16} />
                Valor da Diária (período de monitoramento)
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Valor Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoValorDiariaConfig}
                    onChange={(e) => setNovoValorDiariaConfig(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 text-sm w-40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSalvarValorDiaria}
                  disabled={isSalvandoValorDiaria}
                  className="bg-[#0D6E3F] hover:bg-[#0a5c35] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isSalvandoValorDiaria ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Salvar Valor
                </button>
                <span className="text-xs text-gray-400">
                  Valor atual: <span className="font-semibold text-gray-600">{valorDiariaConfig.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </span>
                {valorDiariaSalvoMsg && (
                  <span className="text-xs text-[#0D6E3F] font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Valor atualizado com sucesso!
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 -mt-3">
              Este é o único valor de diária considerado nos novos lançamentos dos técnicos; eles não podem alterá-lo.
            </p>

            <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-2">
              <ListOrdered size={16} className="text-gray-400 shrink-0" />
              A OS de cada lançamento (individual ou de equipe) é gerada automaticamente pelo sistema — é ela que
              separa os lançamentos/equipes no relatório exportado. O admin não define mais uma OS fixa para o período.
            </p>

            {/* Date filter for the admin table / export */}
            <div className="flex flex-col md:flex-row md:items-end gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm">
                <Filter size={16} />
                Filtrar por período / OS
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">De</label>
                  <input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Até</label>
                  <input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">OS</label>
                  <select
                    value={filtroOS}
                    onChange={(e) => setFiltroOS(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800 text-sm bg-white"
                  >
                    <option value="">Todas</option>
                    {osDisponiveis.map((os) => (
                      <option key={os} value={os}>
                        {os}
                      </option>
                    ))}
                  </select>
                </div>
                {(filtroDataInicio || filtroDataFim || filtroOS) && (
                  <button
                    type="button"
                    onClick={handleLimparFiltroData}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    Limpar filtro
                  </button>
                )}
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <CalendarRange size={14} />
                  {diariasFiltradas.length} de {todasDiarias.length} diária(s)
                </span>
              </div>
            </div>

            {/* Admin Table of Diarias */}
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse text-sm text-gray-600">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-700">
                    <th className="p-4">Regional</th>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Matrícula</th>
                    <th className="p-4">Destino</th>
                    <th className="p-4">Saída / Retorno</th>
                    <th className="p-4">OS</th>
                    <th className="p-4">Valor Unit.</th>
                    <th className="p-4">Qtd.</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Escolas</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {diariasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        {todasDiarias.length === 0
                          ? "Nenhum registro de diária encontrado no banco de dados."
                          : "Nenhuma diária encontrada para o período filtrado."}
                      </td>
                    </tr>
                  ) : (
                    diariasFiltradas.map((diaria) => (
                      <tr key={diaria.id} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-4 font-semibold">{diaria.tecnicos?.regional}</td>
                        <td className="p-4 font-medium text-gray-800">{diaria.tecnicos?.nome}</td>
                        <td className="p-4">{diaria.matricula_tecnico}</td>
                        <td className="p-4 truncate max-w-[150px]" title={diaria.destino}>{diaria.destino}</td>
                        <td className="p-4">
                          {new Date(diaria.data_saida).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(diaria.data_retorno).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </td>
                        <td className="p-4 font-semibold text-gray-800">
                          <span className="flex items-center gap-1.5">
                            {diaria.ordem_servico}
                            {diaria.equipe_id && (
                              <Users size={13} className="text-blue-600" aria-label="Lançada em equipe" />
                            )}
                          </span>
                        </td>
                        <td className="p-4">{Number(diaria.valor_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="p-4 font-semibold text-[#0D6E3F]">{diaria.quantidade_diarias}</td>
                        <td className="p-4 font-bold text-gray-850">
                          {(Number(diaria.valor_diaria) * Number(diaria.quantidade_diarias)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-4 text-xs text-gray-500" title={(diaria.escolas || []).map(e => e.escola).join(', ')}>
                          {diaria.escolas && diaria.escolas.length > 0 ? `${diaria.escolas.length} escola(s)` : '—'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => {
                                setSearchMatricula(diaria.matricula_tecnico);
                                handleSearchTecnico();
                                handleEditClick(diaria);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(diaria.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </div>
    </MainLayout>
  );
}
