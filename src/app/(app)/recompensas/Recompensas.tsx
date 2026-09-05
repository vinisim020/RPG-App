"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cartao, Pilula, TituloSecao, Vazio } from "@/components/ui";
import { BotaoRemover, Campo, InputNum, Modal } from "@/components/interativos";
import {
  entregarRecompensa,
  excluirRecompensa,
  reverterEntrega,
  salvarRecompensa,
  type DadosRecompensa,
} from "./actions";

export type RecompensaItem = DadosRecompensa & {
  id: string;
  status: "PENDENTE" | "ENTREGUE";
  entregueEm: string | null;
  destinoNome: string | null;
};

type Personagem = { id: string; nome: string; jogador: string };

const VAZIA: DadosRecompensa = {
  nome: "",
  descricao: "",
  categoria: "",
  quantidade: 1,
  peso: "",
  personagemDestinoId: null,
};

export function Recompensas({
  pendentes,
  entregues,
  personagens,
}: {
  pendentes: RecompensaItem[];
  entregues: RecompensaItem[];
  personagens: Personagem[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<DadosRecompensa>(VAZIA);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // destino escolhido na hora da entrega, para recompensas "a definir"
  const [destinoRapido, setDestinoRapido] = useState<Record<string, string>>({});

  function campo<K extends keyof DadosRecompensa>(chave: K, valor: DadosRecompensa[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function executar(fn: () => Promise<{ erro?: string } | void>) {
    setOcupado(true);
    setErro(null);
    try {
      const r = await fn();
      if (r && r.erro) {
        setErro(r.erro);
        return;
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na operação.");
    } finally {
      setOcupado(false);
    }
  }

  function abrirNova() {
    setEditandoId(null);
    setForm(VAZIA);
    setErro(null);
    setAberto(true);
  }

  function abrirEdicao(r: RecompensaItem) {
    setEditandoId(r.id);
    setForm({
      nome: r.nome,
      descricao: r.descricao,
      categoria: r.categoria,
      quantidade: r.quantidade,
      peso: r.peso,
      personagemDestinoId: r.personagemDestinoId,
    });
    setErro(null);
    setAberto(true);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" className="btn btn-primario" onClick={abrirNova}>
          + Nova recompensa
        </button>
      </div>

      {erro ? <p className="mb-3 text-[12.5px] text-carmim-luz">{erro}</p> : null}

      <TituloSecao>Pendentes de entrega</TituloSecao>
      {pendentes.length === 0 ? (
        <Vazio>Nada pendente. Monte as recompensas da próxima sessão aqui.</Vazio>
      ) : (
        <div className="mb-9 flex flex-col gap-3">
          {pendentes.map((r) => (
            <Cartao key={r.id} className="px-4 py-3.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="titulo text-[17px] font-semibold">{r.nome}</span>
                {r.quantidade > 1 ? <Pilula>x{r.quantidade}</Pilula> : null}
                {r.categoria ? <Pilula>{r.categoria}</Pilula> : null}
                {r.peso ? <span className="text-[11.5px] text-faint">{r.peso}</span> : null}
                <span className="ml-auto text-[12px] text-muted">
                  {r.destinoNome ? (
                    <>
                      Para <span className="text-fg-soft">{r.destinoNome}</span>
                    </>
                  ) : (
                    <span className="text-carmim-suave">destino a definir</span>
                  )}
                </span>
              </div>

              {r.descricao ? (
                <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-[1.5] text-fg-dim">
                  {r.descricao}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
                {!r.personagemDestinoId ? (
                  <select
                    className="campo campo-caixa w-auto text-[12.5px]"
                    value={destinoRapido[r.id] ?? ""}
                    onChange={(e) =>
                      setDestinoRapido((d) => ({ ...d, [r.id]: e.target.value }))
                    }
                  >
                    <option value="">Escolher personagem…</option>
                    {personagens.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {p.jogador}
                      </option>
                    ))}
                  </select>
                ) : null}

                <button
                  type="button"
                  className="btn btn-primario btn-mini"
                  disabled={
                    ocupado || (!r.personagemDestinoId && !destinoRapido[r.id])
                  }
                  onClick={() =>
                    executar(() => entregarRecompensa(r.id, destinoRapido[r.id]))
                  }
                  title="Envia o item para o inventário do personagem"
                >
                  Entregar
                </button>
                <button
                  type="button"
                  className="btn btn-mini"
                  onClick={() => abrirEdicao(r)}
                >
                  Editar
                </button>
                <BotaoRemover
                  className="ml-auto"
                  aoConfirmar={() => executar(() => excluirRecompensa(r.id))}
                />
              </div>
            </Cartao>
          ))}
        </div>
      )}

      <TituloSecao>Histórico de entregas</TituloSecao>
      {entregues.length === 0 ? (
        <Vazio>Nenhuma recompensa entregue ainda.</Vazio>
      ) : (
        <Cartao className="overflow-hidden">
          {entregues.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-0"
            >
              <span className="text-[13.5px] text-fg-soft">{r.nome}</span>
              {r.quantidade > 1 ? (
                <span className="text-[11.5px] text-faint">x{r.quantidade}</span>
              ) : null}
              <span className="text-[12px] text-muted">
                para <span className="text-fg-soft">{r.destinoNome ?? "—"}</span>
              </span>
              <span className="ml-auto text-[11.5px] text-faint">
                {r.entregueEm ? new Date(r.entregueEm).toLocaleDateString("pt-BR") : ""}
              </span>
              <button
                type="button"
                className="btn btn-mini"
                onClick={() => executar(() => reverterEntrega(r.id))}
                title="Volta para a lista de pendentes (não remove o item do inventário)"
              >
                Reverter
              </button>
            </div>
          ))}
        </Cartao>
      )}

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={editandoId ? "Editar recompensa" : "Nova recompensa"}
        largura={560}
      >
        <div className="flex flex-col gap-3.5">
          <div className="grid gap-3 sm:grid-cols-[2fr_0.7fr_1fr]">
            <Campo rotulo="Nome">
              <input
                autoFocus
                className="campo campo-caixa text-[13px]"
                value={form.nome}
                onChange={(e) => campo("nome", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Quantidade">
              <InputNum
                valor={form.quantidade}
                min={1}
                onChange={(v) => campo("quantidade", v)}
                className="campo-caixa text-[13px]"
              />
            </Campo>
            <Campo rotulo="Peso">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.peso}
                onChange={(e) => campo("peso", e.target.value)}
              />
            </Campo>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Categoria">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.categoria}
                onChange={(e) => campo("categoria", e.target.value)}
                placeholder="Arma, Relíquia, Moeda…"
              />
            </Campo>
            <Campo rotulo="Personagem de destino">
              <select
                className="campo campo-caixa text-[13px]"
                value={form.personagemDestinoId ?? ""}
                onChange={(e) => campo("personagemDestinoId", e.target.value || null)}
              >
                <option value="">A definir</option>
                {personagens.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.jogador}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo rotulo="Descrição">
            <textarea
              rows={4}
              className="campo campo-caixa text-[13px]"
              value={form.descricao}
              onChange={(e) => campo("descricao", e.target.value)}
            />
          </Campo>

          <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
            <button type="button" className="btn" onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              disabled={ocupado}
              onClick={async () => {
                await executar(() => salvarRecompensa(editandoId, form));
                setAberto(false);
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
