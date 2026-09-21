"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  abrirSessao,
  conferirSenha,
  encerrarSessao,
  DURACAO_TOKEN_REDEFINICAO_MS,
  gerarTokenRedefinicao,
  hashSenha,
  hashTokenRedefinicao,
} from "@/lib/auth";
import { enviarEmailRedefinicaoSenha } from "@/lib/email";

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

export type EstadoEsqueciSenha = { erro?: string; enviado?: boolean };

/** Mensagem sempre igual (sucesso ou nao) para nao revelar quais logins existem. */
const MSG_ESQUECI_SENHA_OK: EstadoEsqueciSenha = { enviado: true };

export async function solicitarRedefinicaoSenha(
  _anterior: EstadoEsqueciSenha,
  formData: FormData
): Promise<EstadoEsqueciSenha> {
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  if (!login) return { erro: "Informe o usuário." };

  try {
    const usuario = await db.usuario.findUnique({ where: { login } });
    if (usuario && usuario.papel === "MESTRE") {
      const { token, hash } = gerarTokenRedefinicao();
      await db.usuario.update({
        where: { id: usuario.id },
        data: {
          resetTokenHash: hash,
          resetTokenExpira: new Date(Date.now() + DURACAO_TOKEN_REDEFINICAO_MS),
        },
      });

      const h = await headers();
      const proto = h.get("x-forwarded-proto") ?? "https";
      const host = h.get("host");
      const link = `${proto}://${host}/login/redefinir-senha?token=${token}`;

      await enviarEmailRedefinicaoSenha(link);
    }
    // conta de jogador ou usuario inexistente: nao faz nada, mas responde igual.
  } catch (e) {
    console.error(e);
    return { erro: "Não foi possível processar o pedido agora. Tente novamente." };
  }

  return MSG_ESQUECI_SENHA_OK;
}

export type EstadoRedefinirSenha = { erro?: string; sucesso?: boolean };

export async function redefinirSenhaComToken(
  _anterior: EstadoRedefinirSenha,
  formData: FormData
): Promise<EstadoRedefinirSenha> {
  const token = String(formData.get("token") ?? "");
  const senha = String(formData.get("senha") ?? "");

  if (!token) return { erro: "Link inválido." };
  if (senha.length < 6) return { erro: "A senha precisa ter ao menos 6 caracteres." };

  try {
    const hash = hashTokenRedefinicao(token);
    const usuario = await db.usuario.findFirst({ where: { resetTokenHash: hash } });
    if (!usuario || !usuario.resetTokenExpira || usuario.resetTokenExpira < new Date()) {
      return { erro: "Link inválido ou expirado. Solicite a redefinição novamente." };
    }

    await db.usuario.update({
      where: { id: usuario.id },
      data: {
        senhaHash: await hashSenha(senha),
        resetTokenHash: null,
        resetTokenExpira: null,
      },
    });
  } catch (e) {
    console.error(e);
    return { erro: "Não foi possível redefinir a senha agora. Tente novamente." };
  }

  return { sucesso: true };
}
