"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cartao, Pilula, Vazio } from "@/components/ui";
import { BotaoRemover, Campo, InputNum, Modal } from "@/components/interativos";
import { ROTULO_CATEGORIA, ROTULO_TIPO_COMBATENTE, type CategoriaSer } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CombatenteEstado, EstadoCombate } from "@/lib/combate";
import {
  adicionarAvulso,
  adicionarCriatura,
  adicionarPersonagens,
  atualizarCombatente,
  avancarTurno,
  definirTurno,
  encerrarCombate,
  iniciarCombate,
  ordenarPorIniciativa,
  reiniciarRodadas,
  removerCombatente,
  reordenar,
} from "./actions";

type OpcaoPersonagem = { id: string; nome: string; jogador: string };
type OpcaoCriatura = { id: string; nome: string; categoria: string };

const INTERVALO_POLL = 4000;

export function Iniciativa({
  inicial,
  ehMestre,
  personagens,
  criaturas,
}: {
  inicial: EstadoCombate;
  ehMestre: boolean;
  personagens: OpcaoPersonagem[];
  criaturas: OpcaoCriatura[];
}) {
  const [combate, setCombate] = useState<EstadoCombate>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const ocupado = useRef(false);
  const [adicionando, setAdicionando] = useState(false);

  const buscar = useCallback(async () => {
    if (ocupado.current) return;
    try {
      const r = await fetch("/api/iniciativa", { cache: "no-store" });
      if (!r.ok) return;
      const json = (await r.json()) as { combate: EstadoCombate };
      if (!ocupado.current) setCombate(json.combate);
    } catch {
      /* rede instável: tenta de novo no proximo ciclo */
    }
  }, []);

  useEffect(() => {
    const t = setInterval(buscar, INTERVALO_POLL);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") buscar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [buscar]);

  const executar = useCallback(
    async (fn: () => Promise<unknown>) => {
      ocupado.current = true;
      setErro(null);
      try {
        await fn();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha ao atualizar o combate.");
      } finally {
        ocupado.current = false;
        await buscar();
      }
    },
    [buscar]
  );

  // -------------------------------------------------------------- sem combate
  if (!combate) {
    return (
      <Vazio>
        {ehMestre ? (
          <div className="flex flex-col items-center gap-4">
            <p>Nenhum combate em andamento.</p>
            <button
              type="button"
              className="btn btn-primario"
              onClick={() => executar(() => iniciarCombate())}
            >
              Iniciar combate
            </button>
          </div>
        ) : (
          <p>Nenhum combate em andamento. Esta tela atualiza sozinha quando o mestre iniciar.</p>
        )}
      </Vazio>
    );
  }

  const lista = combate.combatentes;

  const moverLocal = (de: number, para: number) => {
    if (de === para || de < 0 || para < 0 || de >= lista.length || para >= lista.length) return;
    const arr = [...lista];
    const [item] = arr.splice(de, 1);
    arr.splice(para, 0, item);
    setCombate({ ...combate, combatentes: arr.map((c, i) => ({ ...c, ordem: i })) });
    executar(() => reordenar(arr.map((c) => c.id)));
  };

  return (
    <>
      {/* barra de controle -------------------------------------------------- */}
      <Cartao className="mb-5 flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="rotulo">Rodada</span>
          <span className="titulo text-[22px]">{combate.rodadaAtual}</span>
        </div>

        {ehMestre ? (
          <>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-mini"
                onClick={() => executar(() => avancarTurno(-1))}
              >
                &larr; Anterior
              </button>
              <button
                type="button"
                className="btn btn-primario btn-mini"
                onClick={() => executar(() => avancarTurno(1))}
              >
                Próximo turno &rarr;
              </button>
              <button
                type="button"
                className="btn btn-mini"
                onClick={() => executar(() => ordenarPorIniciativa())}
                title="Reordena do maior para o menor valor de iniciativa"
              >
                Ordenar por iniciativa
              </button>
              <button
                type="button"
                className="btn btn-mini"
                onClick={() => executar(() => reiniciarRodadas())}
              >
                Reiniciar rodadas
              </button>
              <BotaoRemover
                rotulo="Encerrar combate"
                aoConfirmar={() => executar(() => encerrarCombate())}
              />
            </div>
          </>
        ) : (
          <span className="ml-auto text-[12px] text-faint">
            Somente leitura &middot; atualiza automaticamente
          </span>
        )}
      </Cartao>

      {erro ? <p className="mb-3 text-[12.5px] text-carmim-luz">{erro}</p> : null}

      {/* lista -------------------------------------------------------------- */}
      <div className="flex max-w-[860px] flex-col gap-2.5">
        {lista.length === 0 ? (
          <Vazio>Nenhum combatente na ordem ainda.</Vazio>
        ) : (
          lista.map((c, i) => (
            <LinhaCombatente
              key={c.id}
              c={c}
              indice={i}
              atual={i === combate.turnoAtualIndex}
              ehMestre={ehMestre}
              onMover={moverLocal}
              onDefinirTurno={() => executar(() => definirTurno(i))}
              onPatch={(patch) => executar(() => atualizarCombatente(c.id, patch))}
              onRemover={() => executar(() => removerCombatente(c.id))}
            />
          ))
        )}
      </div>

      {ehMestre ? (
        <button
          type="button"
          className="btn btn-fantasma mt-4 w-full max-w-[860px]"
          onClick={() => setAdicionando(true)}
        >
          + Adicionar combatente
        </button>
      ) : null}

      <ModalAdicionar
        aberto={adicionando}
        aoFechar={() => setAdicionando(false)}
        personagens={personagens}
        criaturas={criaturas}
        executar={executar}
      />
    </>
  );
}

/* ------------------------------------------------------------------ linha */

function LinhaCombatente({
  c,
  indice,
  atual,
  ehMestre,
  onMover,
  onDefinirTurno,
  onPatch,
  onRemover,
}: {
  c: CombatenteEstado;
  indice: number;
  atual: boolean;
  ehMestre: boolean;
  onMover: (de: number, para: number) => void;
  onDefinirTurno: () => void;
  onPatch: (patch: Record<string, number | string>) => void;
  onRemover: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const mostraRecursos = ehMestre || c.tipo === "PERSONAGEM";

  return (
    <div
      draggable={ehMestre}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(indice));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (ehMestre) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!ehMestre) return;
        e.preventDefault();
        const de = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isFinite(de)) onMover(de, indice);
      }}
      className={cn(
        "cartao px-3.5 py-2.5 transition-colors",
        atual && "bg-card-hi border-[oklch(0.55_0.18_25_/_0.5)]"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="w-5 font-mono text-[13px] text-faint">{indice + 1}</span>

        <span
          className="h-[34px] w-[34px] flex-none rounded-full border border-[oklch(0.4_0.03_30)]"
          style={{
            background:
              c.tipo === "PERSONAGEM"
                ? "oklch(0.3 0.05 25)"
                : c.tipo === "CRIATURA"
                  ? "oklch(0.26 0.02 90)"
                  : "oklch(0.24 0.01 30)",
          }}
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={ehMestre ? onDefinirTurno : undefined}
            className={cn(
              "block max-w-full truncate text-left text-[14.5px] font-semibold text-fg-strong",
              ehMestre && "cursor-pointer hover:text-carmim-luz"
            )}
            title={ehMestre ? "Marcar como turno atual" : undefined}
          >
            {c.nomeExibicao}
          </button>
          <span className="text-[11px] text-muted">
            {ROTULO_TIPO_COMBATENTE[c.tipo] ?? c.tipo}
            {mostraRecursos ? (
              <span className="sm:hidden">
                {" · "}
                <span className="tabular-nums font-semibold text-fg-soft">{c.pvAtual}</span>
                <span className="text-faint">/{c.pvMax}</span> PV
                {" · "}
                <span className="tabular-nums font-semibold text-ambar">{c.peAtual}</span>
                <span className="text-faint">/{c.peMax}</span> PE
              </span>
            ) : null}
          </span>
        </div>

        {mostraRecursos ? (
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-[12px] tabular-nums text-muted">
              <span className="font-semibold text-fg-soft">{c.pvAtual}</span>
              <span className="text-faint">/{c.pvMax}</span> PV
              {c.pvTemp ? <span className="text-carmim-luz"> +{c.pvTemp}</span> : null}
            </span>
            <span className="text-[12px] tabular-nums text-muted">
              <span className="font-semibold text-ambar">{c.peAtual}</span>
              <span className="text-faint">/{c.peMax}</span> PE
            </span>
          </div>
        ) : null}

        {ehMestre ? (
          <div className="flex items-center gap-1.5">
            <span className="rotulo hidden sm:inline">Inic.</span>
            <InputNum
              valor={c.valorIniciativa}
              onChange={(v) => onPatch({ valorIniciativa: v })}
              className="campo-caixa w-[52px] text-center text-[13px]"
            />
          </div>
        ) : null}

        {atual ? <Pilula variante="carmim">ATUAL</Pilula> : null}

        {ehMestre ? (
          <>
            <button
              type="button"
              className="btn btn-mini px-2"
              onClick={() => setExpandido((v) => !v)}
              title="Editar PV/PE e anotação"
            >
              {expandido ? "−" : "…"}
            </button>
            <div className="flex flex-col">
              <button
                type="button"
                className="px-1 text-[10px] leading-tight text-faint hover:text-fg-soft"
                onClick={() => onMover(indice, indice - 1)}
                title="Subir"
              >
                &#9650;
              </button>
              <button
                type="button"
                className="px-1 text-[10px] leading-tight text-faint hover:text-fg-soft"
                onClick={() => onMover(indice, indice + 1)}
                title="Descer"
              >
                &#9660;
              </button>
            </div>
          </>
        ) : null}
      </div>

      {ehMestre && expandido ? (
        <div className="mt-3 grid gap-3 border-t border-line-soft pt-3 sm:grid-cols-[repeat(4,minmax(0,1fr))_2fr]">
          <Campo rotulo="PV atual">
            <InputNum
              valor={c.pvAtual}
              onChange={(v) => onPatch({ pvAtual: v })}
              className="campo-caixa text-[13px]"
            />
          </Campo>
          <Campo rotulo="PV temp.">
            <InputNum
              valor={c.pvTemp}
              onChange={(v) => onPatch({ pvTemp: v })}
              className="campo-caixa text-[13px]"
            />
          </Campo>
          <Campo rotulo="PE atual">
            <InputNum
              valor={c.peAtual}
              onChange={(v) => onPatch({ peAtual: v })}
              className="campo-caixa text-[13px]"
            />
          </Campo>
          <Campo rotulo="PE temp.">
            <InputNum
              valor={c.peTemp}
              onChange={(v) => onPatch({ peTemp: v })}
              className="campo-caixa text-[13px]"
            />
          </Campo>
          <Campo rotulo="Anotação">
            <input
              className="campo campo-caixa text-[13px]"
              defaultValue={c.anotacao}
              onBlur={(e) => onPatch({ anotacao: e.target.value })}
              placeholder="condições, efeitos…"
            />
          </Campo>
          <div className="sm:col-span-5 flex justify-end">
            <BotaoRemover rotulo="Remover do combate" aoConfirmar={onRemover} />
          </div>
        </div>
      ) : null}

      {!expandido && c.anotacao ? (
        <p className="mt-1.5 pl-[62px] text-[11.5px] text-carmim-suave">{c.anotacao}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ modal add */

function ModalAdicionar({
  aberto,
  aoFechar,
  personagens,
  criaturas,
  executar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  personagens: OpcaoPersonagem[];
  criaturas: OpcaoCriatura[];
  executar: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [aba, setAba] = useState<"personagens" | "criaturas" | "avulso">("personagens");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [criaturaId, setCriaturaId] = useState<string>(criaturas[0]?.id ?? "");
  const [quantidade, setQuantidade] = useState(1);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [pvAvulso, setPvAvulso] = useState(0);
  const [peAvulso, setPeAvulso] = useState(0);
  const [busca, setBusca] = useState("");

  const criaturasFiltradas = criaturas.filter((c) =>
    c.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  const abas: { chave: typeof aba; rotulo: string }[] = [
    { chave: "personagens", rotulo: "Personagens" },
    { chave: "criaturas", rotulo: "Criaturas" },
    { chave: "avulso", rotulo: "NPC avulso" },
  ];

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Adicionar combatente" largura={600}>
      <div className="mb-4 flex gap-1.5">
        {abas.map((a) => (
          <button
            key={a.chave}
            type="button"
            onClick={() => setAba(a.chave)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12.5px]",
              aba === a.chave
                ? "bg-[oklch(0.55_0.18_25_/_0.16)] text-[oklch(0.85_0.03_30)]"
                : "text-muted hover:text-fg-soft"
            )}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === "personagens" ? (
        <div className="flex flex-col gap-2">
          {personagens.length === 0 ? (
            <p className="text-[12.5px] text-faint">Nenhum personagem cadastrado.</p>
          ) : (
            personagens.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-line-soft px-3 py-2 hover:bg-card-hi"
              >
                <input
                  type="checkbox"
                  checked={selecionados.includes(p.id)}
                  onChange={(e) =>
                    setSelecionados((s) =>
                      e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)
                    )
                  }
                />
                <span className="text-[13.5px] text-fg-soft">{p.nome}</span>
                <span className="ml-auto text-[11.5px] text-faint">{p.jogador}</span>
              </label>
            ))
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="btn" onClick={aoFechar}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              disabled={selecionados.length === 0}
              onClick={async () => {
                await executar(() => adicionarPersonagens(selecionados));
                setSelecionados([]);
                aoFechar();
              }}
            >
              Adicionar {selecionados.length > 0 ? `(${selecionados.length})` : ""}
            </button>
          </div>
        </div>
      ) : null}

      {aba === "criaturas" ? (
        <div className="flex flex-col gap-3">
          <input
            className="campo campo-caixa text-[13px]"
            placeholder="Buscar criatura…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="max-h-[260px] overflow-y-auto rounded-md border border-line-soft">
            {criaturasFiltradas.length === 0 ? (
              <p className="px-3 py-4 text-[12.5px] text-faint">
                Nenhuma criatura no bestiário.
              </p>
            ) : (
              criaturasFiltradas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCriaturaId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-line-soft px-3 py-2 text-left last:border-0",
                    criaturaId === c.id ? "bg-[oklch(0.55_0.18_25_/_0.14)]" : "hover:bg-card-hi"
                  )}
                >
                  <span className="text-[13.5px] text-fg-soft">{c.nome}</span>
                  <span className="ml-auto text-[11px] text-faint">
                    {ROTULO_CATEGORIA[c.categoria as CategoriaSer] ?? c.categoria}
                  </span>
                </button>
              ))
            )}
          </div>
          <Campo rotulo="Quantidade">
            <InputNum
              valor={quantidade}
              min={1}
              max={20}
              onChange={setQuantidade}
              className="campo-caixa w-[90px] text-[13px]"
            />
          </Campo>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={aoFechar}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              disabled={!criaturaId}
              onClick={async () => {
                await executar(() => adicionarCriatura(criaturaId, quantidade));
                aoFechar();
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
      ) : null}

      {aba === "avulso" ? (
        <div className="flex flex-col gap-3">
          <Campo rotulo="Nome">
            <input
              className="campo campo-caixa text-[13px]"
              value={nomeAvulso}
              onChange={(e) => setNomeAvulso(e.target.value)}
              placeholder="Guarda da estrada"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Pontos de Vida">
              <InputNum
                valor={pvAvulso}
                min={0}
                onChange={setPvAvulso}
                className="campo-caixa text-[13px]"
              />
            </Campo>
            <Campo rotulo="Pontos de Energia">
              <InputNum
                valor={peAvulso}
                min={0}
                onChange={setPeAvulso}
                className="campo-caixa text-[13px]"
              />
            </Campo>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={aoFechar}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              disabled={!nomeAvulso.trim()}
              onClick={async () => {
                await executar(() => adicionarAvulso(nomeAvulso, pvAvulso, peAvulso));
                setNomeAvulso("");
                setPvAvulso(0);
                setPeAvulso(0);
                aoFechar();
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
