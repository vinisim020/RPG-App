"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cartao, Vazio } from "@/components/ui";
import { BotaoRemover, Campo } from "@/components/interativos";
import { cn } from "@/lib/utils";
import { excluirSessao, salvarSessao, type DadosSessao } from "./actions";

export type SessaoItem = { id: string; titulo: string; data: string; texto: string };

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function Sessoes({ sessoes }: { sessoes: SessaoItem[] }) {
  const router = useRouter();
  const [selecionada, setSelecionada] = useState<string | null>(sessoes[0]?.id ?? null);
  const [rascunho, setRascunho] = useState<DadosSessao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atual = sessoes.find((s) => s.id === selecionada) ?? null;
  const editando: DadosSessao =
    rascunho ??
    (atual
      ? { titulo: atual.titulo, data: atual.data.slice(0, 10), texto: atual.texto }
      : { titulo: "", data: hojeISO(), texto: "" });

  const sujo = rascunho !== null;

  function campo<K extends keyof DadosSessao>(chave: K, valor: DadosSessao[K]) {
    setRascunho({ ...editando, [chave]: valor });
    setErro(null);
  }

  function novaSessao() {
    setSelecionada(null);
    setRascunho({ titulo: "", data: hojeISO(), texto: "" });
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const { id } = await salvarSessao(selecionada, editando);
      setSelecionada(id);
      setRascunho(null);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar a sessão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <div className="flex flex-col gap-2">
        <button type="button" className="btn btn-primario mb-1" onClick={novaSessao}>
          + Nova sessão
        </button>
        {sessoes.length === 0 ? (
          <p className="px-1 text-[12.5px] text-faint">Nenhuma sessão registrada.</p>
        ) : (
          sessoes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelecionada(s.id);
                setRascunho(null);
              }}
              className={cn(
                "cartao px-3.5 py-2.5 text-left transition-colors",
                selecionada === s.id
                  ? "border-[oklch(0.55_0.18_25_/_0.5)] bg-card-hi"
                  : "hover:bg-card-hi"
              )}
            >
              <span className="block truncate text-[13.5px] font-semibold text-fg-soft">
                {s.titulo}
              </span>
              <span className="text-[11.5px] text-faint">
                {new Date(s.data).toLocaleDateString("pt-BR")}
              </span>
            </button>
          ))
        )}
      </div>

      <Cartao className="px-5 py-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Campo rotulo="Título">
            <input
              className="campo campo-caixa text-[14px]"
              value={editando.titulo}
              onChange={(e) => campo("titulo", e.target.value)}
              placeholder="Sessão 12 — A ponte quebrada"
            />
          </Campo>
          <Campo rotulo="Data">
            <input
              type="date"
              className="campo campo-caixa text-[13px]"
              value={editando.data}
              onChange={(e) => campo("data", e.target.value)}
            />
          </Campo>
        </div>

        <textarea
          rows={18}
          className="campo campo-caixa text-[13.5px] leading-[1.6]"
          value={editando.texto}
          onChange={(e) => campo("texto", e.target.value)}
          placeholder="O que aconteceu, ganchos em aberto, decisões dos jogadores…"
        />

        {erro ? <p className="mt-3 text-[12.5px] text-carmim-luz">{erro}</p> : null}

        <div className="mt-4 flex items-center gap-2 border-t border-line-soft pt-4">
          <span className="text-[12px] text-faint">
            {sujo ? "Alterações não salvas" : selecionada ? "Salvo" : "Rascunho novo"}
          </span>
          <div className="ml-auto flex gap-2">
            {selecionada ? (
              <BotaoRemover
                rotulo="Excluir sessão"
                aoConfirmar={async () => {
                  await excluirSessao(selecionada);
                  setSelecionada(null);
                  setRascunho(null);
                  router.refresh();
                }}
              />
            ) : null}
            <button
              type="button"
              className="btn btn-primario"
              onClick={salvar}
              disabled={salvando}
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </Cartao>
    </div>
  );
}
