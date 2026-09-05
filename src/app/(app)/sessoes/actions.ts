"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction } from "@/lib/auth";

export type DadosSessao = { titulo: string; data: string; texto: string };

export async function salvarSessao(id: string | null, d: DadosSessao) {
  await exigirMestreAction();

  const data = d.data ? new Date(`${d.data}T12:00:00`) : new Date();
  const dados = {
    titulo: d.titulo.trim() || "Sessão sem título",
    data: Number.isNaN(data.getTime()) ? new Date() : data,
    texto: d.texto,
  };

  const registro = id
    ? await db.anotacaoSessao.update({ where: { id }, data: dados })
    : await db.anotacaoSessao.create({ data: dados });

  revalidatePath("/sessoes");
  return { id: registro.id };
}

export async function excluirSessao(id: string) {
  await exigirMestreAction();
  await db.anotacaoSessao.delete({ where: { id } });
  revalidatePath("/sessoes");
}
