import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { carregarCombate } from "@/lib/combate";
import { CabecalhoPagina } from "@/components/ui";
import { Iniciativa } from "./Iniciativa";

export const dynamic = "force-dynamic";

export default async function IniciativaPage() {
  const sessao = await exigirSessao();
  const ehMestre = sessao.papel === "MESTRE";

  const combate = await carregarCombate(ehMestre);

  const personagens = ehMestre
    ? await db.personagem.findMany({
        where: { arquivado: false },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, usuario: { select: { nome: true } } },
      })
    : [];

  const criaturas = ehMestre
    ? await db.criatura.findMany({
        where: { arquivada: false },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, categoria: true },
      })
    : [];

  return (
    <>
      <CabecalhoPagina
        titulo="Iniciativa de Combate"
        descricao={
          ehMestre
            ? "Arraste para reordenar · clique no nome para marcar o turno atual"
            : "Ordem da rodada atual, atualizada pelo mestre"
        }
      />
      <Iniciativa
        inicial={combate}
        ehMestre={ehMestre}
        personagens={personagens.map((p) => ({
          id: p.id,
          nome: p.nome,
          jogador: p.usuario.nome,
        }))}
        criaturas={criaturas}
      />
    </>
  );
}
