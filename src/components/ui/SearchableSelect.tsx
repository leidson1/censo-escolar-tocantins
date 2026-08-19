"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  emptyLabel?: string;
  disabled?: boolean;
}

/**
 * Dropdown com campo de busca embutido. Clique para abrir, digite para filtrar
 * as opções e clique (ou Enter) para selecionar.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  className,
  emptyLabel = "Nenhum resultado",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fecha o dropdown se ele ficar desabilitado enquanto estava aberto
  // (ex.: municípios ainda carregando).
  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setQuery("");
    }
  }, [disabled]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const selectOption = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) selectOption(filtered[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={cn(
          "bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none w-full flex items-center justify-between gap-2 text-left",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown size={14} className={cn("text-gray-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[60] mt-2 w-full min-w-[220px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative p-2 border-b border-gray-50">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-7 pr-2 py-1.5 text-sm font-medium text-gray-700 outline-none bg-transparent"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-gray-400 font-medium">{emptyLabel}</p>
            )}
            {filtered.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setHighlight(idx)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm font-semibold flex items-center justify-between gap-2 truncate",
                  idx === highlight ? "bg-green-50 text-[#0D6E3F]" : "text-gray-600"
                )}
              >
                <span className="truncate">{opt}</span>
                {opt === value && <Check size={14} className="text-[#0D6E3F] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
