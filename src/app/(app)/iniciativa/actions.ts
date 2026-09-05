"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction, SemPermissao } from "@/lib/auth";

async function tocar(combateId: string) {
  await db.combateAtivo.update({
    where: { id: combateId },
    data: { atualizadoEm: new Date() },
  });
  revalidatePath("/iniciativa");
}

async function combateAtual() {
  const c = await db.combateAtivo.findFirst({ orderBy: { atualizadoEm: "desc" } });
  if (!c) throw new SemPermissao("Nenhum combate em andamento.");
  return c;
}

async function proximaOrdem(combateId: string) {
  const ultimo = await db.combatente.findFirst({
    where: { combateId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  return (ultimo?.ordem ?? -1) + 1;
}

export async function iniciarCombate(nome?: string) {
  await exigirMestreAction();
  const existente = await db.combateAtivo.findFirst();
  if (existente) return { id: existente.id };
  const criado = await db.combateAtivo.create({
    data: { nome: nome?.trim() || "Combate" },
  });
  revalidatePath("/iniciativa");
  return { id: criado.id };
}

export async function encerrarCombate() {
  await exigirMestreAction();
  await db.combateAtivo.deleteMany({});
  revalidatePath("/iniciativa");
}

export async function adicionarPersonagens(ids: string[]) {
  await exigirMestreAction();
  const combate = await combateAtual();
  let ordem = await proximaOrdem(combate.id);

  const personagens = await db.personagem.findMany({
    where: { id: { in: ids } },
    select: { id: true, nome: true },
  });

  await db.combatente.createMany({
    data: personagens.map((p) => ({
      combateId: combate.id,
      tipo: "PERSONAGEM" as const,
      personagemId: p.id,
      nomeExibicao: p.nome,
      ordem: ordem++,
    })),
  });

  await tocar(combate.id);
}

export async function adicionarCriatura(criaturaId: string, quantidade = 1) {
  await exigirMestreAction();
  const combate = await combateAtual();
  const criatura = await db.criatura.findUnique({ where: { id: criaturaId } });
  if (!criatura) throw new SemPermissao("Criatura não encontrada.");

  const jaExistem = await db.combatente.count({
    where: { combateId: combate.id, criaturaId },
  });

  let ordem = await proximaOrdem(combate.id);
  const total = Math.max(1, Math.min(20, quantidade));

  await db.combatente.createMany({
    data: Array.from({ length: total }, (_, k) => ({
      combateId: combate.id,
      tipo: "CRIATURA" as const,
      criaturaId,
      nomeExibicao:
        jaExistem + total > 1 ? `${criatura.nome} ${jaExistem + k + 1}` : criatura.nome,
      pvAtual: criatura.pvMax,
      pvMax: criatura.pvMax,
      peAtual: criatura.peMax,
      peMax: criatura.peMax,
      ordem: ordem++,
    })),
  });

  await tocar(combate.id);
}

export async function adicionarAvulso(nome: string, pvMax = 0, peMax = 0) {
  await exigirMestreAction();
  const combate = await combateAtual();
  await db.combatente.create({
    data: {
      combateId: combate.id,
      tipo: "AVULSO",
      nomeExibicao: nome.trim() || "NPC",
      pvAtual: pvMax,
      pvMax,
      peAtual: peMax,
      peMax,
      ordem: await proximaOrdem(combate.id),
    },
  });
  await tocar(combate.id);
}

export async function removerCombatente(id: string) {
  await exigirMestreAction();
  const c = await db.combatente.findUnique({ where: { id }, select: { combateId: true } });
  if (!c) return;
  await db.combatente.delete({ where: { id } });

  const restantes = await db.combatente.count({ where: { combateId: c.combateId } });
  const combate = await db.combateAtivo.findUnique({ where: { id: c.combateId } });
  if (combate && combate.turnoAtualIndex >= restantes) {
    await db.combateAtivo.update({
      where: { id: c.combateId },
      data: { turnoAtualIndex: 0 },
    });
  }
  await tocar(c.combateId);
}

export type PatchCombatente = {
  nomeExibicao?: string;
  valorIniciativa?: number;
  anotacao?: string;
  pvAtual?: number;
  pvTemp?: number;
  pvMax?: number;
  peAtual?: number;
  peTemp?: number;
  peMax?: number;
};

export async function atualizarCombatente(id: string, patch: PatchCombatente) {
  await exigirMestreAction();
  const c = await db.combatente.findUnique({
    where: { id },
    select: { combateId: true, tipo: true, personagemId: true },
  });
  if (!c) return;

  const recursos = {
    ...(patch.pvAtual !== undefined ? { pvAtual: patch.pvAtual } : {}),
    ...(patch.pvTemp !== undefined ? { pvTemp: patch.pvTemp } : {}),
    ...(patch.pvMax !== undefined ? { pvMax: patch.pvMax } : {}),
    ...(patch.peAtual !== undefined ? { peAtual: patch.peAtual } : {}),
    ...(patch.peTemp !== undefined ? { peTemp: patch.peTemp } : {}),
    ...(patch.peMax !== undefined ? { peMax: patch.peMax } : {}),
  };

  const proprios = {
    ...(patch.nomeExibicao !== undefined ? { nomeExibicao: patch.nomeExibicao } : {}),
    ...(patch.valorIniciativa !== undefined
      ? { valorIniciativa: patch.valorIniciativa }
      : {}),
    ...(patch.anotacao !== undefined ? { anotacao: patch.anotacao } : {}),
  };

  // PV/PE de personagens vivem na ficha; os demais ficam no combatente.
  if (c.tipo === "PERSONAGEM" && c.personagemId && Object.keys(recursos).length > 0) {
    await db.personagem.update({ where: { id: c.personagemId }, data: recursos });
    revalidatePath(`/personagens/${c.personagemId}`);
    revalidatePath("/personagens");
    if (Object.keys(proprios).length > 0) {
      await db.combatente.update({ where: { id }, data: proprios });
    }
  } else {
    await db.combatente.update({ where: { id }, data: { ...proprios, ...recursos } });
  }

  await tocar(c.combateId);
}

export async function reordenar(ids: string[]) {
  await exigirMestreAction();
  const combate = await combateAtual();
  await db.$transaction(
    ids.map((id, i) =>
      db.combatente.update({ where: { id }, data: { ordem: i } })
    )
  );
  await tocar(combate.id);
}

export async function ordenarPorIniciativa() {
  await exigirMestreAction();
  const combate = await combateAtual();
  const lista = await db.combatente.findMany({
    where: { combateId: combate.id },
    orderBy: [{ valorIniciativa: "desc" }, { nomeExibicao: "asc" }],
    select: { id: true },
  });
  await db.$transaction(
    lista.map((c, i) => db.combatente.update({ where: { id: c.id }, data: { ordem: i } }))
  );
  await db.combateAtivo.update({
    where: { id: combate.id },
    data: { turnoAtualIndex: 0, atualizadoEm: new Date() },
  });
  revalidatePath("/iniciativa");
}

export async function definirTurno(index: number) {
  await exigirMestreAction();
  const combate = await combateAtual();
  const total = await db.combatente.count({ where: { combateId: combate.id } });
  if (total === 0) return;
  await db.combateAtivo.update({
    where: { id: combate.id },
    data: {
      turnoAtualIndex: Math.max(0, Math.min(total - 1, index)),
      atualizadoEm: new Date(),
    },
  });
  revalidatePath("/iniciativa");
}

export async function avancarTurno(passo: 1 | -1 = 1) {
  await exigirMestreAction();
  const combate = await combateAtual();
  const total = await db.combatente.count({ where: { combateId: combate.id } });
  if (total === 0) return;

  let indice = combate.turnoAtualIndex + passo;
  let rodada = combate.rodadaAtual;

  if (indice >= total) {
    indice = 0;
    rodada += 1;
  } else if (indice < 0) {
    indice = total - 1;
    rodada = Math.max(1, rodada - 1);
  }

  await db.combateAtivo.update({
    where: { id: combate.id },
    data: { turnoAtualIndex: indice, rodadaAtual: rodada, atualizadoEm: new Date() },
  });
  revalidatePath("/iniciativa");
}

export async function reiniciarRodadas() {
  await exigirMestreAction();
  const combate = await combateAtual();
  await db.combateAtivo.update({
    where: { id: combate.id },
    data: { rodadaAtual: 1, turnoAtualIndex: 0, atualizadoEm: new Date() },
  });
  revalidatePath("/iniciativa");
}
