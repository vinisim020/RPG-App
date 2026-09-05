import { NextResponse } from "next/server";
import { getSessao } from "@/lib/auth";
import { carregarCombate } from "@/lib/combate";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const combate = await carregarCombate(sessao.papel === "MESTRE");
  return NextResponse.json(
    { combate },
    { headers: { "Cache-Control": "no-store" } }
  );
}
