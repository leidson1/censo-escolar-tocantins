"use client";

import { useState, useEffect } from "react";
import { Search, Book, X, HelpCircle, ChevronRight, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface DictionaryItem {
  tabela: string;
  nome_variavel: string;
  descricao: string;
  categoria: any;
  notas: string | null;
}

export default function CensoDictionary() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const tables = ["all", "escola", "gestor", "docente", "matricula", "turma"];

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, search, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("dicionario_censo")
      .select("*")
      .order("nome_variavel", { ascending: true });

    if (search) {
      query = query.or(`nome_variavel.ilike.%${search}%,descricao.ilike.%${search}%`);
    }

    if (activeTab !== "all") {
      query = query.eq("tabela", activeTab);
    }

    const { data } = await query.limit(50);
    setItems(data || []);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 p-4 bg-[#0D6E3F] text-white rounded-full shadow-2xl hover:bg-[#0a5a34] transition-all group active:scale-95"
        title="Dicionário do Censo"
      >
        <HelpCircle size={28} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Modal / Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 bg-[#0D6E3F] text-white">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Book size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold leading-tight">Dicionário de Variáveis</h2>
                      <p className="text-xs text-green-100 opacity-80">Consulte o significado de cada campo</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-200 opacity-60" size={18} />
                  <input
                    type="text"
                    placeholder="Pesquisar variável ou descrição..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-green-100 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex overflow-x-auto p-3 bg-gray-50 border-b border-gray-100 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="flex gap-2">
                  {tables.map(table => (
                    <button
                      key={table}
                      onClick={() => setActiveTab(table)}
                      className={`
                        px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                        ${activeTab === table 
                          ? "bg-white text-[#0D6E3F] shadow-sm border-green-100" 
                          : "bg-transparent text-gray-400 border-transparent hover:text-gray-600"}
                      `}
                    >
                      {table === "all" ? "Todas" : table}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D6E3F]"></div>
                    <p className="text-sm font-medium">Buscando informações...</p>
                  </div>
                )}

                {!loading && items.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">Nenhum resultado encontrado.</p>
                  </div>
                )}

                {!loading && items.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.nome_variavel + idx}
                    className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-[#0D6E3F] uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">
                        {item.nome_variavel}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">{item.tabela}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-[#0D6E3F] transition-colors">
                      {item.descricao}
                    </h3>
                    {item.notas && (
                      <p className="text-[11px] text-gray-500 italic leading-relaxed">
                        {item.notas}
                      </p>
                    )}
                    
                    {/* Categoria rendering if exists */}
                    {item.categoria && (
                      <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2">
                        {typeof item.categoria === 'object' && Object.entries(item.categoria).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2 text-[10px]">
                            <span className="font-bold text-gray-400">{k}:</span>
                            <span className="text-gray-600 truncate">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
