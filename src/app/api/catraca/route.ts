import { NextResponse } from "next/server";

// Bypass no TypeScript para usar a memória global sem alertas vermelhos
const globalAny: any = global;

if (!globalAny.memoriaCatraca) {
  globalAny.memoriaCatraca = {};
}

// Função auxiliar que checa o dia, a hora e devolve o preço e o turno
function obterRegraHorario() {
  const agora = new Date();
  // Força o fuso horário de Brasília (BRT)
  const horaAtual = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  
  const diaSemana = horaAtual.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const hora = horaAtual.getHours();
  const minuto = horaAtual.getMinutes();
  const tempoDecimal = hora + (minuto / 60); // Ex: 9h30 vira 9.5

  const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

  if (!isFimDeSemana) {
    // Regras de Segunda a Sexta
    if (tempoDecimal >= 7.0 && tempoDecimal <= 9.5) return { turno: "Café da manhã", preco: 1 };
    if (tempoDecimal >= 11.0 && tempoDecimal <= 14.5) return { turno: "Almoço", preco: 2 };
    if (tempoDecimal >= 17.0 && tempoDecimal <= 19.5) return { turno: "Jantar", preco: 2 };
  } else {
    // Regras de Finais de Semana (e base para feriados)
    if (tempoDecimal >= 7.0 && tempoDecimal <= 8.5) return { turno: "Café da manhã", preco: 1 };
    if (tempoDecimal >= 12.0 && tempoDecimal <= 13.5) return { turno: "Almoço", preco: 2 };
    if (tempoDecimal >= 17.0 && tempoDecimal <= 18.0) return { turno: "Jantar", preco: 2 };
  }

  // Se não caiu em nenhum if acima, o RU está fechado
  return null; 
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 });
  
  const dados = globalAny.memoriaCatraca[id] || { status: "aguardando", txHash: "" };
  return NextResponse.json(dados);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Agora esperamos receber os tokens que o aluno tentou pagar no frontend
    const { id, txHash, tokensPagos } = body;
    
    if (!id || !txHash) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    // 1. Verifica se o RU está aberto
    const regra = obterRegraHorario();
    if (!regra) {
      return NextResponse.json({ 
        error: "Catraca bloqueada: Fora do horário de funcionamento do RU." 
      }, { status: 403 });
    }

    // 2. Verifica se o aluno pagou o valor correto para a refeição atual
    if (tokensPagos && tokensPagos !== regra.preco) {
      return NextResponse.json({ 
        error: `Valor incorreto! O ${regra.turno} custa ${regra.preco} token(s). Você enviou ${tokensPagos}.` 
      }, { status: 400 });
    }
    
    // 3. Tudo certo, libera a catraca
    globalAny.memoriaCatraca[id] = {
      status: "pago",
      txHash,
      refeicao: regra.turno,
      valorCobrado: regra.preco,
      timestamp: Date.now()
    };
    
    return NextResponse.json({ success: true, refeicao: regra.turno, valorCobrado: regra.preco });
  } catch (e) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (id && globalAny.memoriaCatraca[id]) {
    delete globalAny.memoriaCatraca[id];
  }
  return NextResponse.json({ success: true });
}