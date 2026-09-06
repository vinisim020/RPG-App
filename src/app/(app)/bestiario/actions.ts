"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction } from "@/lib/auth";
import { CATEGORIAS_SER, type CategoriaSer } from "@/lib/constants";

export type DadosHabilidadeCriatura = {
  nome: string;
  tipoAcao: string;
  custoPe: number;
  conjuracao: boolean;
  tipoConjuracao: string;
  duracao: string;
  pagina: string;
  aprimoramentoA: boolean;
  aprimoramentoB: boolean;
  descricao: string;
};

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
  pvMax: number;
  peMax: number;
  caracteristicas: string;
  anotacoes: string;
  habilidades: DadosHabilidadeCriatura[];
};

const inteiro = (v: unknown, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

const TIPOS_ACAO_VALIDOS = [
  "INICIATIVA",
  "ATIVA",
  "PASSIVA",
  "RAPIDA",
  "SIMPLES",
  "ACELERADA",
] as const;
type TipoAcaoValido = (typeof TIPOS_ACAO_VALIDOS)[number];

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
    pvMax: inteiro(d.pvMax),
    peMax: inteiro(d.peMax),
    caracteristicas: d.caracteristicas,
    anotacoes: d.anotacoes,
  };
}

export async function salvarCriatura(id: string | null, d: DadosCriatura) {
  await exigirMestreAction();
  const dados = normalizar(d);

  const criaturaId = await db.$transaction(async (tx) => {
    const criatura = id
      ? await tx.criatura.update({ where: { id }, data: dados })
      : await tx.criatura.create({ data: dados });

    await tx.habilidadeCriatura.deleteMany({ where: { criaturaId: criatura.id } });
    if (d.habilidades.length > 0) {
      await tx.habilidadeCriatura.createMany({
        data: d.habilidades.map((h, i) => ({
          criaturaId: criatura.id,
          nome: h.nome,
          tipoAcao: (TIPOS_ACAO_VALIDOS as readonly string[]).includes(h.tipoAcao)
            ? (h.tipoAcao as TipoAcaoValido)
            : "ATIVA",
          custoPe: inteiro(h.custoPe),
          conjuracao: Boolean(h.conjuracao),
          tipoConjuracao: h.tipoConjuracao,
          duracao: h.duracao,
          pagina: h.pagina,
          aprimoramentoA: Boolean(h.aprimoramentoA),
          aprimoramentoB: Boolean(h.aprimoramentoB),
          descricao: h.descricao,
          ordem: i,
        })),
      });
    }

    return criatura.id;
  });

  revalidatePath("/bestiario");
  revalidatePath("/iniciativa");
  revalidatePath("/sessoes");
  return { id: criaturaId };
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
  const base = await db.criatura.findUnique({
    where: { id },
    include: { habilidades: { orderBy: { ordem: "asc" } } },
  });
  if (!base) return;
  const { id: _ignorado, criadoEm, atualizadoEm, habilidades, ...resto } = base;

  await db.criatura.create({
    data: {
      ...resto,
      nome: `${base.nome} (cópia)`,
      habilidades: {
        create: habilidades.map((h) => {
          const { id: _hid, criaturaId: _cid, ...hResto } = h;
          return hResto;
        }),
      },
    },
  });
  revalidatePath("/bestiario");
}
