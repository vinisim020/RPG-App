import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { Barra, CabecalhoPagina, Cartao, Vazio } from "@/components/ui";
import { NovoPersonagem } from "./NovoPersonagem";

export const dynamic = "force-dynamic";

function Retrato({ url, nome, tamanho = 56 }: { url: string | null; nome: string; tamanho?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={nome}
        style={{ width: tamanho, height: tamanho }}
        className="flex-none rounded-lg border border-[oklch(0.35_0.03_25)] object-cover"
      />
    );
  }
  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        background:
          "repeating-linear-gradient(135deg, oklch(0.22 0.02 25), oklch(0.22 0.02 25) 6px, oklch(0.19 0.018 25) 6px, oklch(0.19 0.018 25) 12px)",
      }}
      className="flex flex-none items-center justify-center rounded-lg border border-[oklch(0.35_0.03_25)] font-serif text-[15px] text-[oklch(0.6_0.03_30)]"
    >
      {nome.slice(0, 1).toUpperCase()}
    </div>
  );
}

type Item = {
  id: string;
  nome: string;
  legado: string;
  nivelDespertar: number;
  retratoUrl: string | null;
  pvAtual: number;
  pvMax: number;
  peAtual: number;
  peMax: number;
  arquivado: boolean;
};

function CardPersonagem({ p }: { p: Item }) {
  return (
    <Link href={`/personagens/${p.id}`} className="block">
      <Cartao className="px-4 py-4 transition-colors hover:bg-card-hi">
        <div className="flex items-start gap-3.5">
          <Retrato url={p.retratoUrl} nome={p.nome} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="titulo truncate text-[19px] font-semibold">{p.nome}</span>
              {p.arquivado ? <span className="pilula">arquivado</span> : null}
            </div>
            <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.03em] text-carmim-suave">
              {[p.legado, `Nível ${p.nivelDespertar}`].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex items-baseline gap-1 text-[11px] text-muted">
                  <span className="font-semibold text-fg-soft">{p.pvAtual}</span>/{p.pvMax} PV
                </div>
                <Barra valor={p.pvAtual} max={p.pvMax} />
              </div>
              <div>
                <div className="mb-1 flex items-baseline gap-1 text-[11px] text-muted">
                  <span className="font-semibold text-fg-soft">{p.peAtual}</span>/{p.peMax} PE
                </div>
                <Barra valor={p.peAtual} max={p.peMax} cor="ambar" />
              </div>
            </div>
          </div>
        </div>
      </Cartao>
    </Link>
  );
}

export default async function PersonagensPage() {
  const sessao = await exigirSessao();
  const ehMestre = sessao.papel === "MESTRE";

  const selecao = {
    id: true,
    nome: true,
    legado: true,
    nivelDespertar: true,
    retratoUrl: true,
    pvAtual: true,
    pvMax: true,
    peAtual: true,
    peMax: true,
    arquivado: true,
  } as const;

  if (!ehMestre) {
    const meus = await db.personagem.findMany({
      where: { usuarioId: sessao.id },
      orderBy: [{ arquivado: "asc" }, { criadoEm: "asc" }],
      select: selecao,
    });

    return (
      <>
        <CabecalhoPagina
          titulo="Meus personagens"
          descricao="Abra uma ficha para consultar ou editar."
          acao={<NovoPersonagem />}
        />
        {meus.length === 0 ? (
          <Vazio>Você ainda não tem personagens. Crie o primeiro acima.</Vazio>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {meus.map((p) => (
              <CardPersonagem key={p.id} p={p} />
            ))}
          </div>
        )}
      </>
    );
  }

  const usuarios = await db.usuario.findMany({
    orderBy: [{ papel: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      papel: true,
      personagens: {
        orderBy: [{ arquivado: "asc" }, { criadoEm: "asc" }],
        select: selecao,
      },
    },
  });

  const comFichas = usuarios.filter((u) => u.personagens.length > 0);

  return (
    <>
      <CabecalhoPagina
        titulo="Personagens da mesa"
        descricao="Todas as fichas, agrupadas por jogador."
        acao={<NovoPersonagem jogadores={usuarios.map((u) => ({ id: u.id, nome: u.nome }))} />}
      />
      {comFichas.length === 0 ? (
        <Vazio>Nenhuma ficha criada ainda.</Vazio>
      ) : (
        <div className="flex flex-col gap-8">
          {comFichas.map((u) => (
            <section key={u.id}>
              <h2 className="secao">
                {u.nome}
                <span className="ml-2 text-[12px] font-normal text-faint">
                  {u.papel === "MESTRE" ? "mestre" : "jogador"}
                </span>
              </h2>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {u.personagens.map((p) => (
                  <CardPersonagem key={p.id} p={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
