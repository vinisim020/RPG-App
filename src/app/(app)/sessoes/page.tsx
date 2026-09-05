import { db } from "@/lib/db";
import { exigirMestre } from "@/lib/auth";
import { CabecalhoPagina } from "@/components/ui";
import { Sessoes } from "./Sessoes";

export const dynamic = "force-dynamic";

export default async function SessoesPage() {
  await exigirMestre();

  const sessoes = await db.anotacaoSessao.findMany({
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
  });

  return (
    <>
      <CabecalhoPagina
        titulo="Anotações de Sessão"
        descricao="Diário da campanha, visível apenas para o mestre."
      />
      <Sessoes
        sessoes={sessoes.map((s) => ({
          id: s.id,
          titulo: s.titulo,
          data: s.data.toISOString(),
          texto: s.texto,
        }))}
      />
    </>
  );
}
