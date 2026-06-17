# 🏆 Álbum de Figurinhas da Copa - Digital & Interativo

Um aplicativo móvel e web (Cross-platform) projetado para digitalizar a experiência de colecionar e trocar figurinhas da Copa. Este projeto vai além de um simples rastreador visual: ele atua como um verdadeiro **"Tinder de Figurinhas"**, conectando colecionadores próximos geograficamente por meio de algoritmos de match que identificam interesses de troca mútuos.

## 🚀 Funcionalidades Principais

- **📊 Tracking Visual:** Acompanhe o progresso do seu álbum, visualizando quais figurinhas faltam e quais você tem repetidas em uma interface amigável.
- **🌍 Geolocalização e Mapa de Trocas:** Descubra colecionadores próximos a você usando integração geoespacial (PostGIS).
- **🤝 Match de Trocas Inteligente:** Algoritmo SQL no backend que cruza o seu inventário com o de outras pessoas, retornando os "pares perfeitos" para troca (ex: eu tenho a figurinha que você quer, e você tem a que eu quero).
- **📈 Raridade Dinâmica:** O sistema calcula a raridade de cada figurinha em tempo real (Comum, Rara, Lendária) com base na escassez global do banco de dados, não em dados fixos.
- **💬 Chat Integrado:** Converse diretamente com seus matches para marcar o local da troca.

## 🛠️ Tecnologias e Arquitetura

O projeto adota uma arquitetura moderna serverless e cross-platform, otimizada para velocidade de desenvolvimento e robustez analítica:

### Frontend (Mobile & Web)
- **Framework:** [Expo](https://expo.dev/) & React Native. Permite a geração do app para Android, iOS e exportação para Web (PWA) utilizando o mesmo código base.
- **Navegação:** Expo Router para navegação baseada em arquivos (file-based routing).
- **Deploy Web:** Hospedado na [Vercel](https://vercel.com/).

### Backend & Banco de Dados (BaaS)
- **Infraestrutura:** [Supabase](https://supabase.com/).
- **Banco de Dados:** PostgreSQL relacional para integridade dos dados transacionais.
- **Geoespacial:** Extensão **PostGIS** para consultas de proximidade (raio de distância entre os usuários).
- **Lógica de Negócios:** RPCs (Remote Procedure Calls) em PL/pgSQL encapsulando a inteligência de matches e cálculos complexos diretamente no banco de dados para máxima performance.

## ⚙️ Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js instalado.
- Conta no Supabase (ou CLI do Supabase para rodar localmente).

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/SEU_USUARIO/AlbumFigurinhasCopa.git
   cd AlbumFigurinhasCopa
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto com suas chaves do Supabase:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
   ```

4. **Popule o Banco de Dados (Mock Data)**
   O projeto conta com um script de geração de dados fictícios para você testar a inteligência de matches e raridade:
   ```bash
   npm run seed:mock
   ```

5. **Inicie o projeto**
   ```bash
   # Para rodar a versão Web (ideal para o painel de visualização)
   npm run web

   # Para rodar no simulador iOS / Android
   npm run start
   ```

## 🌐 Deploy (Vercel)

A versão web deste projeto está configurada para deploy contínuo na Vercel.
- Faça o login na Vercel e importe o repositório.
- Adicione as variáveis de ambiente `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` no painel da Vercel.
- Comando de Build: `npx expo export -p web` (ou configure no Vercel usando o preset Expo).
- Output Directory: `dist`

## 🤖 Metodologia e Uso de IA (Declaração Acadêmica)

Este projeto foi desenvolvido utilizando a Inteligência Artificial **Gemini (Google DeepMind)** como ferramenta de Pair Programming e Arquitetura de Software. A IA auxiliou ativamente na modelagem do banco de dados relacional (incluindo queries avançadas de PostGIS e views dinâmicas), estruturação do código frontend com React Native e na formulação de scripts de geração de dados mockados para testes analíticos de estresse.

**Citação (Padrão ABNT):**
> GOOGLE. *Gemini*. Versão 3.1 Pro. Modelo de Linguagem de Larga Escala (LLM). Mountain View: Google DeepMind, 2026. Disponível em: <https://gemini.google.com/>. Acesso em: 17 jun. 2026.

## 📄 Licença

Distribuído sob a licença MIT.
