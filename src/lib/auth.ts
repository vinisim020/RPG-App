import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  assinarSessao,
  COOKIE_SESSAO,
  DURACAO_SESSAO,
  lerToken,
  type Papel,
  type Sessao,
} from "./sessao";

export { COOKIE_SESSAO, lerToken };
export type { Papel, Sessao };

export function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}

export function conferirSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export async function abrirSessao(s: Sessao) {
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, await assinarSessao(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SESSAO,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  jar.delete(COOKIE_SESSAO);
}

export const getSessao = cache(async (): Promise<Sessao | null> => {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  return lerToken(token);
});

export async function exigirSessao(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect("/login");
  return s;
}

export async function exigirMestre(): Promise<Sessao> {
  const s = await exigirSessao();
  if (s.papel !== "MESTRE") redirect("/personagens");
  return s;
}

/** Erro de permissao usado dentro de server actions. */
export class SemPermissao extends Error {
  constructor(msg = "Voce nao tem permissao para esta acao.") {
    super(msg);
  }
}

export async function exigirMestreAction(): Promise<Sessao> {
  const s = await getSessao();
  if (!s || s.papel !== "MESTRE") throw new SemPermissao();
  return s;
}

export async function exigirSessaoAction(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) throw new SemPermissao("Sessao expirada. Faca login novamente.");
  return s;
}
