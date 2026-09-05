/**
 * Cria a conta do mestre a partir das variaveis MESTRE_LOGIN / MESTRE_SENHA.
 * Rode uma vez apos configurar o banco:  npm run seed
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

async function main() {
  const login = (process.env.MESTRE_LOGIN ?? "mestre").trim().toLowerCase();
  const senha = process.env.MESTRE_SENHA;
  const nome = process.env.MESTRE_NOME ?? "Mestre";

  if (!senha) {
    throw new Error("Defina MESTRE_SENHA no .env antes de rodar o seed.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await db.usuario.upsert({
    where: { login },
    update: { nome, papel: "MESTRE" },
    create: { login, nome, senhaHash, papel: "MESTRE" },
  });

  console.log(`Conta de mestre pronta: ${usuario.login} (${usuario.nome})`);
  console.log("Se a conta ja existia, a senha NAO foi alterada. Use: npm run usuario -- --senha ...");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
