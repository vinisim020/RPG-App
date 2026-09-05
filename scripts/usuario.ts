/**
 * Gerencia contas pela linha de comando.
 *
 *   npm run usuario -- --listar
 *   npm run usuario -- --login joao --nome "Joao" --senha segredo123 [--papel JOGADOR|MESTRE]
 *   npm run usuario -- --login joao --senha nova-senha        (troca a senha)
 *   npm run usuario -- --login joao --remover
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Mesma precedencia do Next: o que .env.local define prevalece sobre .env
// (process.loadEnvFile nao sobrescreve variaveis ja carregadas).
for (const arquivo of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(arquivo);
  } catch {
    /* arquivo ausente e aceitavel */
  }
}

const db = new PrismaClient();

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function flag(nome: string) {
  return process.argv.includes(`--${nome}`);
}

async function main() {
  if (flag("listar")) {
    const todos = await db.usuario.findMany({
      orderBy: [{ papel: "asc" }, { nome: "asc" }],
      include: { _count: { select: { personagens: true } } },
    });
    for (const u of todos) {
      console.log(
        `${u.papel.padEnd(8)} ${u.login.padEnd(20)} ${u.nome}  (${u._count.personagens} personagem/ns)`
      );
    }
    return;
  }

  const login = arg("login")?.trim().toLowerCase();
  if (!login) throw new Error("Use --login <usuario> (ou --listar).");

  if (flag("remover")) {
    await db.usuario.delete({ where: { login } });
    console.log(`Conta ${login} removida (junto com os personagens dela).`);
    return;
  }

  const senha = arg("senha");
  const nome = arg("nome");
  const papel = arg("papel")?.toUpperCase() === "MESTRE" ? "MESTRE" : "JOGADOR";
  const existente = await db.usuario.findUnique({ where: { login } });

  if (!existente) {
    if (!senha) throw new Error("Conta nova exige --senha.");
    const u = await db.usuario.create({
      data: { login, nome: nome ?? login, senhaHash: await bcrypt.hash(senha, 10), papel },
    });
    console.log(`Criada: ${u.login} (${u.papel}).`);
    return;
  }

  const u = await db.usuario.update({
    where: { login },
    data: {
      ...(nome ? { nome } : {}),
      ...(arg("papel") ? { papel } : {}),
      ...(senha ? { senhaHash: await bcrypt.hash(senha, 10) } : {}),
    },
  });
  console.log(`Atualizada: ${u.login} (${u.papel}).`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
