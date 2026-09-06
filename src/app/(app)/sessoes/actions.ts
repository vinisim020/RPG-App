"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirMestreAction } from "@/lib/auth";

const inteiro = (v: unknown, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

// ------------------------------------------------------------------ sessão

export type DadosSessao = { titulo: string; data: string };

export async function excluirSessao(id: string) {
  await exigirMestreAction();
  await db.anotacaoSessao.delete({ where: { id } });
  revalidatePath("/sessoes");
}

// -------------------------------------------------------------- blocos

export type DadosBloco = { titulo: string; texto: string };

/** Salva título/data e substitui todos os blocos de uma vez só — um único
 * botão "Salvar" para a sessão inteira, como na Ficha de Personagem. */
export async function salvarSessaoCompleta(
  id: string | null,
  d: DadosSessao & { blocos: DadosBloco[] }
) {
  await exigirMestreAction();

  const data = d.data ? new Date(`${d.data}T12:00:00`) : new Date();
  const dadosSessao = {
    titulo: d.titulo.trim() || "Sessão sem título",
    data: Number.isNaN(data.getTime()) ? new Date() : data,
  };

  const sessaoId = await db.$transaction(async (tx) => {
    const sessao = id
      ? await tx.anotacaoSessao.update({ where: { id }, data: dadosSessao })
      : await tx.anotacaoSessao.create({ data: dadosSessao });

    await tx.blocoSessao.deleteMany({ where: { sessaoId: sessao.id } });
    if (d.blocos.length > 0) {
      await tx.blocoSessao.createMany({
        data: d.blocos.map((b, i) => ({
          sessaoId: sessao.id,
          titulo: b.titulo,
          texto: b.texto,
          ordem: i,
        })),
      });
    }

    return sessao.id;
  });

  revalidatePath("/sessoes");
  return { id: sessaoId };
}

// ---------------------------------------------------------- grupos de combate

export type DadosIntegrante = {
  criaturaId: string | null;
  nomeAvulso: string;
  pvAvulso: number;
  peAvulso: number;
  quantidade: number;
};

export async function criarGrupo(sessaoId: string | null, nome: string) {
  await exigirMestreAction();
  const grupo = await db.grupoCombate.create({
    data: { sessaoId, nome: nome.trim() || "Grupo de combate" },
  });
  revalidatePath("/sessoes");
  revalidatePath("/iniciativa");
  return { id: grupo.id };
}

export async function renomearGrupo(id: string, nome: string, anotacoes: string) {
  await exigirMestreAction();
  await db.grupoCombate.update({
    where: { id },
    data: { nome: nome.trim() || "Grupo de combate", anotacoes },
  });
  revalidatePath("/sessoes");
  revalidatePath("/iniciativa");
}

export async function excluirGrupo(id: string) {
  await exigirMestreAction();
  await db.grupoCombate.delete({ where: { id } });
  revalidatePath("/sessoes");
  revalidatePath("/iniciativa");
}

/** Substitui todos os integrantes de um grupo pela lista enviada. */
export async function salvarIntegrantes(grupoId: string, integrantes: DadosIntegrante[]) {
  await exigirMestreAction();

  await db.$transaction([
    db.grupoCombateIntegrante.deleteMany({ where: { grupoId } }),
    db.grupoCombateIntegrante.createMany({
      data: integrantes.map((it, i) => ({
        grupoId,
        criaturaId: it.criaturaId,
        nomeAvulso: it.criaturaId ? "" : it.nomeAvulso,
        pvAvulso: it.criaturaId ? 0 : inteiro(it.pvAvulso),
        peAvulso: it.criaturaId ? 0 : inteiro(it.peAvulso),
        quantidade: Math.max(1, inteiro(it.quantidade, 1)),
        ordem: i,
      })),
    }),
  ]);

  revalidatePath("/sessoes");
  revalidatePath("/iniciativa");
}
