"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/interativos";
import { Cartao, Pilula } from "@/components/ui";
import type { DadosFicha } from "../actions";

export type CatalogoEquipamentoItem = {
  id: string;
  categoria: string;
  subcategoria: string;
  nome: string;
  precoMp: string;
  unidade: string;
  danoOuBloqueio: string;
  parametroOuRequisito: string;
  alcance: string;
  propriedadeOuNotas: string;
};

type EquipamentoFicha = DadosFicha["equipamentos"][number];
type ItemFicha = DadosFicha["itens"][number];

function paraAlvo(categoria: string): "ARMA" | "ARMADURA" | "ITEM" {
  if (categoria === "Armamento") return "ARMA";
  if (categoria === "Armadura") return "ARMADURA";
  return "ITEM";
}

export function SeletorEquipamentos({
  aberto,
  aoFechar,
  catalogo,
  onAdicionarEquipamento,
  onAdicionarItem,
}: {
  aberto: boolean;
  aoFechar: () => void;
  catalogo: CatalogoEquipamentoItem[];
  onAdicionarEquipamento: (e: EquipamentoFicha) => void;
  onAdicionarItem: (i: ItemFicha) => void;
}) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());

  const categorias = useMemo(
    () => Array.from(new Set(catalogo.map((c) => c.categoria))),
    [catalogo]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return catalogo.filter((c) => {
      if (categoria && c.categoria !== categoria) return false;
      if (termo && !c.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [catalogo, categoria, busca]);

  function adicionar(c: CatalogoEquipamentoItem) {
    const alvo = paraAlvo(c.categoria);
    if (alvo === "ITEM") {
      onAdicionarItem({
        nome: c.nome,
        quantidade: 1,
        peso: c.unidade,
        categoria: c.categoria,
        descricao: [c.propriedadeOuNotas, c.precoMp ? `Preço: ${c.precoMp} MP` : ""]
          .filter(Boolean)
          .join(" — "),
      });
    } else {
      onAdicionarEquipamento({
        tipo: alvo,
        nome: c.nome,
        dano: alvo === "ARMA" ? c.danoOuBloqueio : "",
        alcance: c.alcance,
        bloqueio: alvo === "ARMADURA" ? c.danoOuBloqueio : "",
        inaptidao: c.parametroOuRequisito,
        propriedade: c.propriedadeOuNotas,
      });
    }
    setAdicionados((s) => new Set(s).add(c.id));
  }

  if (!aberto) return null;

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Catálogo de Equipamentos" largura={800}>
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={cn("btn btn-mini", !categoria && "btn-primario")}
            onClick={() => setCategoria(null)}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              className={cn("btn btn-mini", categoria === c && "btn-primario")}
              onClick={() => setCategoria(c === categoria ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>

        <input
          className="campo campo-caixa text-[13px]"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar item pelo nome…"
        />

        <div className="flex max-h-[56vh] flex-col gap-2 overflow-y-auto pr-1">
          {filtrados.length === 0 ? (
            <p className="px-2 py-8 text-center text-[12.5px] text-faint">Nenhum item encontrado.</p>
          ) : (
            filtrados.map((c) => {
              const jaAdicionado = adicionados.has(c.id);
              return (
                <Cartao key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] text-fg-soft">{c.nome}</span>
                      <Pilula>{c.categoria}</Pilula>
                      {c.precoMp ? (
                        <span className="text-[11px] text-faint">{c.precoMp} MP</span>
                      ) : null}
                    </div>
                    {c.propriedadeOuNotas ? (
                      <p className="mt-0.5 truncate text-[11.5px] text-faint">
                        {c.propriedadeOuNotas}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="btn btn-mini"
                    onClick={() => adicionar(c)}
                  >
                    {jaAdicionado ? "Adicionar de novo" : "Adicionar"}
                  </button>
                </Cartao>
              );
            })
          )}
        </div>

        <div className="flex justify-end border-t border-line-soft pt-4">
          <button type="button" className="btn btn-primario" onClick={aoFechar}>
            Concluído
          </button>
        </div>
      </div>
    </Modal>
  );
}
