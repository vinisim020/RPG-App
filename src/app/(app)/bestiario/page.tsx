import { db } from "@/lib/db";
import { exigirMestre } from "@/lib/auth";
import { CabecalhoPagina } from "@/components/ui";
import { Bestiario, type CriaturaItem } from "./Bestiario";

export const dynamic = "force-dynamic";

export default async function BestiarioPage() {
  await exigirMestre();

  const criaturas = await db.criatura.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  const lista: CriaturaItem[] = criaturas.map((c) => ({
    id: c.id,
    nome: c.nome,
    nivel: c.nivel,
    poder: c.poder,
    dificuldade: c.dificuldade,
    categoria: c.categoria,
    parametrosOfensivos: c.parametrosOfensivos,
    parametrosDefensivos: c.parametrosDefensivos,
    movimentacao: c.movimentacao,
    percepcaoPassiva: c.percepcaoPassiva,
    golpeBrutal: c.golpeBrutal,
    evocacaoMistica: c.evocacaoMistica,
    pvMax: c.pvMax,
    peMax: c.peMax,
    caracteristicas: c.caracteristicas,
    anotacoes: c.anotacoes,
    arquivada: c.arquivada,
  }));

  return (
    <>
      <CabecalhoPagina
        titulo="Fichas de Criaturas"
        descricao="Biblioteca reutilizável do Livro dos Seres, para uso rápido durante a sessão."
      />
      <Bestiario criaturas={lista} />
    </>
  );
}
