"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction } from "@/lib/auth";

export type Resultado = { erro?: string };

export type DadosRecompensa = {
  nome: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  peso: string;
  personagemDestinoId: string | null;
};

const inteiro = (v: unknown, padrao = 1) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

export async function salvarRecompensa(id: string | null, d: DadosRecompensa) {
  await exigirMestreAction();

  const dados = {
    nome: d.nome.trim() || "Recompensa",
    descricao: d.descricao,
    categoria: d.categoria.trim(),
    quantidade: Math.max(1, inteiro(d.quantidade)),
    peso: d.peso.trim(),
    personagemDestinoId: d.personagemDestinoId || null,
  };

  if (id) await db.recompensa.update({ where: { id }, data: dados });
  else await db.recompensa.create({ data: dados });

  revalidatePath("/recompensas");
}

export async function excluirRecompensa(id: string) {
  await exigirMestreAction();
  await db.recompensa.delete({ where: { id } });
  revalidatePath("/recompensas");
}

/** Marca como entregue e copia o item para o inventario do personagem. */
export async function entregarRecompensa(
  id: string,
  personagemId?: string
): Promise<Resultado> {
  await exigirMestreAction();

  const r = await db.recompensa.findUnique({ where: { id } });
  if (!r) return { erro: "Recompensa não encontrada." };
  if (r.status === "ENTREGUE") return {};

  const destino = personagemId || r.personagemDestinoId;
  if (!destino) return { erro: "Escolha o personagem de destino antes de entregar." };

  const ultimo = await db.itemInventario.findFirst({
    where: { personagemId: destino },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });

  await db.$transaction([
    db.itemInventario.create({
      data: {
        personagemId: destino,
        nome: r.nome,
        quantidade: r.quantidade,
        peso: r.peso,
        categoria: r.categoria,
        descricao: r.descricao,
        ordem: (ultimo?.ordem ?? -1) + 1,
      },
    }),
    db.recompensa.update({
      where: { id },
      data: {
        status: "ENTREGUE",
        entregueEm: new Date(),
        personagemDestinoId: destino,
      },
    }),
  ]);

  revalidatePath("/recompensas");
  revalidatePath(`/personagens/${destino}`);
  return {};
}

export async function reverterEntrega(id: string) {
  await exigirMestreAction();
  await db.recompensa.update({
    where: { id },
    data: { status: "PENDENTE", entregueEm: null },
  });
  revalidatePath("/recompensas");
}
