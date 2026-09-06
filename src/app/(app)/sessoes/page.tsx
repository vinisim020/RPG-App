import { db } from "@/lib/db";
import { exigirMestre } from "@/lib/auth";
import { CabecalhoPagina } from "@/components/ui";
import { Sessoes } from "./Sessoes";

export const dynamic = "force-dynamic";

export default async function SessoesPage() {
  await exigirMestre();

  const [sessoes, criaturas] = await Promise.all([
    db.anotacaoSessao.findMany({
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
      include: {
        blocos: { orderBy: { ordem: "asc" } },
        grupos: {
          orderBy: { ordem: "asc" },
          include: {
            integrantes: {
              orderBy: { ordem: "asc" },
              include: { criatura: { select: { id: true, nome: true, pvMax: true, peMax: true } } },
            },
          },
        },
      },
    }),
    db.criatura.findMany({
      where: { arquivada: false },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, pvMax: true, peMax: true },
    }),
  ]);

  return (
    <>
      <CabecalhoPagina
        titulo="Preparação de Sessão"
        descricao="Organize a sessão em blocos e monte os grupos de combate com antecedência."
      />
      <Sessoes
        sessoes={sessoes.map((s) => ({
          id: s.id,
          titulo: s.titulo,
          data: s.data.toISOString(),
          blocos: s.blocos.map((b) => ({ titulo: b.titulo, texto: b.texto })),
          grupos: s.grupos.map((g) => ({
            id: g.id,
            nome: g.nome,
            anotacoes: g.anotacoes,
            integrantes: g.integrantes.map((it) => ({
              criaturaId: it.criaturaId,
              nomeCriatura: it.criatura?.nome ?? null,
              nomeAvulso: it.nomeAvulso,
              pvAvulso: it.criatura?.pvMax ?? it.pvAvulso,
              peAvulso: it.criatura?.peMax ?? it.peAvulso,
              quantidade: it.quantidade,
            })),
          })),
        }))}
        criaturas={criaturas}
      />
    </>
  );
}
