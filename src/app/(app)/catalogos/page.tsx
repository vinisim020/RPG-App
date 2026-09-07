import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { CabecalhoPagina } from "@/components/ui";
import { Catalogos } from "./Catalogos";

export const dynamic = "force-dynamic";

export default async function CatalogosPage() {
  const sessao = await exigirSessao();
  const ehMestre = sessao.papel === "MESTRE";

  const [habilidades, equipamentos, caracteristicas, especializacoes, propriedades] =
    await Promise.all([
      db.habilidadeCatalogo.findMany({ orderBy: [{ caminho: "asc" }, { especializacao: "asc" }, { nome: "asc" }] }),
      db.equipamentoCatalogo.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
      db.caracteristicaCriaturaCatalogo.findMany({ orderBy: [{ livro: "asc" }, { dificuldade: "asc" }, { nome: "asc" }] }),
      db.especializacaoCombate.findMany({ orderBy: [{ caminho: "asc" }, { especializacao: "asc" }] }),
      db.propriedadeArmamento.findMany({ orderBy: { nome: "asc" } }),
    ]);

  return (
    <>
      <CabecalhoPagina
        titulo="Catálogos"
        descricao={
          ehMestre
            ? "Referência do livro de regras — equipamentos, habilidades e características. Crie, edite e arquive itens aqui."
            : "Referência do livro de regras — consulte antes de escolher algo na sua ficha."
        }
      />
      <Catalogos
        ehMestre={ehMestre}
        habilidades={habilidades}
        equipamentos={equipamentos}
        caracteristicas={caracteristicas}
        especializacoes={especializacoes}
        propriedades={propriedades}
      />
    </>
  );
}
