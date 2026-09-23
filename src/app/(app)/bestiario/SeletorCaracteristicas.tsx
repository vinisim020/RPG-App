"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, quebrarPontoEVirgula } from "@/lib/utils";
import { Modal } from "@/components/interativos";
import { Cartao, Pilula } from "@/components/ui";

export type CatalogoCaracteristicaItem = {
  id: string;
  livro: string;
  dificuldade: string;
  nome: string;
  custoPe: string;
  tipoAcao: string;
  efeitoResumo: string;
};

export function SeletorCaracteristicas({
  aberto,
  aoFechar,
  catalogo,
  onConfirmar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  catalogo: CatalogoCaracteristicaItem[];
  onConfirmar: (texto: string) => void;
}) {
  const [livro, setLivro] = useState<string | null>(null);
  const [dificuldade, setDificuldade] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!aberto) return;
    setLivro(null);
    setDificuldade(null);
    setBusca("");
    setSelecionadas(new Set());
  }, [aberto]);

  const livros = useMemo(() => Array.from(new Set(catalogo.map((c) => c.livro))), [catalogo]);

  const dificuldades = useMemo(() => {
    if (!livro) return [];
    return Array.from(
      new Set(catalogo.filter((c) => c.livro === livro).map((c) => c.dificuldade))
    );
  }, [catalogo, livro]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return catalogo.filter((c) => {
      if (livro && c.livro !== livro) return false;
      if (dificuldade && c.dificuldade !== dificuldade) return false;
      if (termo && !c.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [catalogo, livro, dificuldade, busca]);

  const itensSelecionados = useMemo(
    () => catalogo.filter((c) => selecionadas.has(c.id)),
    [catalogo, selecionadas]
  );

  function alternar(id: string) {
    setSelecionadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function confirmar() {
    const texto = itensSelecionados
      .map((c) => `${c.nome}: ${quebrarPontoEVirgula(c.efeitoResumo)}`)
      .join("\n\n");
    onConfirmar(texto);
    aoFechar();
  }

  if (!aberto) return null;

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Catálogo de Características" largura={1080}>
      <div className="flex flex-col gap-4">
        {/* livros */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={cn("btn btn-mini", !livro && "btn-primario")}
            onClick={() => {
              setLivro(null);
              setDificuldade(null);
            }}
          >
            Todos
          </button>
          {livros.map((l) => (
            <button
              key={l}
              type="button"
              className={cn("btn btn-mini", livro === l && "btn-primario")}
              onClick={() => {
                setLivro(l === livro ? null : l);
                setDificuldade(null);
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* dificuldades */}
        {livro ? (
          <div className="flex flex-wrap gap-1.5 border-t border-line-soft pt-3">
            <button
              type="button"
              className={cn("btn btn-mini", !dificuldade && "btn-primario")}
              onClick={() => setDificuldade(null)}
            >
              Todas
            </button>
            {dificuldades.map((dd) => (
              <button
                key={dd}
                type="button"
                className={cn("btn btn-mini", dificuldade === dd && "btn-primario")}
                onClick={() => setDificuldade(dd === dificuldade ? null : dd)}
              >
                {dd}
              </button>
            ))}
          </div>
        ) : null}

        <input
          className="campo campo-caixa text-[13px]"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar característica pelo nome…"
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          {/* lista filtrada */}
          <div className="flex max-h-[52vh] flex-col gap-2.5 overflow-y-auto pr-1">
            {filtradas.length === 0 ? (
              <p className="px-2 py-8 text-center text-[12.5px] text-faint">
                Nenhuma característica encontrada.
              </p>
            ) : (
              filtradas.map((c) => {
                const sel = selecionadas.has(c.id);
                return (
                  <Cartao
                    key={c.id}
                    onClick={() => alternar(c.id)}
                    className={cn(
                      "cursor-pointer px-4 py-3 transition-colors",
                      sel && "border-[oklch(0.55_0.18_25_/_0.55)] bg-[oklch(0.55_0.18_25_/_0.1)]"
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="titulo flex-1 text-[14.5px] font-semibold">{c.nome}</span>
                      <Pilula>{c.dificuldade}</Pilula>
                      {c.tipoAcao ? <Pilula>{c.tipoAcao}</Pilula> : null}
                      {c.custoPe ? <Pilula variante="ambar">{c.custoPe} PE</Pilula> : null}
                    </div>
                    {c.efeitoResumo ? (
                      <p className="whitespace-pre-wrap text-[12px] leading-[1.5] text-fg-dim">
                        {quebrarPontoEVirgula(c.efeitoResumo)}
                      </p>
                    ) : null}
                  </Cartao>
                );
              })
            )}
          </div>

          {/* selecionadas */}
          <div className="max-h-[52vh] overflow-y-auto rounded-md border border-line-soft px-3 py-3">
            <p className="rotulo mb-2.5">Selecionadas ({itensSelecionados.length})</p>
            {itensSelecionados.length === 0 ? (
              <p className="text-[12px] text-faint">Nenhuma característica selecionada.</p>
            ) : (
              (() => {
                const grupos = new Map<string, CatalogoCaracteristicaItem[]>();
                for (const c of itensSelecionados) {
                  if (!grupos.has(c.livro)) grupos.set(c.livro, []);
                  grupos.get(c.livro)!.push(c);
                }
                return Array.from(grupos.entries()).map(([l, itens]) => (
                  <div key={l} className="mb-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-fg-soft">{l}</p>
                    {itens.map((c) => (
                      <p key={c.id} className="text-[12px] text-fg-dim">
                        {c.nome}
                      </p>
                    ))}
                  </div>
                ));
              })()
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
          <button type="button" className="btn" onClick={aoFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            onClick={confirmar}
            disabled={itensSelecionados.length === 0}
          >
            Adicionar selecionadas
          </button>
        </div>
      </div>
    </Modal>
  );
}
