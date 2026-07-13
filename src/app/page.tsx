"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";

// Tabela baseada na Resolução nº 0037/2025 do CAD/UnB
const TABELA_PRECOS: Record<string, { cafe: number; almoco: number; jantar: number }> = {
  "Grupo I": { cafe: 0, almoco: 0, jantar: 0 },
  "Grupo II": { cafe: 2.00, almoco: 4.50, jantar: 4.50 },
  "Grupo III": { cafe: 7.05, almoco: 15.20, jantar: 15.20 },
  "Grupo IV": { cafe: 1.50, almoco: 2.50, jantar: 2.50 }
};

const BANCO_DE_DADOS_ALUNOS: Record<string, any> = {
  "241008569": { 
    nome: "Gustavo Néri", 
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

const ENDERECO_RU_UNB = "addr_test1qr64pva83qe6mysrfxunvma0f5nutg7krwrn3fapjuqkc8jxpf4hwa5348shsj90aj8490elm4fqalj2h7py49s3086szvqea2"; 

export default function Home() {
  const [modoAtivo, setModoAtivo] = useState<"recarga" | "catraca">("recarga");
  
  // Estados da Recarga
  const [endereco, setEndereco] = useState<string | null>(null);
  const [lucid, setLucid] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [processandoTx, setProcessandoTx] = useState(false);
  const [statusTx, setStatusTx] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [inputMatricula, setInputMatricula] = useState("");
  const [alunoLogado, setAlunoLogado] = useState<any>(null);
  const [carrinho, setCarrinho] = useState<{ cafe: number; almoco: number; jantar: number }>({ cafe: 0, almoco: 0, jantar: 0 });
  const [saldoFichas, setSaldoFichas] = useState<number | null>(null);
  const [buscandoSaldo, setBuscandoSaldo] = useState(false);
  
  // Estados da Catraca
  const [refeicaoAtual, setRefeicaoAtual] = useState<"cafe" | "almoco" | "jantar" | "fechado">("fechado");
  const [catracaId] = useState("RU-CATRACA-01");
  const [statusCatraca, setStatusCatraca] = useState<"aguardando" | "liberado">("aguardando");
  const [hashLiberacao, setHashLiberacao] = useState<string | null>(null);
  const [ipLocal, setIpLocal] = useState("192.168.1.10");

  useEffect(() => {
    const atualizarTurno = () => {
      const agora = new Date();
      const horaAtual = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      const diaSemana = horaAtual.getDay();
      const hora = horaAtual.getHours();
      const minuto = horaAtual.getMinutes();
      const tempoDecimal = hora + (minuto / 60);

      const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

      if (!isFimDeSemana) {
        if (tempoDecimal >= 7.0 && tempoDecimal <= 9.5) setRefeicaoAtual("cafe");
        else if (tempoDecimal >= 11.0 && tempoDecimal <= 14.5) setRefeicaoAtual("almoco");
        else if (tempoDecimal >= 17.0 && tempoDecimal <= 19.5) setRefeicaoAtual("jantar");
        else setRefeicaoAtual("fechado");
      } else {
        if (tempoDecimal >= 7.0 && tempoDecimal <= 8.5) setRefeicaoAtual("cafe");
        else if (tempoDecimal >= 12.0 && tempoDecimal <= 13.5) setRefeicaoAtual("almoco");
        else if (tempoDecimal >= 17.0 && tempoDecimal <= 18.0) setRefeicaoAtual("jantar");
        else setRefeicaoAtual("fechado");
      }
    };

    // Executa na hora que a página carrega
    atualizarTurno();
    
    // Deixa um "vigia" rodando a cada 1 minuto (60000 ms) para fechar o RU em tempo real
    const intervalo = setInterval(atualizarTurno, 60000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (modoAtivo !== "catraca") return;
    const escutarAPI = async () => {
      try {
        const res = await fetch(`/api/catraca?id=${catracaId}`);
        const dados = await res.json();
        if (dados.status === "pago") {
          setStatusCatraca("liberado");
          setHashLiberacao(dados.txHash);
          setTimeout(async () => {
            setStatusCatraca("aguardando");
            setHashLiberacao(null);
            await fetch(`/api/catraca?id=${catracaId}`, { method: "DELETE" });
          }, 8000);
        }
      } catch (e) {}
    };
    const intervalo = setInterval(escutarAPI, 1000);
    return () => clearInterval(intervalo);
  }, [modoAtivo, catracaId]);

  useEffect(() => {
    if (!lucid || !endereco) return;
    const buscarSaldo = async () => {
      try {
        setBuscandoSaldo(true);
        // IMPORTAÇÃO DINÂMICA (Escondido do Servidor)
        const { getAddressDetails, mintingPolicyToId, scriptFromNative } = await import("@lucid-evolution/lucid");
        
        const detalhesEndereco = getAddressDetails(endereco);
        const politicaDeCunhagem = scriptFromNative({ type: "sig", keyHash: detalhesEndereco.paymentCredential?.hash || "" });
        const policyId = mintingPolicyToId(politicaDeCunhagem);
        const utxos = await lucid.wallet().getUtxos();
        let total = BigInt(0);
        if (utxos) {
          for (const utxo of utxos) {
            if (utxo.assets[policyId + "46696368615255"]) total += utxo.assets[policyId + "46696368615255"];
          }
        }
        setSaldoFichas((prev) => {
          if (prev !== null && prev > Number(total)) return prev;
          return Number(total);
        });
      } catch (e) { console.error("Erro na busca de saldo:", e); }
      finally { setBuscandoSaldo(false); }
    };
    buscarSaldo();
    const radarDeSaldo = setInterval(buscarSaldo, 15000);
    return () => clearInterval(radarDeSaldo);
  }, [endereco, lucid, txHash]);

  const simularLeituraQR = () => {
    const aluno = BANCO_DE_DADOS_ALUNOS[inputMatricula];
    if (aluno) { setAlunoLogado(aluno); setCarrinho({ cafe: 0, almoco: 0, jantar: 0 }); }
    else { alert("Matrícula não encontrada no sistema."); }
  };

  const conectarLace = async () => {
    setCarregando(true);
    // IMPORTAÇÃO DINÂMICA (Escondido do Servidor)
    const { inicializarCarteiraLace } = await import("../services/cardano");
    
    const conexao = await inicializarCarteiraLace();
    if (conexao) { setEndereco(conexao.endereco); setLucid(conexao.lucid); }
    setCarregando(false);
  };

  const totalADA = alunoLogado && alunoLogado.grupo !== "Grupo I" 
    ? (carrinho.cafe * TABELA_PRECOS[alunoLogado.grupo].cafe) + 
      (carrinho.almoco * TABELA_PRECOS[alunoLogado.grupo].almoco) + 
      (carrinho.jantar * TABELA_PRECOS[alunoLogado.grupo].jantar) 
    : 0;

  const realizarPagamentoRecarga = async () => {
    if (!lucid || !alunoLogado || totalADA === 0) return;
    try {
      setProcessandoTx(true); setStatusTx("Assinando...");
      // IMPORTAÇÃO DINÂMICA (Escondido do Servidor)
      const { getAddressDetails, mintingPolicyToId, scriptFromNative } = await import("@lucid-evolution/lucid");
      
      const detalhesEndereco = getAddressDetails(endereco!);
      const politicaDeCunhagem = scriptFromNative({ type: "sig", keyHash: detalhesEndereco.paymentCredential?.hash || "" });
      const policyId = mintingPolicyToId(politicaDeCunhagem);
      const totalFichas = BigInt(carrinho.cafe + (carrinho.almoco * 2) + (carrinho.jantar * 2));

      const tx = await lucid.newTx()
        .pay.ToAddress(ENDERECO_RU_UNB, { lovelace: BigInt(Math.round(totalADA * 1000000)) })
        .mintAssets({ [policyId + "46696368615255"]: totalFichas })
        .attach.MintingPolicy(politicaDeCunhagem)
        .attachMetadata(721, { [policyId]: { FichaRU: { name: "Token RU UnB" } } })
        .complete();

      const signedTx = await tx.sign.withWallet().complete();
      const hash = await signedTx.submit();
      
      setTxHash(hash);
      setSaldoFichas(prev => (prev !== null ? prev + Number(totalFichas) : Number(totalFichas)));
      setCarrinho({ cafe: 0, almoco: 0, jantar: 0 });

    } catch (e) { alert("Erro na recarga. Verifique a carteira."); }
    finally { setProcessandoTx(false); setStatusTx(""); }
  };

  const urlMobile = `http://localhost:3000/app-aluno?id=${catracaId}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 p-6">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setModoAtivo("recarga")} className={`px-6 py-2 rounded-full font-bold transition-all ${modoAtivo === "recarga" ? "bg-green-600 text-white shadow-lg" : "bg-zinc-300 text-zinc-600 hover:bg-zinc-400"}`}>Terminal de Recarga</button>
        <button onClick={() => setModoAtivo("catraca")} className={`px-6 py-2 rounded-full font-bold transition-all ${modoAtivo === "catraca" ? "bg-purple-600 text-white shadow-lg" : "bg-zinc-300 text-zinc-600 hover:bg-zinc-400"}`}>Catraca</button>
      </div>

      <div className={`bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border-t-8 ${modoAtivo === "recarga" ? "border-green-600" : "border-purple-600"}`}>
        
        {modoAtivo === "recarga" ? (
          <>
            <div className="text-center mb-6"><h1 className="text-2xl font-extrabold text-zinc-800">Recarga</h1><p className="text-sm text-zinc-500 font-medium">RU UnB</p></div>
            {!alunoLogado ? (
              <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl text-center">
                <input type="text" placeholder="Digite sua matrícula" className="w-full p-3 border border-zinc-300 rounded-lg text-center font-mono text-zinc-900 bg-white mb-3" value={inputMatricula} onChange={(e) => setInputMatricula(e.target.value)}/>
                <button onClick={simularLeituraQR} className="w-full bg-zinc-800 text-white font-bold py-3 rounded-lg">Confirmar</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-zinc-800 text-white p-4 rounded-xl flex flex-col gap-1">
                  <p className="text-sm font-bold">{alunoLogado.nome}</p>
                  <p className="text-xs text-zinc-400 font-mono">{alunoLogado.curso}</p>
                  <p className="text-xs text-green-400 font-bold tracking-wide mt-1">GRUPO: {alunoLogado.grupo}</p>
                </div>

                {alunoLogado.grupo === "Grupo I" ? (
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-green-800 font-bold text-lg mb-1">Acesso Subsídiado</h3>
                    <p className="text-green-700 text-sm">Estudantes do Grupo I possuem subsídio integral. Não é necessário adquirir fichas, seu acesso está liberado automaticamente na catraca.</p>
                  </div>
                ) : (
                  <>
                    {!endereco ? (
                      <button onClick={conectarLace} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl">{carregando ? "A conectar..." : "Realizar Recarga"}</button>
                    ) : (
                      <>
                        <div className="bg-green-50 p-3 rounded-xl text-xs flex justify-between items-center text-zinc-800 font-bold">
                          <span>Saldo Atual:</span>
                          <span className={`bg-green-600 text-white px-3 py-1 rounded-full transition-opacity duration-500 ${buscandoSaldo ? "opacity-50" : "opacity-100"}`}>
                            {saldoFichas !== null ? `${saldoFichas} Ficha(s)` : "Calculando..."}
                          </span>
                        </div>
                        {(Object.keys(carrinho) as Array<keyof typeof carrinho>).map((ref) => (
                          <div key={ref} className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg text-zinc-900 border border-zinc-200">
                            <span className="text-sm font-bold capitalize">
                              {ref.replace('cafe', 'Café')} <span className="text-green-700 text-xs ml-1">(tADA {TABELA_PRECOS[alunoLogado.grupo][ref].toFixed(2)})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setCarrinho(p => ({...p, [ref]: Math.max(0, p[ref] - 1)}))} className="w-6 h-6 bg-white border rounded font-bold">-</button>
                              <span className="w-4 text-center font-bold">{carrinho[ref]}</span>
                              <button onClick={() => setCarrinho(p => ({...p, [ref]: p[ref] + 1}))} className="w-6 h-6 bg-white border rounded font-bold">+</button>
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 border-t flex justify-between items-center mb-4 text-zinc-900 font-bold"><span>Total:</span><span className="text-2xl text-green-600">tADA {totalADA.toFixed(2)}</span></div>
                        
                        <button onClick={realizarPagamentoRecarga} disabled={totalADA === 0 || processandoTx} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">{processandoTx ? statusTx : "Confirmar Pagamento"}</button>

                        {txHash && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                            <p className="text-green-700 font-bold text-sm mb-2">✅ Recarga realizada com sucesso!</p>
                            <a href={`https://preview.cardanoscan.io/transaction/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-mono font-bold hover:underline break-all">
                              Ver recibo: {txHash.substring(0, 15)}...
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 flex flex-col items-center">
            <h1 className="text-2xl font-extrabold text-zinc-800 mb-1">Catraca de Acesso</h1>
            <p className="text-sm text-purple-600 font-bold uppercase tracking-wider mb-6 font-mono">{catracaId}</p>

            {statusCatraca === "aguardando" ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-3 border-4 border-purple-600 rounded-2xl shadow-lg flex flex-col items-center w-full">
                  {refeicaoAtual === "fechado" ? (
                    <span className="text-xl font-black text-red-500 py-10">RU FECHADO</span>
                  ) : (
                    <>
                      <QRCode value={urlMobile} size={160} />
                      <span className="text-[10px] font-black text-purple-700 mt-2">CONFIGURAÇÃO DE REDE:</span>
                      <input type="text" value={ipLocal} onChange={(e) => setIpLocal(e.target.value)} className="text-[11px] font-mono text-center border p-1 rounded w-36 text-zinc-800" placeholder="IP do Computador"/>
                    </>
                  )}
                </div>

                {/* SÓ MOSTRA O CUSTO SE O RU ESTIVER ABERTO */}
                {refeicaoAtual !== "fechado" && (
                  <div className="text-xs font-bold text-zinc-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    Custo Turno: <span className="text-purple-700">{refeicaoAtual === "cafe" ? "1 Token" : "2 Tokens"}</span>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-48 h-48 bg-green-500 rounded-full flex flex-col items-center justify-center shadow-xl text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-green-600 tracking-wide">ACESSO LIBERADO</h2>
                
                {hashLiberacao && (
                  <a href={`https://preview.cardanoscan.io/transaction/${hashLiberacao}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-mono font-bold hover:underline bg-blue-50 px-3 py-1 rounded-full border border-blue-200 break-all">
                    Recibo: {hashLiberacao.substring(0, 12)}...
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}