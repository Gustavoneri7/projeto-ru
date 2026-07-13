# Tokenização dos créditos do RU

## Descrição do Projeto

Este projeto propõe uma modernização da infraestrutura de acesso e pagamento do Restaurante Universitário (RU) da Universidade de Brasília (UnB), substituindo o modelo tradicional de banco de dados centralizado por uma arquitetura baseada em **Tokenização (Native Assets)** na blockchain Cardano.

O principal objetivo do projeto é demonstrar como a tokenização resolve vulnerabilidades críticas de sistemas convencionais, como:

* **Vulnerabilidade de Credenciais Estáticas:** Substituição de QR Codes estáticos por assinaturas criptográficas únicas na carteira do aluno.
* **Segurança e Imutabilidade:** Eliminação do risco de adulteração de saldos em bancos de dados centralizados.
* **Posse Real (Autocustódia):** O crédito (ficha) deixa de ser um número no servidor da universidade e passa a ser um ativo digital sob posse real do estudante.

Ao transformar o direito a uma refeição em um token rastreável e inviolável, o DApp garante auditoria transparente e altíssima segurança. Tudo isso é feito mantendo a aplicação automatizada das regras de subsídio (Resolução CAD/UnB) através de uma arquitetura de identidade híbrida (Web 2.5).

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
   ```

2. **Instale as dependências:**
   ```bash
   bun install
   ```

3. **Configure as variáveis de ambiente:** Crie um arquivo chamado `.env.local` na raiz do projeto e adicione a sua chave da Blockfrost:
   ```env
   NEXT_PUBLIC_BLOCKFROST_API_KEY=sua_chave_preview_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   bun run dev
   ```

5. **Acesse a aplicação:** Abra o navegador e acesse `http://localhost:3000`.