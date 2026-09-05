"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessaoAction, SemPermissao } from "@/lib/auth";
import { CONHECIMENTOS, PARAMETROS, ESCALA_MAX, EXAUSTAO_MAX } from "@/lib/constants";
import { limitar } from "@/lib/utils";

async function podeMexer(personagemId: string) {
  const sessao = await exigirSessaoAction();
  const p = await db.personagem.findUnique({
    where: { id: personagemId },
    select: { usuarioId: true },
  });
  if (!p) throw new SemPermissao("Personagem não encontrado.");
  if (sessao.papel !== "MESTRE" && p.usuarioId !== sessao.id) throw new SemPermissao();
  return sessao;
}

export async function criarPersonagem(formData: FormData) {
  const sessao = await exigirSessaoAction();
  const nome = String(formData.get("nome") ?? "").trim() || "Novo personagem";
  const donoPedido = String(formData.get("usuarioId") ?? "");
  const usuarioId = sessao.papel === "MESTRE" && donoPedido ? donoPedido : sessao.id;

  const dono = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!dono) throw new SemPermissao("Jogador não encontrado.");

  const criado = await db.personagem.create({
    data: {
      nome,
      usuarioId,
      jogadorNome: dono.nome,
      parametros: { create: PARAMETROS.map((n) => ({ nome: n, valor: 0 })) },
      conhecimentos: { create: CONHECIMENTOS.map((n) => ({ nome: n, valor: 0 })) },
    },
    select: { id: true },
  });

  revalidatePath("/personagens");
  redirect(`/personagens/${criado.id}`);
}

export async function excluirPersonagem(id: string) {
  await podeMexer(id);
  await db.personagem.delete({ where: { id } });
  revalidatePath("/personagens");
}

export async function arquivarPersonagem(id: string, arquivado: boolean) {
  await podeMexer(id);
  await db.personagem.update({ where: { id }, data: { arquivado } });
  revalidatePath("/personagens");
}

export type DadosFicha = {
  nome: string;
  jogadorNome: string;
  legado: string;
  nivelDespertar: number;
  retratoUrl: string;
  movimentacao: string;
  bloqueio: string;
  percepcaoPassiva: string;
  pvAtual: number;
  pvTemp: number;
  pvMax: number;
  peAtual: number;
  peTemp: number;
  peMax: number;
  exaustao: number;
  moedasPrata: number;
  moedasOuro: number;
  moedasImperiais: number;
  potencia: number;
  pontuacaoUnidade: number;
  maestrias: string;
  habilidadesLegado: string;
  anotacoes: string;
  parametros: { nome: string; valor: number }[];
  conhecimentos: { nome: string; valor: number; temMaestria: boolean }[];
  equipamentos: {
    tipo: "ARMA" | "ARMADURA";
    nome: string;
    dano: string;
    alcance: string;
    bloqueio: string;
    inaptidao: string;
    propriedade: string;
  }[];
  habilidades: {
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
  }[];
  itens: {
    nome: string;
    quantidade: number;
    peso: string;
    categoria: string;
    descricao: string;
  }[];
};

const inteiro = (v: unknown, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

export async function salvarFicha(id: string, d: DadosFicha) {
  await podeMexer(id);

  const parametros = PARAMETROS.map((nome) => ({
    nome,
    valor: limitar(inteiro(d.parametros.find((p) => p.nome === nome)?.valor), 0, ESCALA_MAX),
  }));

  const conhecimentos = CONHECIMENTOS.map((nome) => {
    const c = d.conhecimentos.find((x) => x.nome === nome);
    return {
      nome,
      valor: limitar(inteiro(c?.valor), 0, ESCALA_MAX),
      temMaestria: Boolean(c?.temMaestria),
    };
  });

  await db.$transaction([
    db.personagem.update({
      where: { id },
      data: {
        nome: d.nome.trim() || "Sem nome",
        jogadorNome: d.jogadorNome.trim(),
        legado: d.legado.trim(),
        nivelDespertar: limitar(inteiro(d.nivelDespertar, 1), 0, 99),
        retratoUrl: d.retratoUrl.trim() || null,
        movimentacao: d.movimentacao.trim(),
        bloqueio: d.bloqueio.trim(),
        percepcaoPassiva: d.percepcaoPassiva.trim(),
        pvAtual: inteiro(d.pvAtual),
        pvTemp: inteiro(d.pvTemp),
        pvMax: inteiro(d.pvMax),
        peAtual: inteiro(d.peAtual),
        peTemp: inteiro(d.peTemp),
        peMax: inteiro(d.peMax),
        exaustao: limitar(inteiro(d.exaustao), 0, EXAUSTAO_MAX),
        moedasPrata: inteiro(d.moedasPrata),
        moedasOuro: inteiro(d.moedasOuro),
        moedasImperiais: inteiro(d.moedasImperiais),
        potencia: inteiro(d.potencia),
        pontuacaoUnidade: inteiro(d.pontuacaoUnidade),
        maestrias: d.maestrias,
        habilidadesLegado: d.habilidadesLegado,
        anotacoes: d.anotacoes,
      },
    }),

    db.parametro.deleteMany({ where: { personagemId: id } }),
    db.parametro.createMany({ data: parametros.map((p) => ({ ...p, personagemId: id })) }),

    db.conhecimento.deleteMany({ where: { personagemId: id } }),
    db.conhecimento.createMany({
      data: conhecimentos.map((c) => ({ ...c, personagemId: id })),
    }),

    db.equipamento.deleteMany({ where: { personagemId: id } }),
    db.equipamento.createMany({
      data: d.equipamentos.map((e, i) => ({
        personagemId: id,
        tipo: e.tipo === "ARMADURA" ? ("ARMADURA" as const) : ("ARMA" as const),
        nome: e.nome,
        dano: e.dano,
        alcance: e.alcance,
        bloqueio: e.bloqueio,
        inaptidao: e.inaptidao,
        propriedade: e.propriedade,
        ordem: i,
      })),
    }),

    db.habilidadeCaminho.deleteMany({ where: { personagemId: id } }),
    db.habilidadeCaminho.createMany({
      data: d.habilidades.map((h, i) => ({
        personagemId: id,
        nome: h.nome,
        tipoAcao: (["INICIATIVA", "ATIVA", "PASSIVA", "RAPIDA", "SIMPLES", "ACELERADA"].includes(
          h.tipoAcao
        )
          ? h.tipoAcao
          : "ATIVA") as "INICIATIVA" | "ATIVA" | "PASSIVA" | "RAPIDA" | "SIMPLES" | "ACELERADA",
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
    }),

    db.itemInventario.deleteMany({ where: { personagemId: id } }),
    db.itemInventario.createMany({
      data: d.itens.map((it, i) => ({
        personagemId: id,
        nome: it.nome,
        quantidade: inteiro(it.quantidade, 1),
        peso: it.peso,
        categoria: it.categoria,
        descricao: it.descricao,
        ordem: i,
      })),
    }),
  ]);

  revalidatePath(`/personagens/${id}`);
  revalidatePath("/personagens");
  revalidatePath("/iniciativa");
  return { ok: true as const };
}
