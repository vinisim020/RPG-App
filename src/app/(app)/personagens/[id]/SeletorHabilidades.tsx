"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, quebrarPontoEVirgula } from "@/lib/utils";
import { Modal, Alternador } from "@/components/interativos";
import { Cartao, Pilula } from "@/components/ui";
import type { DadosFicha } from "../actions";

export type CatalogoHabilidadeItem = {
  id: string;
  caminho: string;
  especializacao: string;
  nome: string;
  custoPe: string;
  tipoAcao: string;
  conjuracao: boolean;
  efeitoResumo: string;
  aprimoramentoA: string;
  aprimoramentoB: string;
};

type HabilidadeFicha = DadosFicha["habilidades"][number];
type Selecao = Record<string, { aprimA: boolean; aprimB: boolean }>;

const MAPA_TIPO_ACAO: Record<string, HabilidadeFicha["tipoAcao"]> = {
  Iniciativa: "INICIATIVA",
  "Ação Ativa": "ATIVA",
  "Ação Simples": "SIMPLES",
  "Ação Rápida": "RAPIDA",
};

function construirHabilidade(
  c: CatalogoHabilidadeItem,
  sel: { aprimA: boolean; aprimB: boolean }
): HabilidadeFicha {
  const custoPe = parseInt(c.custoPe, 10);
  let descricao = quebrarPontoEVirgula(c.efeitoResumo);
  if (sel.aprimA && c.aprimoramentoA) {
    descricao += `\n\nAprimoramento I: ${quebrarPontoEVirgula(c.aprimoramentoA)}`;
  }
  if (sel.aprimB && c.aprimoramentoB) {
    descricao += `\n\nAprimoramento II: ${quebrarPontoEVirgula(c.aprimoramentoB)}`;
  }
  return {
    nome: c.nome,
    tipoAcao: MAPA_TIPO_ACAO[c.tipoAcao] ?? "PASSIVA",
    custoPe: Number.isFinite(custoPe) ? custoPe : 0,
    conjuracao: c.conjuracao,
    tipoConjuracao: "",
    duracao: "",
    pagina: "",
    aprimoramentoA: sel.aprimA,
    aprimoramentoB: sel.aprimB,
    descricao,
  };
}

