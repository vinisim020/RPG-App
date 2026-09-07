"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction } from "@/lib/auth";

const t = (v: unknown) => String(v ?? "").trim();

// ---------------------------------------------------------- HabilidadeCatalogo

export type DadosHabilidadeCatalogo = {
  caminho: string;
  especializacao: string;
  nome: string;
  custoPe: string;
  tipoAcao: string;
  conjuracao: boolean;
  efeitoResumo: string;
  aprimoramentoA: string;
  aprimoramentoB: string;
};

export async function salvarHabilidadeCatalogo(id: string | null, d: DadosHabilidadeCatalogo) {
  await exigirMestreAction();
  const dados = {
    caminho: t(d.caminho),
    especializacao: t(d.especializacao) || "(base)",
    nome: t(d.nome) || "Habilidade sem nome",
    custoPe: t(d.custoPe),
    tipoAcao: t(d.tipoAcao),
    conjuracao: Boolean(d.conjuracao),
    efeitoResumo: d.efeitoResumo,
    aprimoramentoA: d.aprimoramentoA,
    aprimoramentoB: d.aprimoramentoB,
  };
  const r = id
    ? await db.habilidadeCatalogo.update({ where: { id }, data: dados })
    : await db.habilidadeCatalogo.create({ data: dados });
  revalidatePath("/catalogos");
  return { id: r.id };
}

export async function arquivarHabilidadeCatalogo(id: string, arquivada: boolean) {
  await exigirMestreAction();
  await db.habilidadeCatalogo.update({ where: { id }, data: { arquivada } });
  revalidatePath("/catalogos");
}

export async function excluirHabilidadeCatalogo(id: string) {
  await exigirMestreAction();
  await db.habilidadeCatalogo.delete({ where: { id } });
  revalidatePath("/catalogos");
}

// ---------------------------------------------------------- EquipamentoCatalogo

export type DadosEquipamentoCatalogo = {
  categoria: string;
  subcategoria: string;
  nome: string;
  precoMp: string;
  unidade: string;
  danoOuBloqueio: string;
  parametroOuRequisito: string;
  alcance: string;
  propriedadeOuNotas: string;
};

export async function salvarEquipamentoCatalogo(id: string | null, d: DadosEquipamentoCatalogo) {
  await exigirMestreAction();
  const dados = {
    categoria: t(d.categoria) || "Item Mundano",
    subcategoria: t(d.subcategoria),
    nome: t(d.nome) || "Item sem nome",
    precoMp: t(d.precoMp),
    unidade: t(d.unidade),
    danoOuBloqueio: t(d.danoOuBloqueio),
    parametroOuRequisito: t(d.parametroOuRequisito),
    alcance: t(d.alcance),
    propriedadeOuNotas: d.propriedadeOuNotas,
  };
  const r = id
    ? await db.equipamentoCatalogo.update({ where: { id }, data: dados })
    : await db.equipamentoCatalogo.create({ data: dados });
  revalidatePath("/catalogos");
  return { id: r.id };
}

export async function arquivarEquipamentoCatalogo(id: string, arquivado: boolean) {
  await exigirMestreAction();
  await db.equipamentoCatalogo.update({ where: { id }, data: { arquivado } });
  revalidatePath("/catalogos");
}

export async function excluirEquipamentoCatalogo(id: string) {
  await exigirMestreAction();
  await db.equipamentoCatalogo.delete({ where: { id } });
  revalidatePath("/catalogos");
}

// -------------------------------------------------- CaracteristicaCriaturaCatalogo

export type DadosCaracteristicaCatalogo = {
  livro: string;
  dificuldade: string;
  nome: string;
  custoPe: string;
  tipoAcao: string;
  efeitoResumo: string;
};

export async function salvarCaracteristicaCatalogo(
  id: string | null,
  d: DadosCaracteristicaCatalogo
) {
  await exigirMestreAction();
  const dados = {
    livro: t(d.livro) || "Comuns",
    dificuldade: t(d.dificuldade) || "Fácil",
    nome: t(d.nome) || "Característica sem nome",
    custoPe: t(d.custoPe),
    tipoAcao: t(d.tipoAcao),
    efeitoResumo: d.efeitoResumo,
  };
  const r = id
    ? await db.caracteristicaCriaturaCatalogo.update({ where: { id }, data: dados })
    : await db.caracteristicaCriaturaCatalogo.create({ data: dados });
  revalidatePath("/catalogos");
  return { id: r.id };
}

export async function arquivarCaracteristicaCatalogo(id: string, arquivada: boolean) {
  await exigirMestreAction();
  await db.caracteristicaCriaturaCatalogo.update({ where: { id }, data: { arquivada } });
  revalidatePath("/catalogos");
}

export async function excluirCaracteristicaCatalogo(id: string) {
  await exigirMestreAction();
  await db.caracteristicaCriaturaCatalogo.delete({ where: { id } });
  revalidatePath("/catalogos");
}
