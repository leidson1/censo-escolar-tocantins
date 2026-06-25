"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, ShieldX, Eye, EyeOff } from "lucide-react";

const ACCESS_CODE = "@censo@123645";

interface CensoAccessGateProps {
  children: ReactNode;
}

export default function CensoAccessGate({ children }: CensoAccessGateProps) {
  const [granted, setGranted] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      setError(false);
      setGranted(true);
    } else {
      setError(true);
      setShaking(true);
      setCode("");
      setTimeout(() => setShaking(false), 500);
      inputRef.current?.focus();
    }
  };

  if (granted) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4">
      <div
        className={`bg-white rounded-2xl shadow-xl border border-green-100 p-8 w-full max-w-md transition-transform ${
          shaking ? "animate-shake" : ""
        }`}
        style={
          shaking
            ? { animation: "shake 0.4s ease" }
            : {}
        }
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${error ? "bg-red-100" : "bg-green-100"} transition-colors`}>
            {error ? (
              <ShieldX size={40} className="text-red-500" />
            ) : (
              <Lock size={40} className="text-[#0D6E3F]" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">
          Acesso Restrito
        </h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          Insira o código de acesso para visualizar os dados do{" "}
          <span className="font-semibold text-[#0D6E3F]">Censo Escolar 2025</span>.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showCode ? "text" : "password"}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              placeholder="Código de acesso"
              className={`w-full border rounded-lg px-4 py-3 pr-10 text-gray-800 outline-none transition-all focus:ring-2 ${
                error
                  ? "border-red-400 focus:ring-red-200 bg-red-50"
                  : "border-gray-200 focus:ring-green-200 focus:border-[#0D6E3F]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <ShieldX size={14} /> Código incorreto. Tente novamente.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#0D6E3F] hover:bg-[#0a5c35] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            Acessar
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
          >
            ← Voltar para o início
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
