import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { CONHECIMENTOS, PARAMETROS } from "@/lib/constants";
import type { DadosFicha } from "../actions";
import { Ficha } from "./Ficha";

export const dynamic = "force-dynamic";

export default async function PersonagemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessao = await exigirSessao();

  const p = await db.personagem.findUnique({
    where: { id },
    include: {
      usuario: { select: { nome: true } },
      parametros: true,
      conhecimentos: true,
      equipamentos: { orderBy: { ordem: "asc" } },
      habilidades: { orderBy: { ordem: "asc" } },
      itens: { orderBy: { ordem: "asc" } },
    },
  });

  if (!p) notFound();
  if (sessao.papel !== "MESTRE" && p.usuarioId !== sessao.id) notFound();

  const inicial: DadosFicha = {
    nome: p.nome,
    jogadorNome: p.jogadorNome,
    legado: p.legado,
    nivelDespertar: p.nivelDespertar,
    retratoUrl: p.retratoUrl ?? "",
    movimentacao: p.movimentacao,
    bloqueio: p.bloqueio,
    percepcaoPassiva: p.percepcaoPassiva,
    pvAtual: p.pvAtual,
    pvTemp: p.pvTemp,
    pvMax: p.pvMax,
    peAtual: p.peAtual,
    peTemp: p.peTemp,
    peMax: p.peMax,
    exaustao: p.exaustao,
    moedasPrata: p.moedasPrata,
    moedasOuro: p.moedasOuro,
    moedasImperiais: p.moedasImperiais,
    potencia: p.potencia,
    pontuacaoUnidade: p.pontuacaoUnidade,
    maestrias: p.maestrias,
    habilidadesLegado: p.habilidadesLegado,
    anotacoes: p.anotacoes,
    parametros: PARAMETROS.map((nome) => ({
      nome,
      valor: p.parametros.find((x) => x.nome === nome)?.valor ?? 0,
    })),
    conhecimentos: CONHECIMENTOS.map((nome) => {
      const c = p.conhecimentos.find((x) => x.nome === nome);
      return { nome, valor: c?.valor ?? 0, temMaestria: c?.temMaestria ?? false };
    }),
    equipamentos: p.equipamentos.map((e) => ({
      tipo: e.tipo,
      nome: e.nome,
      dano: e.dano,
      alcance: e.alcance,
      bloqueio: e.bloqueio,
      inaptidao: e.inaptidao,
      propriedade: e.propriedade,
    })),
    habilidades: p.habilidades.map((h) => ({
      nome: h.nome,
      tipoAcao: h.tipoAcao,
      custoPe: h.custoPe,
      conjuracao: h.conjuracao,
      tipoConjuracao: h.tipoConjuracao,
      duracao: h.duracao,
      pagina: h.pagina,
      aprimoramentoA: h.aprimoramentoA,
      aprimoramentoB: h.aprimoramentoB,
      descricao: h.descricao,
    })),
    itens: p.itens.map((it) => ({
      nome: it.nome,
      quantidade: it.quantidade,
      peso: it.peso,
      categoria: it.categoria,
      descricao: it.descricao,
    })),
  };

  return (
    <>
      <Link
        href="/personagens"
        className="mb-5 inline-block text-[12.5px] text-muted transition-colors hover:text-fg-soft"
      >
        &larr; Personagens
      </Link>
      <Ficha
        id={p.id}
        inicial={inicial}
        donoNome={p.usuario.nome}
        arquivado={p.arquivado}
      />
    </>
  );
}
