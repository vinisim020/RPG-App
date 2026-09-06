# Gaia: O Prelúdio — ferramenta de mesa

Ferramenta web privada da mesa: fichas de personagem, bestiário, iniciativa de combate,
recompensas e anotações de sessão. **Não rola dados** — os dados continuam sendo rolados na
mesa e os resultados anotados aqui.

- **Stack:** Next.js 15 (App Router) + TypeScript, Prisma + PostgreSQL, Tailwind CSS 4.
- **Login:** usuário/senha, contas criadas pelo mestre (sem cadastro público).
- **Escopo:** uma campanha; cada jogador pode ter vários personagens.

---

## 1. Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito basta).
2. Em **Project Settings → Database → Connection string → ORMs / Prisma**, copie as duas URLs.
3. Copie `.env.example` para `.env` e preencha:

   ```
   DATABASE_URL="...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="...pooler.supabase.com:5432/postgres"
   AUTH_SECRET="<gere um valor aleatório>"
   MESTRE_LOGIN="mestre"
   MESTRE_SENHA="<sua senha>"
   MESTRE_NOME="Seu nome"
   ```

   Gere o `AUTH_SECRET` com:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. Crie as tabelas e a conta do mestre:

   ```bash
   npm install
   npm run db:push
   npm run seed
   ```

> **Atenção:** projetos gratuitos do Supabase são pausados após ~1 semana sem uso; basta
> reativar pelo painel (leva menos de um minuto). Se isso incomodar entre sessões, o Neon tem
> um plano gratuito que religa sozinho na primeira conexão — a troca é só mudar as URLs no `.env`.

## 2. Rodar localmente

```bash
npm run dev
```

Abra <http://localhost:3000> e entre com a conta do mestre.

## 3. Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel, **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, cadastre `DATABASE_URL`, `DIRECT_URL` e `AUTH_SECRET`
   (os mesmos valores do `.env`; as variáveis `MESTRE_*` são usadas só pelo seed local).
4. Deploy. O `build` já roda `prisma generate`.

Sempre que o `prisma/schema.prisma` mudar, rode `npm run db:push` localmente para aplicar no
banco (a Vercel não altera o schema sozinha).

## 4. Contas da mesa

Pelo app: **Usuários** (só o mestre vê) — criar conta, trocar senha, promover a mestre, excluir.

Pela linha de comando:

```bash
npm run usuario -- --listar
npm run usuario -- --login joao --nome "João" --senha segredo123
npm run usuario -- --login joao --senha nova-senha
npm run usuario -- --login joao --papel MESTRE
npm run usuario -- --login joao --remover
```

## 5. O que cada tela faz

| Tela | Quem vê | O que faz |
|---|---|---|
| **Personagens** | todos | Jogador vê os próprios; mestre vê todos agrupados por jogador. |
| **Ficha** | dono + mestre | Ficha completa e editável: recursos, 8 parâmetros, 14 conhecimentos (com maestria), equipamentos, habilidades de legado, habilidades de Caminho de Combate, inventário e anotações. Salva com o botão no rodapé ou `Ctrl+S`. |
| **Iniciativa** | mestre edita, jogador lê | Ordem da rodada, turno atual, PV/PE (com temporário) ao vivo. Um clique carrega um grupo de combate pronto. Atualiza sozinha a cada 4s. |
| **Criaturas** | mestre | Bestiário reutilizável, com busca, filtro por categoria do Livro dos Seres, duplicar, arquivar e ações/habilidades organizadas em cards (mesmo padrão da ficha de personagem). |
| **Recompensas** | mestre | Monta prêmios pendentes; ao entregar, o item vai direto para o inventário do personagem. |
| **Anotações de Sessão** | mestre | Preparação de sessão organizada em blocos de texto (em vez de um campo único), com grupos de combate pré-montados a partir do bestiário — cada grupo vai para a Iniciativa com um clique. |
| **Usuários** | mestre | Gestão das contas. |

## 6. Decisões de implementação

- **PV/PE de personagens na tela de Iniciativa gravam direto na ficha**, então ficha e combate
  nunca divergem. Criaturas e NPCs avulsos têm PV/PE próprios, instanciados a partir do
  bestiário — editar a instância não altera o template.
- **Jogadores veem a iniciativa em modo leitura**, mas só enxergam PV/PE de personagens de
  jogador; os das criaturas ficam ocultos para não estragar a surpresa.
- **Sincronização por polling** (4 segundos), não WebSocket — mais simples e suficiente para
  uma mesa de 6 a 8 pessoas.
- **Sem rolagem de dados**, por decisão de escopo.
- **Retrato do personagem é uma URL** (sem upload de arquivo nesta versão).
- A autenticação é um cookie de sessão assinado (JWT + `bcrypt`), sem NextAuth: menos
  dependências para manter num projeto deste porte.

## 7. Estrutura

```
prisma/schema.prisma      modelo de dados
prisma/seed.ts            cria a conta do mestre
scripts/usuario.ts        CLI de contas
src/lib/                  db, autenticação, constantes da ficha, estado de combate
src/components/           componentes visuais compartilhados
src/app/login/            tela de login
src/app/(app)/            telas autenticadas
src/app/api/iniciativa/   endpoint de polling do combate
```
