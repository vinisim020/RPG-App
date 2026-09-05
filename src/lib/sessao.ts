/**
 * Parte da autenticacao que roda tanto no Node quanto no Edge (middleware).
 * Nada de bcrypt ou next/headers aqui.
 */
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESSAO = "gaia_sessao";
export const DURACAO_SESSAO = 60 * 60 * 24 * 30; // 30 dias

export type Papel = "MESTRE" | "JOGADOR";
export type Sessao = { id: string; nome: string; login: string; papel: Papel };

function chave() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET nao definido — veja .env.example");
  return new TextEncoder().encode(s);
}

export async function assinarSessao(s: Sessao) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO}s`)
    .sign(chave());
}

export async function lerToken(token: string): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, chave());
    if (!payload.id || !payload.papel) return null;
    return {
      id: String(payload.id),
      nome: String(payload.nome ?? ""),
      login: String(payload.login ?? ""),
      papel: payload.papel === "MESTRE" ? "MESTRE" : "JOGADOR",
    };
  } catch {
    return null;
  }
}
