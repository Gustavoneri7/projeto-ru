"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RedirectPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      // O replace substitui a página atual, evitando o histórico bloqueado
      window.location.replace(`http://localhost:3000/app-aluno?id=${id}`);
    }
  }, [id]);

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">
      <div className="text-center">
        <p className="mb-4">Redirecionando para ambiente seguro...</p>
        <button 
          onClick={() => window.location.replace(`http://localhost:3000/app-aluno?id=${id}`)}
          className="bg-blue-600 px-6 py-2 rounded-lg font-bold"
        >
          Clique aqui se não redirecionar
        </button>
      </div>
    </div>
  );
}