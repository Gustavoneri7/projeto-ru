# Tokenização dos créditos do RU

## Descrição do Projeto

Este projeto propõe uma modernização da infraestrutura de acesso e pagamento do Restaurante Universitário (RU) da Universidade de Brasília (UnB), substituindo o modelo tradicional de banco de dados centralizado por uma arquitetura baseada em **Tokenização (Native Assets)** na blockchain Cardano.

## Tecnologias Utilizadas

* **Frontend:** Next.js (React), TypeScript, Tailwind CSS
* **Integração Web3:** Padrão CIP-30 (Lace Wallet)
* **Transações e Minting:** Lucid-Evolution
* **Infraestrutura:** Cardano Testnet (Preview) e Blockfrost API

---

## Como Configurar e Executar Localmente

### Pré-requisitos

* **Node.js** (versão 18+) e gerenciador de pacotes **Bun**.
* Navegador Brave ou Chrome.
* Extensão da carteira **Lace** instalada e configurada na rede **Preview**.
* **tADA (Testnet ADA):** Necessário para cobrir as taxas de transação na rede de testes. É possível solicitar fundos gratuitamente no [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Gustavoneri7/projeto-ru.git
   cd projeto-ru