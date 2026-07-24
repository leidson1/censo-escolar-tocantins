"use client";

import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, UserPlus, PlusCircle, Edit3, Trash2, Shield, 
  FileSpreadsheet, Calendar, MapPin, DollarSign, ListOrdered, CheckCircle2,
  Route, ExternalLink, Loader2, Hash
} from "lucide-react";
import AccessCodeModal from "@/components/censo/AccessCodeModal";
import { exportDiariasToExcel } from "@/lib/exportExcel";

interface Tecnico {
  matricula: string;
  nome: string;
  regional: string;
}

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
  tecnicos: {
    matricula: string;
    nome: string;
    regional: string;
  };
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
  const [dataSaida, setDataSaida] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");
  const [ordemServico, setOrdemServico] = useState("");
  const [valorDiaria, setValorDiaria] = useState(335.00);
  const [quantidadeDiarias, setQuantidadeDiarias] = useState<number>(0);
  const [qtdManuallyEdited, setQtdManuallyEdited] = useState(false);

  // Route states
  const [showRotaSection, setShowRotaSection] = useState(false);
  const [origemRota, setOrigemRota] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanciaError, setDistanciaError] = useState("");

  // Status states
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List states
  const [minhasDiarias, setMinhasDiarias] = useState<Diaria[]>([]);
  const [todasDiarias, setTodasDiarias] = useState<Diaria[]>([]);

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
          )
        `)
        .eq("matricula_tecnico", matricula)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMinhasDiarias(data as unknown as Diaria[]);
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
          )
        `)
        .order("ordem_servico", { ascending: true });

      if (!error && data) {
        setTodasDiarias(data as unknown as Diaria[]);
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

  // Handle register new technician
  const handleRegisterTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMatricula.trim() || !newTecnicoNome.trim() || !newTecnicoRegional.trim()) {
      setRegError("Preencha todos os campos.");
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

  // Handle Submit or Edit of Diaria
  const handleSubmitDiaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTecnico) return;
    if (!destino.trim() || !dataSaida || !dataRetorno) {
      setFormMessage({ type: "error", text: "Preencha os campos obrigatórios: Destino, Data de Saída e Data de Retorno." });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    const diariaData = {
      matricula_tecnico: activeTecnico.matricula,
      destino: destino.trim(),
      data_saida: dataSaida,
      data_retorno: dataRetorno,
      ordem_servico: ordemServico.trim() || null,
      valor_diaria: valorDiaria,
      quantidade_diarias: quantidadeDiarias,
      origem_rota: origemRota.trim() || null,
      distancia_km: distanciaKm ? parseFloat(distanciaKm) : null,
      updated_at: new Date().toISOString()
    };

    try {
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
        const { error } = await supabase
          .from("diarias")
          .insert([diariaData]);

        if (error) throw error;
        setFormMessage({ type: "success", text: "Diária lançada com sucesso!" });
      }

      // Reset form
      setEditingDiariaId(null);
      setDestino("");
      setDataSaida("");
      setDataRetorno("");
      setOrdemServico("");
      setValorDiaria(335.00);
      setQuantidadeDiarias(0);
      setQtdManuallyEdited(false);
      setOrigemRota("");
      setDistanciaKm("");
      setShowRotaSection(false);
      setDistanciaError("");

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
  const handleEditClick = (diaria: Diaria) => {
    setEditingDiariaId(diaria.id);
    setDestino(diaria.destino);
    setDataSaida(diaria.data_saida);
    setDataRetorno(diaria.data_retorno);
    setOrdemServico(diaria.ordem_servico || "");
    setValorDiaria(Number(diaria.valor_diaria));
    setQuantidadeDiarias(Number(diaria.quantidade_diarias));
    setQtdManuallyEdited(true); // when editing, preserve saved value
    setOrigemRota(diaria.origem_rota || "");
    setDistanciaKm(diaria.distancia_km ? String(diaria.distancia_km) : "");
    if (diaria.origem_rota || diaria.distancia_km) setShowRotaSection(true);
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

  return (
    <MainLayout title="Gerenciamento de Diárias de Viagem">
      {/* Access Control Modal */}
      <AccessCodeModal
        isOpen={isAdminModalOpen}
        resourceName="Painel Administrativo de Diárias"
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Diretoria Regional de Ensino (Regional)</label>
                  <input
                    type="text"
                    value={newTecnicoRegional}
                    onChange={(e) => setNewTecnicoRegional(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                    placeholder="Ex: Araguaína, Palmas, Gurupi"
                  />
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

        {/* Technician and Form Dashboard */}
        {activeTecnico && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Form column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Technician Info Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="bg-green-50 p-4 rounded-full text-[#0D6E3F]">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Técnico Identificado</span>
                  <h3 className="text-xl font-bold text-gray-800">{activeTecnico.nome}</h3>
                  <p className="text-sm text-gray-500">Matrícula: {activeTecnico.matricula} | Regional: {activeTecnico.regional}</p>
                </div>
              </div>

              {/* Lançar Form Card */}
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <PlusCircle className="text-[#0D6E3F]" size={22} />
                    {editingDiariaId ? "Editar Lançamento de Diária" : "Lançar Nova Diária"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">Preencha os dados da viagem abaixo.</p>
                </div>

                <form onSubmit={handleSubmitDiaria} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OS - optional */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <ListOrdered size={16} className="text-gray-400" />
                        Ordem de Serviço (OS)
                        <span className="ml-1 text-xs text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={ordemServico}
                        onChange={(e) => setOrdemServico(e.target.value)}
                        placeholder="Ex: 3632"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                      />
                    </div>

                    {/* Destino */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <MapPin size={16} className="text-gray-400" />
                        Destino *
                      </label>
                      <input
                        type="text"
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        required
                        placeholder="Ex: Palmas/Lizarda/Palmas"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                      />
                    </div>

                    {/* Data Saída */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Calendar size={16} className="text-gray-400" />
                        Data de Saída *
                      </label>
                      <input
                        type="date"
                        value={dataSaida}
                        onChange={(e) => { setDataSaida(e.target.value); setQtdManuallyEdited(false); }}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                      />
                    </div>

                    {/* Data Retorno */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Calendar size={16} className="text-gray-400" />
                        Data de Retorno *
                      </label>
                      <input
                        type="date"
                        value={dataRetorno}
                        onChange={(e) => { setDataRetorno(e.target.value); setQtdManuallyEdited(false); }}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                      />
                    </div>

                    {/* Valor Diária */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <DollarSign size={16} className="text-gray-400" />
                        Valor Unitário da Diária (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={valorDiaria}
                        onChange={(e) => setValorDiaria(parseFloat(e.target.value))}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0D6E3F] text-gray-800"
                      />
                    </div>

                    {/* Quantidade Diárias — auto-calculated */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Hash size={16} className="text-gray-400" />
                        Quantidade de Diárias (QTD) *
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
                            : "border-gray-200"
                        }`}
                      />
                      {dataSaida && dataRetorno && !qtdManuallyEdited && (
                        <p className="text-xs text-gray-400 mt-1">
                          Calculado: dias entre datas + 0,5 (meio dia de retorno)
                        </p>
                      )}
                    </div>
                  </div>

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
                          setDestino("");
                          setDataSaida("");
                          setDataRetorno("");
                          setOrdemServico("");
                          setValorDiaria(335.00);
                          setQuantidadeDiarias(3.5);
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
              </div>

            </div>

            {/* Right/List column (My Diaries) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-lg font-bold text-gray-800">Minhas Diárias Lançadas</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Seus lançamentos cadastrados no sistema.</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {minhasDiarias.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">Nenhuma diária cadastrada ainda.</p>
                  ) : (
                    minhasDiarias.map((diaria) => (
                      <div key={diaria.id} className="p-4 bg-gray-50 border border-gray-150 rounded-lg hover:border-green-150 transition-all flex justify-between items-start gap-2">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800">OS {diaria.ordem_servico}</span>
                            <span className="text-xs bg-green-100 text-[#0D6E3F] px-2 py-0.5 rounded-full font-semibold">
                              {diaria.quantidade_diarias}d
                            </span>
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
                        </div>
                        <div className="flex gap-1">
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
              <button
                onClick={() => exportDiariasToExcel(todasDiarias)}
                disabled={todasDiarias.length === 0}
                className="bg-[#0D6E3F] hover:bg-[#0a5c35] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-50"
              >
                <FileSpreadsheet size={20} />
                Exportar Planilha Excel (.xlsx)
              </button>
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
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todasDiarias.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400">
                        Nenhum registro de diária encontrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    todasDiarias.map((diaria) => (
                      <tr key={diaria.id} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-4 font-semibold">{diaria.tecnicos?.regional}</td>
                        <td className="p-4 font-medium text-gray-800">{diaria.tecnicos?.nome}</td>
                        <td className="p-4">{diaria.matricula_tecnico}</td>
                        <td className="p-4 truncate max-w-[150px]" title={diaria.destino}>{diaria.destino}</td>
                        <td className="p-4">
                          {new Date(diaria.data_saida).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(diaria.data_retorno).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </td>
                        <td className="p-4 font-semibold text-gray-800">{diaria.ordem_servico}</td>
                        <td className="p-4">{Number(diaria.valor_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="p-4 font-semibold text-[#0D6E3F]">{diaria.quantidade_diarias}</td>
                        <td className="p-4 font-bold text-gray-850">
                          {(Number(diaria.valor_diaria) * Number(diaria.quantidade_diarias)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
