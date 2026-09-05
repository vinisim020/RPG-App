"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction, hashSenha } from "@/lib/auth";

export type Resultado = { erro?: string };

export async function criarUsuario(dados: {
  nome: string;
  login: string;
  senha: string;
  papel: "MESTRE" | "JOGADOR";
}): Promise<Resultado> {
  await exigirMestreAction();

  const login = dados.login.trim().toLowerCase();
  const nome = dados.nome.trim() || login;
  if (!login) return { erro: "Informe o usuário de acesso." };
  if (/\s/.test(login)) return { erro: "O usuário de acesso não pode ter espaços." };
  if (dados.senha.length < 6) return { erro: "A senha precisa ter ao menos 6 caracteres." };

  const jaExiste = await db.usuario.findUnique({ where: { login } });
  if (jaExiste) return { erro: "Já existe uma conta com esse usuário." };

  await db.usuario.create({
    data: {
      nome,
      login,
      senhaHash: await hashSenha(dados.senha),
      papel: dados.papel === "MESTRE" ? "MESTRE" : "JOGADOR",
    },
  });

  revalidatePath("/usuarios");
  return {};
}

export async function redefinirSenha(id: string, senha: string): Promise<Resultado> {
  await exigirMestreAction();
  if (senha.length < 6) return { erro: "A senha precisa ter ao menos 6 caracteres." };
  await db.usuario.update({ where: { id }, data: { senhaHash: await hashSenha(senha) } });
  revalidatePath("/usuarios");
  return {};
}

export async function alterarUsuario(
  id: string,
  dados: { nome?: string; papel?: "MESTRE" | "JOGADOR" }
): Promise<Resultado> {
  const sessao = await exigirMestreAction();

  if (dados.papel === "JOGADOR") {
    const mestres = await db.usuario.count({ where: { papel: "MESTRE" } });
    if (mestres <= 1) return { erro: "A mesa precisa de pelo menos um mestre." };
    if (id === sessao.id) return { erro: "Você não pode rebaixar a própria conta." };
  }

  await db.usuario.update({
    where: { id },
    data: {
      ...(dados.nome !== undefined ? { nome: dados.nome.trim() } : {}),
      ...(dados.papel !== undefined ? { papel: dados.papel } : {}),
    },
  });

  revalidatePath("/usuarios");
  return {};
}

export async function excluirUsuario(id: string): Promise<Resultado> {
  const sessao = await exigirMestreAction();
  if (id === sessao.id) return { erro: "Você não pode excluir a própria conta." };
  await db.usuario.delete({ where: { id } });
  revalidatePath("/usuarios");
  revalidatePath("/personagens");
  return {};
}
