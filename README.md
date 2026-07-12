# Tokenização dos créditos do RU

## Descrição do Projeto

Este projeto propõe uma modernização do sistema de acesso e pagamento do Restaurante Universitário (RU) da Universidade de Brasília (UnB) utilizando a tecnologia blockchain Cardano. O sistema substitui as fichas físicas por ativos digitais (tokens) através de um DApp.

O principal objetivo é automatizar a aplicação das regras de subsídio (Resolução CAD/UnB), eliminar filas e garantir total transparência e imutabilidade nas transações de acesso ao restaurante, integrando a carteira digital do aluno diretamente com a catraca do RU.

## Tecnologias Utilizadas

* **Frontend:** Next.js (React), TypeScript, Tailwind CSS
* **Integração Web3:** Padrão CIP-30 (Lace Wallet)
* **Transações e Minting:** Lucid-Evolution
* **Infraestrutura:** Cardano Testnet (Preview) e Blockfrost API

---

## Como Configurar e Executar Localmente

### Pré-requisitos

* **Node.js** (versão 18+) e gerenciador de pacotes (**Bun** ou NPM)
* Navegador Brave ou Chrome
* Extensão da carteira **Lace** instalada e configurada na rede **Preview**.
* **tADA (Testnet ADA):** Necessário para cobrir as taxas de transação na rede de testes. É possível solicitar fundos gratuitamente no [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Gustavoneri7/projeto-ru.git
   cd projeto-ru