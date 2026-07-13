"use client";

import { useState, useEffect } from "react";

const ENDERECO_RU_UNB = "addr_test1qr64pva83qe6mysrfxunvma0f5nutg7krwrn3fapjuqkc8jxpf4hwa5348shsj90aj8490elm4fqalj2h7py49s3086szvqea2";

// Banco de Dados Mockado
const BANCO_DE_DADOS_ALUNOS: Record<string, any> = {
  "241008569": { 
    nome: "Gustavo Neri", 
    curso: "Engenharia de Redes de Comunicação", 
    grupo: "Grupo II", 
    carteira_registrada: "addr_test1qrg7cvzegnqq9jcws8vspwfpkchxcsmu0f4qke3eyzttt4rdd8878dlhqkkqmgk4qzezc855e2gs8q5q76hhwffw3rdsv7ylvj" 
  },
  "241009999": { 
    nome: "Eduardo Rodrigues", 
    curso: "Engenharia de Redes de Comunicação", 
    grupo: "Grupo I", 
    carteira_registrada: "addr_test1qphmdgz8r4vx3hhrltlgvfp5qmlpd94wlcuj623ksmcnvxmtrypywe3e9ulraekafh38a2qqqhkf8a09dc26zn4gnf5shumutd" 
  },
};

export default function AppAluno() {
  const [catracaId, setCatracaId] = useState<string | null>(null);
  const [lucid, setLucid] = useState<any>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [saldoFichas, setSaldoFichas] = useState<number | null>(null);
  const [alunoLogado, setAlunoLogado] = useState<any>(null);
  
  const [turno, setTurno] = useState<"cafe" | "almoco" | "jantar" | "fechado">("fechado");
  const [custo, setCusto] = useState(0);
  const [processando, setProcessando] = useState(false);
  const [pago, setPago] = useState(false);
  const [conectando, setConectando] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCatracaId(params.get("id"));
  }, []);

  useEffect(() => {
    const hora = new Date().getHours();
    if (hora >= 7 && hora < 10) { setTurno("cafe"); setCusto(1); }
    else if (hora >= 11 && hora < 15) { setTurno("almoco"); setCusto(2); }
    else if (hora >= 17 && hora < 24) { setTurno("jantar"); setCusto(2); }
    else { setTurno("fechado"); setCusto(0); }
  }, []);

  const conectarConta = async () => {
    setConectando(true);
    try {
      // IMPORTAÇÃO DINÂMICA: Carrega a biblioteca apenas no navegador quando o botão for clicado
      const { inicializarCarteiraLace } = await import("../../services/cardano");
      
      const conexao = await inicializarCarteiraLace();
      if (conexao) {
        setLucid(conexao.lucid);
        setEndereco(conexao.endereco);
        
        const alunoEncontrado = Object.values(BANCO_DE_DADOS_ALUNOS).find(
          (aluno) => aluno.carteira_registrada === conexao.endereco
        );
        if (alunoEncontrado) {
          setAlunoLogado(alunoEncontrado);
        }
      }
    } catch (error) {
      console.error("Erro ao conectar conta:", error);
    } finally {
      setConectando(false);
    }
  };

  useEffect(() => {
    if (!lucid || !endereco) return;
    const buscarSaldo = async () => {
      try {
        // IMPORTAÇÃO DINÂMICA: Carrega as funções do Lucid apenas no lado do cliente
        const { getAddressDetails, mintingPolicyToId, scriptFromNative } = await import("@lucid-evolution/lucid");
        
        const detalhesEndereco = getAddressDetails(endereco);
        const politica = scriptFromNative({ type: "sig", keyHash: detalhesEndereco.paymentCredential?.hash || "" });
        const policyId = mintingPolicyToId(politica);
        const unidade = policyId + "46696368615255";
        
        const utxos = await lucid.wallet().getUtxos();
        let total = BigInt(0);
        if (utxos) {
          for (const utxo of utxos) {
            if (utxo.assets[unidade]) total += utxo.assets[unidade];
          }
        }
        setSaldoFichas(Number(total));
      } catch (e) {
        console.error("Erro ao buscar saldo:", e);
      }
    };
    buscarSaldo();
  }, [lucid, endereco]);

  const realizarPagamento = async () => {
    if (!lucid || !endereco || !catracaId) return;
    
    try {
      setProcessando(true);
      
      // IMPORTAÇÃO DINÂMICA: Novamente, carrega as funções do Lucid na hora de montar a transação
      const { getAddressDetails, mintingPolicyToId, scriptFromNative } = await import("@lucid-evolution/lucid");
      
      const detalhesEndereco = getAddressDetails(endereco);
      const politica = scriptFromNative({ type: "sig", keyHash: detalhesEndereco.paymentCredential?.hash || "" });
      const policyId = mintingPolicyToId(politica);
      const unidade = policyId + "46696368615255";

      if (saldoFichas !== null && saldoFichas < custo) {
        alert(`Saldo insuficiente! Você tem ${saldoFichas} fichas.`);
        setProcessando(false);
        return;
      }

      const tx = await lucid.newTx()
        .pay.ToAddress(ENDERECO_RU_UNB, { [unidade]: BigInt(custo) })
        .complete();

      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      // Aguardamos a resposta da catraca enviando a quantidade de tokens pagos
      const response = await fetch("/api/catraca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: catracaId, txHash, tokensPagos: custo })
      });

      // SE A CATRACA BARRAR
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Acesso negado pela catraca.");
        setProcessando(false);
        return;
      }

      // SE TUDO DEU CERTO
      setPago(true);
      setSaldoFichas(prev => (prev !== null ? prev - custo : null));
      
    } catch (erro) {
      console.error(erro);
      alert("Erro na transação com a carteira.");
    } finally {
      setProcessando(false);
    }
  };

  const liberarAcessoSubsidiado = async () => {
    if (!catracaId) return;
    try {
      setProcessando(true);
      
      const response = await fetch("/api/catraca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: catracaId, txHash: "ACESSO_SUBSIDIADO_UNB", tokensPagos: custo })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Acesso subsidiado negado pela catraca.");
        setProcessando(false);
        return;
      }

      setTimeout(() => {
        setPago(true);
        setProcessando(false);
      }, 1000);

    } catch (erro) {
      console.error(erro);
      setProcessando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-6">
      <div className="bg-zinc-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-zinc-700 text-center">
        <h1 className="text-xl font-bold text-white mb-2">UNB DIGITAL WALLET</h1>
        <p className="text-sm text-zinc-400 mb-8">Ponto: <span className="font-mono text-purple-400">{catracaId}</span></p>

        {!endereco ? (
          <div className="py-8">
            <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <button 
              onClick={conectarConta} 
              disabled={conectando}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
            >
              {conectando ? "Autorizando..." : "Desbloquear Carteira"}
            </button>
          </div>
        ) : pago ? (
          <div className="space-y-4 py-6">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-green-400">ACESSO LIBERADO!</h2>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            
            {/* DADOS DO ALUNO LOGADO */}
            {alunoLogado && (
              <div className="mb-4">
                <p className="text-white font-bold">{alunoLogado.nome}</p>
                <p className={`text-xs font-mono mt-1 ${alunoLogado.grupo === "Grupo I" ? "text-blue-400" : "text-zinc-400"}`}>
                  {alunoLogado.grupo}
                </p>
              </div>
            )}

            {/* CAIXA VERMELHA */}
            {!alunoLogado && endereco && (
              <div className="mb-4 bg-red-900/30 p-3 rounded-xl border border-red-800">
                <p className="text-red-400 text-xs font-bold mb-1">Carteira não cadastrada no BD:</p>
                <p className="text-red-200 text-[10px] font-mono break-all text-left select-all">{endereco}</p>
                <p className="text-zinc-400 text-[10px] mt-2">Copie o endereço acima e cole na variável carteira_registrada do colega.</p>
              </div>
            )}

            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 shadow-inner">
              <p className="text-xs text-zinc-500 font-bold mb-1 tracking-widest">SEU SALDO DE FICHAS</p>
              <p className="text-4xl font-black text-green-400">
                {saldoFichas !== null ? `${saldoFichas} Fichas` : "..."}
              </p>
            </div>

            {turno === "fechado" ? (
              <button disabled className="w-full bg-zinc-700 text-zinc-400 font-bold py-4 rounded-xl cursor-not-allowed">
                RU Fechado
              </button>
            ) : alunoLogado?.grupo === "Grupo I" ? (
              <button 
                onClick={liberarAcessoSubsidiado} 
                disabled={processando}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-6 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2"
              >
                {processando ? "Autenticando..." : "ACESSO SUBSIDIADO"}
              </button>
            ) : (
              <button 
                onClick={realizarPagamento} 
                disabled={processando}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black text-lg py-6 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2"
              >
                {processando ? (
                  <span className="animate-pulse">Aguardando...</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    PAGAR ACESSO ({custo} Fichas)
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}