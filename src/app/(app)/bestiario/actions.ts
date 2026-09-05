"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction } from "@/lib/auth";
import { CATEGORIAS_SER, type CategoriaSer } from "@/lib/constants";

export type DadosCriatura = {
  nome: string;
  nivel: number;
  poder: string;
  dificuldade: string;
  categoria: string;
  parametrosOfensivos: string;
  parametrosDefensivos: string;
  movimentacao: string;
  percepcaoPassiva: string;
  golpeBrutal: string;
  evocacaoMistica: string;
  pvMax: number;
  peMax: number;
  caracteristicas: string;
  anotacoes: string;
};

const inteiro = (v: unknown, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

function normalizar(d: DadosCriatura) {
  const categoria = (CATEGORIAS_SER as readonly string[]).includes(d.categoria)
    ? (d.categoria as CategoriaSer)
    : "COMUNS";

  return {
    nome: d.nome.trim() || "Criatura sem nome",
    nivel: inteiro(d.nivel, 1),
    poder: d.poder.trim(),
    dificuldade: d.dificuldade.trim(),
    categoria,
    parametrosOfensivos: d.parametrosOfensivos.trim(),
    parametrosDefensivos: d.parametrosDefensivos.trim(),
    movimentacao: d.movimentacao.trim(),
    percepcaoPassiva: d.percepcaoPassiva.trim(),
    golpeBrutal: d.golpeBrutal.trim(),
    evocacaoMistica: d.evocacaoMistica.trim(),
    pvMax: inteiro(d.pvMax),
    peMax: inteiro(d.peMax),
    caracteristicas: d.caracteristicas,
    anotacoes: d.anotacoes,
  };
}

export async function salvarCriatura(id: string | null, d: DadosCriatura) {
  await exigirMestreAction();
  const dados = normalizar(d);

  const criatura = id
    ? await db.criatura.update({ where: { id }, data: dados })
    : await db.criatura.create({ data: dados });

  revalidatePath("/bestiario");
  revalidatePath("/iniciativa");
  return { id: criatura.id };
}

export async function excluirCriatura(id: string) {
  await exigirMestreAction();
  await db.criatura.delete({ where: { id } });
  revalidatePath("/bestiario");
}

export async function arquivarCriatura(id: string, arquivada: boolean) {
  await exigirMestreAction();
  await db.criatura.update({ where: { id }, data: { arquivada } });
  revalidatePath("/bestiario");
}

export async function duplicarCriatura(id: string) {
  await exigirMestreAction();
  const base = await db.criatura.findUnique({ where: { id } });
  if (!base) return;
  const { id: _ignorado, criadoEm, atualizadoEm, ...resto } = base;
  await db.criatura.create({ data: { ...resto, nome: `${base.nome} (cópia)` } });
  revalidatePath("/bestiario");
}
