"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { abrirSessao, conferirSenha, encerrarSessao } from "@/lib/auth";

export type EstadoLogin = { erro?: string };

export async function entrar(_anterior: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const de = String(formData.get("de") ?? "");

  if (!login) return { erro: "Informe o usuário." };

  let destino = "/personagens";
  try {
    const usuario = await db.usuario.findUnique({ where: { login } });
    if (!usuario) return { erro: "Usuário ou senha inválidos." };
    if (usuario.papel === "MESTRE") {
      if (!senha || !(await conferirSenha(senha, usuario.senhaHash))) {
        return { erro: "Usuário ou senha inválidos." };
      }
    }
    // contas de jogador entram so com o usuario, sem verificar senha.
    await abrirSessao({
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      papel: usuario.papel,
    });
    if (de.startsWith("/") && !de.startsWith("//")) destino = de;
  } catch (e) {
    console.error(e);
    return { erro: "Não foi possível conectar ao banco de dados." };
  }

  redirect(destino);
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