export function SeletorHabilidades({
  aberto,
  aoFechar,
  catalogo,
  habilidadesAtuais,
  onConfirmar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  catalogo: CatalogoHabilidadeItem[];
  habilidadesAtuais: HabilidadeFicha[];
  onConfirmar: (novaLista: HabilidadeFicha[]) => void;
}) {
  const [caminho, setCaminho] = useState<string | null>(null);
  const [especializacao, setEspecializacao] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [selecao, setSelecao] = useState<Selecao>({});

  useEffect(() => {
    if (!aberto) return;
    setCaminho(null);
    setEspecializacao(null);
    setBusca("");
    const mapa: Selecao = {};
    for (const h of habilidadesAtuais) {
      const c = catalogo.find((x) => x.nome === h.nome);
      if (c) mapa[c.id] = { aprimA: h.aprimoramentoA, aprimB: h.aprimoramentoB };
    }
    setSelecao(mapa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const caminhos = useMemo(
    () => Array.from(new Set(catalogo.map((c) => c.caminho))),
    [catalogo]
  );

  const especializacoes = useMemo(() => {
    if (!caminho) return [];
    return Array.from(
      new Set(catalogo.filter((c) => c.caminho === caminho).map((c) => c.especializacao))
    );
  }, [catalogo, caminho]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return catalogo.filter((c) => {
      if (caminho && c.caminho !== caminho) return false;
      if (especializacao && c.especializacao !== especializacao) return false;
      if (termo && !c.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [catalogo, caminho, especializacao, busca]);

  const idsSelecionados = useMemo(() => {
    const ids = Object.keys(selecao);
    // mantem a ordem do catalogo (ja vem ordenado por caminho/especializacao/nome)
    return catalogo.filter((c) => ids.includes(c.id));
  }, [catalogo, selecao]);

  function alternarBase(c: CatalogoHabilidadeItem) {
    setSelecao((s) => {
      if (s[c.id]) {
        const n = { ...s };
        delete n[c.id];
        return n;
      }
      return { ...s, [c.id]: { aprimA: false, aprimB: false } };
    });
  }

  function alternarAprim(c: CatalogoHabilidadeItem, chave: "aprimA" | "aprimB") {
    setSelecao((s) => {
      const atual = s[c.id] ?? { aprimA: false, aprimB: false };
      return { ...s, [c.id]: { ...atual, [chave]: !atual[chave] } };
    });
  }

  function confirmar() {
    const nomesCatalogo = new Map(catalogo.map((c) => [c.nome, c]));
    let lista = habilidadesAtuais.filter((h) => {
      const c = nomesCatalogo.get(h.nome);
      if (!c) return true; // entrada manual, nunca mexida aqui
      return Boolean(selecao[c.id]); // remove se foi desmarcada
    });

    for (const c of catalogo) {
      const sel = selecao[c.id];
      if (!sel) continue;
      const idx = lista.findIndex((h) => h.nome === c.nome);
      if (idx === -1) lista = [...lista, construirHabilidade(c, sel)];
      else
        lista = lista.map((h, i) =>
          i === idx ? { ...h, aprimoramentoA: sel.aprimA, aprimoramentoB: sel.aprimB } : h
        );
    }

    onConfirmar(lista);
    aoFechar();
  }

  if (!aberto) return null;

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Catálogo de Habilidades" largura={1080}>
      <div className="flex flex-col gap-4">
        {/* arquetipos */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={cn("btn btn-mini", !caminho && "btn-primario")}
            onClick={() => {
              setCaminho(null);
              setEspecializacao(null);
            }}
          >
            Todos
          </button>
          {caminhos.map((c) => (
            <button
              key={c}
              type="button"
              className={cn("btn btn-mini", caminho === c && "btn-primario")}
              onClick={() => {
                setCaminho(c === caminho ? null : c);
                setEspecializacao(null);
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* especializacoes */}
        {caminho ? (
          <div className="flex flex-wrap gap-1.5 border-t border-line-soft pt-3">
            <button
              type="button"
              className={cn("btn btn-mini", !especializacao && "btn-primario")}
              onClick={() => setEspecializacao(null)}
            >
              Todas
            </button>
            {especializacoes.map((e) => (
              <button
                key={e}
                type="button"
                className={cn("btn btn-mini", especializacao === e && "btn-primario")}
                onClick={() => setEspecializacao(e === especializacao ? null : e)}
              >
                {e}
              </button>
            ))}
          </div>
        ) : null}

        <input
          className="campo campo-caixa text-[13px]"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar habilidade pelo nome…"
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          {/* lista filtrada */}
          <div className="flex max-h-[52vh] flex-col gap-2.5 overflow-y-auto pr-1">
            {filtradas.length === 0 ? (
              <p className="px-2 py-8 text-center text-[12.5px] text-faint">
                Nenhuma habilidade encontrada.
              </p>
            ) : (
              filtradas.map((c) => {
                const sel = selecao[c.id];
                return (
                  <Cartao
                    key={c.id}
                    onClick={() => alternarBase(c)}
                    className={cn(
                      "cursor-pointer px-4 py-3 transition-colors",
                      sel && "border-[oklch(0.55_0.18_25_/_0.55)] bg-[oklch(0.55_0.18_25_/_0.1)]"
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="titulo flex-1 text-[14.5px] font-semibold">{c.nome}</span>
                      <Pilula>{c.especializacao}</Pilula>
                      {c.tipoAcao ? <Pilula>{c.tipoAcao}</Pilula> : null}
                      {c.custoPe ? <Pilula variante="ambar">{c.custoPe} PE</Pilula> : null}
                      {c.conjuracao ? <Pilula variante="carmim">Conjuração</Pilula> : null}
                    </div>
                    {c.efeitoResumo ? (
                      <p className="mb-2 whitespace-pre-wrap text-[12px] leading-[1.5] text-fg-dim">
                        {quebrarPontoEVirgula(c.efeitoResumo)}
                      </p>
                    ) : null}
                    {c.aprimoramentoA || c.aprimoramentoB ? (
                      <div
                        className="flex flex-wrap gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.aprimoramentoA ? (
                          <Alternador
                            ativo={Boolean(sel?.aprimA)}
                            rotulo="Aprim. I"
                            titulo={c.aprimoramentoA}
                            onChange={() => alternarAprim(c, "aprimA")}
                          />
                        ) : null}
                        {c.aprimoramentoB ? (
                          <Alternador
                            ativo={Boolean(sel?.aprimB)}
                            rotulo="Aprim. II"
                            titulo={c.aprimoramentoB}
                            onChange={() => alternarAprim(c, "aprimB")}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </Cartao>
                );
              })
            )}
          </div>

          {/* selecionadas */}
          <div className="max-h-[52vh] overflow-y-auto rounded-md border border-line-soft px-3 py-3">
            <p className="rotulo mb-2.5">Selecionadas ({idsSelecionados.length})</p>
            {idsSelecionados.length === 0 ? (
              <p className="text-[12px] text-faint">Nenhuma habilidade selecionada.</p>
            ) : (
              (() => {
                const grupos = new Map<string, Map<string, CatalogoHabilidadeItem[]>>();
                for (const c of idsSelecionados) {
                  if (!grupos.has(c.caminho)) grupos.set(c.caminho, new Map());
                  const porEsp = grupos.get(c.caminho)!;
                  if (!porEsp.has(c.especializacao)) porEsp.set(c.especializacao, []);
                  porEsp.get(c.especializacao)!.push(c);
                }
                return Array.from(grupos.entries()).map(([cam, porEsp]) => (
                  <div key={cam} className="mb-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-fg-soft">{cam}</p>
                    {Array.from(porEsp.entries()).map(([esp, itens]) => (
                      <div key={esp} className="mb-1.5 pl-2">
                        <p className="mb-0.5 text-[10.5px] uppercase tracking-[0.03em] text-faint">
                          {esp}
                        </p>
                        {itens.map((c) => {
                          const sel = selecao[c.id];
                          return (
                            <p key={c.id} className="text-[12px] text-fg-dim">
                              {c.nome}
                              {sel?.aprimA ? " · A" : ""}
                              {sel?.aprimB ? " · B" : ""}
                            </p>
                          );
                        })}
                      </div>
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
          <button type="button" className="btn btn-primario" onClick={confirmar}>
            Confirmar seleção
          </button>
        </div>
      </div>
    </Modal>
  );
}
