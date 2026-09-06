"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cartao, Pilula, TituloSecao, Vazio } from "@/components/ui";
import { BotaoRemover, Campo, InputNum, Modal } from "@/components/interativos";
import { cn } from "@/lib/utils";
import {
  criarGrupo,
  excluirGrupo,
  excluirSessao,
  renomearGrupo,
  salvarIntegrantes,
  salvarSessaoCompleta,
  type DadosIntegrante,
} from "./actions";
import { carregarGrupoCombate } from "../iniciativa/actions";

export type BlocoItem = { titulo: string; texto: string };
export type IntegranteItem = {
  criaturaId: string | null;
  nomeCriatura: string | null;
  nomeAvulso: string;
  pvAvulso: number;
  peAvulso: number;
  quantidade: number;
};
export type GrupoItem = {
  id: string;
  nome: string;
  anotacoes: string;
  integrantes: IntegranteItem[];
};
export type SessaoItem = {
  id: string;
  titulo: string;
  data: string;
  blocos: BlocoItem[];
  grupos: GrupoItem[];
};
type CriaturaOpcao = { id: string; nome: string; pvMax: number; peMax: number };

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

const RASCUNHO_VAZIO = { titulo: "", data: hojeISO(), blocos: [] as BlocoItem[] };

export function Sessoes({
  sessoes,
  criaturas,
}: {
  sessoes: SessaoItem[];
  criaturas: CriaturaOpcao[];
}) {
  const router = useRouter();
  const [selecionada, setSelecionada] = useState<string | null>(sessoes[0]?.id ?? null);
  const [rascunho, setRascunho] = useState<{
    titulo: string;
    data: string;
    blocos: BlocoItem[];
  } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupadoGrupo, setOcupadoGrupo] = useState(false);
  const [criandoGrupo, setCriandoGrupo] = useState(false);
  const [nomeNovoGrupo, setNomeNovoGrupo] = useState("");

  const atual = sessoes.find((s) => s.id === selecionada) ?? null;
  const editando = rascunho ?? {
    titulo: atual?.titulo ?? "",
    data: atual ? atual.data.slice(0, 10) : hojeISO(),
    blocos: atual?.blocos ?? [],
  };
  const sujo = rascunho !== null;

  function mudar(fn: (p: typeof editando) => typeof editando) {
    setRascunho(fn(editando));
    setErro(null);
  }

  function novaSessao() {
    setSelecionada(null);
    setRascunho({ ...RASCUNHO_VAZIO });
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const { id } = await salvarSessaoCompleta(selecionada, editando);
      setSelecionada(id);
      setRascunho(null);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar a sessão.");
    } finally {
      setSalvando(false);
    }
  }

  async function executarGrupo(fn: () => Promise<unknown>) {
    setOcupadoGrupo(true);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na operação do grupo de combate.");
    } finally {
      setOcupadoGrupo(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
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
                selecionada === s.id && !sujo
                  ? "border-[oklch(0.55_0.18_25_/_0.5)] bg-card-hi"
                  : "hover:bg-card-hi"
              )}
            >
              <span className="block truncate text-[13.5px] font-semibold text-fg-soft">
                {s.titulo}
              </span>
              <span className="text-[11.5px] text-faint">
                {new Date(s.data).toLocaleDateString("pt-BR")}
                {s.grupos.length > 0 ? ` · ${s.grupos.length} grupo(s)` : ""}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Cartao className="px-5 py-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
            <Campo rotulo="Título">
              <input
                className="campo campo-caixa text-[14px]"
                value={editando.titulo}
                onChange={(e) => mudar((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Sessão 12 — A ponte quebrada"
              />
            </Campo>
            <Campo rotulo="Data">
              <input
                type="date"
                className="campo campo-caixa text-[13px]"
                value={editando.data}
                onChange={(e) => mudar((p) => ({ ...p, data: e.target.value }))}
              />
            </Campo>
          </div>

          <div className="mb-2 flex items-baseline justify-between">
            <span className="rotulo">Blocos de anotação</span>
            <button
              type="button"
              className="btn btn-mini"
              onClick={() =>
                mudar((p) => ({ ...p, blocos: [...p.blocos, { titulo: "", texto: "" }] }))
              }
            >
              + Bloco
            </button>
          </div>

          {editando.blocos.length === 0 ? (
            <p className="mb-4 rounded-md bg-[oklch(0.15_0.014_28)] px-3 py-4 text-center text-[12.5px] text-faint">
              Nenhum bloco ainda — divida a preparação em seções (resumo, ganchos, NPCs…).
            </p>
          ) : (
            <div className="mb-4 flex flex-col gap-3">
              {editando.blocos.map((b, i) => (
                <div key={i} className="rounded-md border border-line-soft px-3 py-2.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <input
                      className="campo text-[13px] font-semibold"
                      value={b.titulo}
                      onChange={(e) =>
                        mudar((p) => {
                          const arr = [...p.blocos];
                          arr[i] = { ...arr[i], titulo: e.target.value };
                          return { ...p, blocos: arr };
                        })
                      }
                      placeholder="Título do bloco (Resumo, Ganchos, NPCs…)"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-mini px-2"
                        onClick={() =>
                          mudar((p) => {
                            if (i === 0) return p;
                            const arr = [...p.blocos];
                            [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                            return { ...p, blocos: arr };
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-mini px-2"
                        onClick={() =>
                          mudar((p) => {
                            if (i === p.blocos.length - 1) return p;
                            const arr = [...p.blocos];
                            [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                            return { ...p, blocos: arr };
                          })
                        }
                      >
                        ↓
                      </button>
                      <BotaoRemover
                        rotulo="×"
                        aoConfirmar={() =>
                          mudar((p) => ({
                            ...p,
                            blocos: p.blocos.filter((_, k) => k !== i),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    className="campo campo-caixa text-[13px] leading-[1.55]"
                    value={b.texto}
                    onChange={(e) =>
                      mudar((p) => {
                        const arr = [...p.blocos];
                        arr[i] = { ...arr[i], texto: e.target.value };
                        return { ...p, blocos: arr };
                      })
                    }
                    placeholder="Conteúdo deste bloco…"
                  />
                </div>
              ))}
            </div>
          )}

          {erro ? <p className="mb-3 text-[12.5px] text-carmim-luz">{erro}</p> : null}

          <div className="flex items-center gap-2 border-t border-line-soft pt-4">
            <span className="text-[12px] text-faint">
              {sujo ? "Alterações não salvas" : atual ? "Salvo" : "Rascunho novo"}
            </span>
            <div className="ml-auto flex gap-2">
              {atual ? (
                <BotaoRemover
                  rotulo="Excluir sessão"
                  aoConfirmar={async () => {
                    await excluirSessao(atual.id);
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
                {salvando ? "Salvando…" : "Salvar sessão"}
              </button>
            </div>
          </div>
        </Cartao>

        {atual ? (
          <div>
            <TituloSecao
              acao={
                criandoGrupo ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      className="campo campo-caixa w-[220px] text-[12.5px]"
                      value={nomeNovoGrupo}
                      onChange={(e) => setNomeNovoGrupo(e.target.value)}
                      placeholder="Nome do grupo"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setCriandoGrupo(false);
                          setNomeNovoGrupo("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setCriandoGrupo(false);
                        setNomeNovoGrupo("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primario btn-mini"
                      disabled={ocupadoGrupo || !nomeNovoGrupo.trim()}
                      onClick={() =>
                        executarGrupo(async () => {
                          await criarGrupo(atual.id, nomeNovoGrupo);
                          setCriandoGrupo(false);
                          setNomeNovoGrupo("");
                        })
                      }
                    >
                      Criar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-mini"
                    onClick={() => setCriandoGrupo(true)}
                  >
                    + Grupo de combate
                  </button>
                )
              }
            >
              Grupos de combate
            </TituloSecao>

            {atual.grupos.length === 0 ? (
              <Vazio>
                Monte aqui os inimigos desta sessão — na hora do combate, um clique manda todos
                para a Iniciativa.
              </Vazio>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {atual.grupos.map((g) => (
                  <CardGrupo
                    key={g.id}
                    grupo={g}
                    criaturas={criaturas}
                    ocupado={ocupadoGrupo}
                    onCarregar={() =>
                      executarGrupo(async () => {
                        await carregarGrupoCombate(g.id);
                        router.push("/iniciativa");
                      })
                    }
                    onExcluir={() => executarGrupo(() => excluirGrupo(g.id))}
                    onSalvo={() => router.refresh()}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[12.5px] text-faint">
            Salve a sessão para poder montar grupos de combate para ela.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- card grupo */

function CardGrupo({
  grupo,
  criaturas,
  ocupado,
  onCarregar,
  onExcluir,
  onSalvo,
}: {
  grupo: GrupoItem;
  criaturas: CriaturaOpcao[];
  ocupado: boolean;
  onCarregar: () => void;
  onExcluir: () => void;
  onSalvo: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(grupo.nome);
  const [anotacoes, setAnotacoes] = useState(grupo.anotacoes);
  const [integrantes, setIntegrantes] = useState<IntegranteItem[]>(grupo.integrantes);
  const total = grupo.integrantes.reduce((s, it) => s + it.quantidade, 0);

  function abrirEdicao() {
    setNome(grupo.nome);
    setAnotacoes(grupo.anotacoes);
    setIntegrantes(grupo.integrantes);
    setAberto(true);
  }

  return (
    <Cartao className="px-4 py-3.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="titulo text-[16px] font-semibold">{grupo.nome}</span>
        <Pilula>{total} {total === 1 ? "combatente" : "combatentes"}</Pilula>
      </div>

      {grupo.integrantes.length === 0 ? (
        <p className="mb-2.5 text-[12px] text-faint">Nenhum integrante ainda.</p>
      ) : (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {grupo.integrantes.map((it, i) => (
            <Pilula key={i}>
              {it.nomeCriatura ?? (it.nomeAvulso || "NPC")}
              {it.quantidade > 1 ? ` ×${it.quantidade}` : ""}
            </Pilula>
          ))}
        </div>
      )}

      {grupo.anotacoes ? (
        <p className="mb-2.5 whitespace-pre-wrap text-[12px] text-fg-dim">{grupo.anotacoes}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-line-soft pt-3">
        <button
          type="button"
          className="btn btn-primario btn-mini"
          disabled={ocupado || grupo.integrantes.length === 0}
          onClick={onCarregar}
          title="Adiciona todos os integrantes na Iniciativa"
        >
          Carregar na Iniciativa
        </button>
        <button type="button" className="btn btn-mini" onClick={abrirEdicao}>
          Editar
        </button>
        <BotaoRemover className="ml-auto" aoConfirmar={onExcluir} />
      </div>

      <ModalGrupo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        grupoId={grupo.id}
        nome={nome}
        setNome={setNome}
        anotacoes={anotacoes}
        setAnotacoes={setAnotacoes}
        integrantes={integrantes}
        setIntegrantes={setIntegrantes}
        criaturas={criaturas}
        aoSalvar={onSalvo}
      />
    </Cartao>
  );
}

/* --------------------------------------------------------- modal integrantes */

function novoIntegranteCriatura(c: CriaturaOpcao): IntegranteItem {
  return {
    criaturaId: c.id,
    nomeCriatura: c.nome,
    nomeAvulso: "",
    pvAvulso: c.pvMax,
    peAvulso: c.peMax,
    quantidade: 1,
  };
}

function novoIntegranteAvulso(): IntegranteItem {
  return {
    criaturaId: null,
    nomeCriatura: null,
    nomeAvulso: "",
    pvAvulso: 0,
    peAvulso: 0,
    quantidade: 1,
  };
}

function ModalGrupo({
  aberto,
  aoFechar,
  grupoId,
  nome,
  setNome,
  anotacoes,
  setAnotacoes,
  integrantes,
  setIntegrantes,
  criaturas,
  aoSalvar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  grupoId: string;
  nome: string;
  setNome: (v: string) => void;
  anotacoes: string;
  setAnotacoes: (v: string) => void;
  integrantes: IntegranteItem[];
  setIntegrantes: React.Dispatch<React.SetStateAction<IntegranteItem[]>>;
  criaturas: CriaturaOpcao[];
  aoSalvar: () => void;
}) {
  const [criaturaEscolhida, setCriaturaEscolhida] = useState(criaturas[0]?.id ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function patch(i: number, p: Partial<IntegranteItem>) {
    setIntegrantes((arr) => {
      const novo = [...arr];
      novo[i] = { ...novo[i], ...p };
      return novo;
    });
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await renomearGrupo(grupoId, nome, anotacoes);
      const dados: DadosIntegrante[] = integrantes.map((it) => ({
        criaturaId: it.criaturaId,
        nomeAvulso: it.nomeAvulso,
        pvAvulso: it.pvAvulso,
        peAvulso: it.peAvulso,
        quantidade: it.quantidade,
      }));
      await salvarIntegrantes(grupoId, dados);
      aoSalvar();
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar o grupo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Editar grupo de combate" largura={620}>
      <div className="flex flex-col gap-4">
        <Campo rotulo="Nome do grupo">
          <input
            autoFocus
            className="campo campo-caixa text-[13px]"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </Campo>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rotulo">Integrantes</span>
            <select
              className="campo campo-caixa ml-auto w-auto text-[12.5px]"
              value={criaturaEscolhida}
              onChange={(e) => setCriaturaEscolhida(e.target.value)}
            >
              {criaturas.length === 0 ? <option value="">Bestiário vazio</option> : null}
              {criaturas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-mini"
              disabled={!criaturaEscolhida}
              onClick={() => {
                const c = criaturas.find((x) => x.id === criaturaEscolhida);
                if (c) setIntegrantes((arr) => [...arr, novoIntegranteCriatura(c)]);
              }}
            >
              + Do bestiário
            </button>
            <button
              type="button"
              className="btn btn-mini"
              onClick={() => setIntegrantes((arr) => [...arr, novoIntegranteAvulso()])}
            >
              + NPC avulso
            </button>
          </div>

          {integrantes.length === 0 ? (
            <p className="rounded-md bg-[oklch(0.15_0.014_28)] px-3 py-4 text-center text-[12.5px] text-faint">
              Nenhum integrante ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {integrantes.map((it, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-line-soft px-3 py-2"
                >
                  {it.criaturaId ? (
                    <span className="min-w-[120px] flex-1 text-[13px] text-fg-soft">
                      {it.nomeCriatura}
                    </span>
                  ) : (
                    <input
                      className="campo min-w-[120px] flex-1 text-[13px]"
                      value={it.nomeAvulso}
                      onChange={(e) => patch(i, { nomeAvulso: e.target.value })}
                      placeholder="Nome do NPC"
                    />
                  )}
                  {!it.criaturaId ? (
                    <>
                      <InputNum
                        valor={it.pvAvulso}
                        min={0}
                        onChange={(v) => patch(i, { pvAvulso: v })}
                        className="campo-caixa w-[56px] text-center text-[12px]"
                      />
                      <span className="text-[10.5px] text-faint">PV</span>
                      <InputNum
                        valor={it.peAvulso}
                        min={0}
                        onChange={(v) => patch(i, { peAvulso: v })}
                        className="campo-caixa w-[56px] text-center text-[12px]"
                      />
                      <span className="text-[10.5px] text-faint">PE</span>
                    </>
                  ) : null}
                  <span className="text-[10.5px] text-faint">×</span>
                  <InputNum
                    valor={it.quantidade}
                    min={1}
                    onChange={(v) => patch(i, { quantidade: v })}
                    className="campo-caixa w-[48px] text-center text-[12px]"
                  />
                  <BotaoRemover
                    rotulo="×"
                    aoConfirmar={() =>
                      setIntegrantes((arr) => arr.filter((_, k) => k !== i))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Campo rotulo="Anotações do grupo">
          <textarea
            rows={2}
            className="campo campo-caixa text-[13px]"
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            placeholder="Tática, gatilhos, contexto…"
          />
        </Campo>

        {erro ? <p className="text-[12.5px] text-carmim-luz">{erro}</p> : null}

        <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
          <button type="button" className="btn" onClick={aoFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            onClick={salvar}
            disabled={salvando}
          >
            {salvando ? "Salvando…" : "Salvar grupo"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
