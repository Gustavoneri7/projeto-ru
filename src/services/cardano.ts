import { Lucid, Blockfrost } from "@lucid-evolution/lucid";

// Não se esqueça de manter a sua chave real aqui
const BLOCKFROST_PROJECT_ID = "previewOaQxkyPOHTkl4GmpnGGARojKTsdiWCEr"; 

export async function inicializarCarteiraLace() {
  try {
    const provider = new Blockfrost(
      "https://cardano-preview.blockfrost.io/api/v0",
      BLOCKFROST_PROJECT_ID
    );
    const lucid = await Lucid(provider, "Preview");

    if (window.cardano && window.cardano.lace) {
      const api = await window.cardano.lace.enable();
      lucid.selectWallet.fromAPI(api);
      
      const endereco = await lucid.wallet().address();
      return { lucid, endereco };
    } else {
      alert("Extensão Lace não encontrada no navegador.");
      return null;
    }
  } catch (erro) {
    console.error("Erro na Lace nativa:", erro);
    return null;
  }
}