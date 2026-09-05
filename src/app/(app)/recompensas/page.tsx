import { db } from "@/lib/db";
import { exigirMestre } from "@/lib/auth";
import { CabecalhoPagina } from "@/components/ui";
import { Recompensas, type RecompensaItem } from "./Recompensas";

export const dynamic = "force-dynamic";

export default async function RecompensasPage() {
  await exigirMestre();

  const [recompensas, personagens] = await Promise.all([
    db.recompensa.findMany({
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      include: { personagemDestino: { select: { nome: true } } },
    }),
    db.personagem.findMany({
      where: { arquivado: false },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, usuario: { select: { nome: true } } },
    }),
  ]);

  const mapear = (r: (typeof recompensas)[number]): RecompensaItem => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    categoria: r.categoria,
    quantidade: r.quantidade,
    peso: r.peso,
    personagemDestinoId: r.personagemDestinoId,
    status: r.status,
    entregueEm: r.entregueEm ? r.entregueEm.toISOString() : null,
    destinoNome: r.personagemDestino?.nome ?? null,
  });

  return (
    <>
      <CabecalhoPagina
        titulo="Recompensas"
        descricao="Monte os prêmios da sessão; ao entregar, o item vai direto para o inventário do personagem."
      />
      <Recompensas
        pendentes={recompensas.filter((r) => r.status === "PENDENTE").map(mapear)}
        entregues={recompensas.filter((r) => r.status === "ENTREGUE").map(mapear)}
        personagens={personagens.map((p) => ({
          id: p.id,
          nome: p.nome,
          jogador: p.usuario.nome,
        }))}
      />
    </>
  );
}
