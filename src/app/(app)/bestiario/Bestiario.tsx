"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Cartao, Pilula, Vazio } from "@/components/ui";
import { BotaoRemover, Campo, InputNum, Modal } from "@/components/interativos";
import { CATEGORIAS_SER, ROTULO_CATEGORIA, type CategoriaSer } from "@/lib/constants";
import {
  arquivarCriatura,
  duplicarCriatura,
  excluirCriatura,
  salvarCriatura,
  type DadosCriatura,
} from "./actions";

export type CriaturaItem = DadosCriatura & { id: string; arquivada: boolean };

const VAZIA: DadosCriatura = {
  nome: "",
  nivel: 1,
  poder: "",
  dificuldade: "",
  categoria: "COMUNS",
  parametrosOfensivos: "",
  parametrosDefensivos: "",
  movimentacao: "",
  percepcaoPassiva: "",
  golpeBrutal: "",
  evocacaoMistica: "",
  pvMax: 0,
  peMax: 0,
  caracteristicas: "",
  anotacoes: "",
};

export function Bestiario({ criaturas }: { criaturas: CriaturaItem[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>("TODAS");
  const [verArquivadas, setVerArquivadas] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<DadosCriatura>(VAZIA);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return criaturas.filter((c) => {
      if (!verArquivadas && c.arquivada) return false;
      if (filtro !== "TODAS" && c.categoria !== filtro) return false;
      if (!termo) return true;
      return (
        c.nome.toLowerCase().includes(termo) ||
        c.caracteristicas.toLowerCase().includes(termo)
      );
    });
  }, [criaturas, busca, filtro, verArquivadas]);

  function abrirNova() {
    setEditandoId(null);
    setForm(VAZIA);
    setErro(null);
    setAberto(true);
  }

  function abrirEdicao(c: CriaturaItem) {
    const { id, arquivada, ...dados } = c;
    setEditandoId(id);
    setForm(dados);
    setErro(null);
    setAberto(true);
  }

  function campo<K extends keyof DadosCriatura>(chave: K, valor: DadosCriatura[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await salvarCriatura(editandoId, form);
      setAberto(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar a criatura.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <input
          className="campo campo-caixa max-w-[280px] flex-1 text-[13px]"
          placeholder="Buscar por nome ou característica…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="campo campo-caixa w-auto text-[13px]"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="TODAS">Todas as categorias</option>
          {CATEGORIAS_SER.map((c) => (
            <option key={c} value={c}>
              {ROTULO_CATEGORIA[c]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-mini"
          onClick={() => setVerArquivadas((v) => !v)}
        >
          {verArquivadas ? "Ocultar arquivadas" : "Ver arquivadas"}
        </button>
        <button type="button" className="btn btn-primario ml-auto" onClick={abrirNova}>
          + Nova criatura
        </button>
      </div>

      {lista.length === 0 ? (
        <Vazio>
          {criaturas.length === 0
            ? "O bestiário está vazio. Cadastre a primeira criatura."
            : "Nenhuma criatura encontrada com esses filtros."}
        </Vazio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((c) => (
            <Cartao key={c.id} className="px-4.5 py-4">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <h3 className="titulo text-[18px] font-semibold">{c.nome}</h3>
                <div className="flex items-center gap-1.5">
                  {c.arquivada ? <Pilula>arquivada</Pilula> : null}
                  <Pilula>{ROTULO_CATEGORIA[c.categoria as CategoriaSer]}</Pilula>
                </div>
              </div>

              <div className="mb-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-muted">
                <span>
                  Nível: <span className="text-fg-soft">{c.nivel}</span>
                </span>
                <span>
                  Vida: <span className="text-fg-soft">{c.pvMax}</span>
                </span>
                <span>
                  PE: <span className="text-ambar">{c.peMax}</span>
                </span>
                {c.poder ? (
                  <span>
                    Poder: <span className="text-fg-soft">{c.poder}</span>
                  </span>
                ) : null}
                {c.dificuldade ? (
                  <span>
                    Dificuldade: <span className="text-carmim-luz">{c.dificuldade}</span>
                  </span>
                ) : null}
              </div>

              <div className="mb-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-muted">
                {c.parametrosOfensivos ? (
                  <span>
                    Ofensivos: <span className="text-fg-soft">{c.parametrosOfensivos}</span>
                  </span>
                ) : null}
                {c.parametrosDefensivos ? (
                  <span>
                    Defensivos: <span className="text-fg-soft">{c.parametrosDefensivos}</span>
                  </span>
                ) : null}
                {c.movimentacao ? (
                  <span>
                    Mov.: <span className="text-fg-soft">{c.movimentacao}</span>
                  </span>
                ) : null}
                {c.percepcaoPassiva ? (
                  <span>
                    Perc. passiva: <span className="text-fg-soft">{c.percepcaoPassiva}</span>
                  </span>
                ) : null}
              </div>

              {c.caracteristicas ? (
                <p className="mb-2.5 whitespace-pre-wrap text-[12.5px] leading-[1.5] text-fg-dim">
                  {c.caracteristicas}
                </p>
              ) : null}

              <div className="flex flex-col gap-1">
                {c.golpeBrutal ? (
                  <p className="text-[12px] text-fg-soft">
                    <span className="font-semibold text-ambar">Golpe Brutal:</span>{" "}
                    {c.golpeBrutal}
                  </p>
                ) : null}
                {c.evocacaoMistica ? (
                  <p className="text-[12px] text-fg-soft">
                    <span className="font-semibold text-ambar">Evocação Mística:</span>{" "}
                    {c.evocacaoMistica}
                  </p>
                ) : null}
              </div>

              <div className="mt-3.5 flex flex-wrap gap-2 border-t border-line-soft pt-3">
                <button type="button" className="btn btn-mini" onClick={() => abrirEdicao(c)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-mini"
                  onClick={async () => {
                    await duplicarCriatura(c.id);
                    router.refresh();
                  }}
                >
                  Duplicar
                </button>
                <button
                  type="button"
                  className="btn btn-mini"
                  onClick={async () => {
                    await arquivarCriatura(c.id, !c.arquivada);
                    router.refresh();
                  }}
                >
                  {c.arquivada ? "Desarquivar" : "Arquivar"}
                </button>
                <BotaoRemover
                  className="ml-auto"
                  aoConfirmar={async () => {
                    await excluirCriatura(c.id);
                    router.refresh();
                  }}
                />
              </div>
            </Cartao>
          ))}
        </div>
      )}

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={editandoId ? "Editar criatura" : "Nova criatura"}
        largura={760}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_0.7fr_1fr_1fr]">
            <Campo rotulo="Nome">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.nome}
                autoFocus
                onChange={(e) => campo("nome", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Nível">
              <InputNum
                valor={form.nivel}
                min={0}
                onChange={(v) => campo("nivel", v)}
                className="campo-caixa text-[13px]"
              />
            </Campo>
            <Campo rotulo="Poder">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.poder}
                onChange={(e) => campo("poder", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Dificuldade">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.dificuldade}
                onChange={(e) => campo("dificuldade", e.target.value)}
              />
            </Campo>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Categoria (Livro dos Seres)">
              <select
                className="campo campo-caixa text-[13px]"
                value={form.categoria}
                onChange={(e) => campo("categoria", e.target.value)}
              >
                {CATEGORIAS_SER.map((c) => (
                  <option key={c} value={c}>
                    {ROTULO_CATEGORIA[c]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Pontos de Vida (máx.)">
              <InputNum
                valor={form.pvMax}
                min={0}
                onChange={(v) => campo("pvMax", v)}
                className="campo-caixa text-[13px]"
              />
            </Campo>
            <Campo rotulo="Pontos de Energia (máx.)">
              <InputNum
                valor={form.peMax}
                min={0}
                onChange={(v) => campo("peMax", v)}
                className="campo-caixa text-[13px]"
              />
            </Campo>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Parâmetros Ofensivos">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.parametrosOfensivos}
                onChange={(e) => campo("parametrosOfensivos", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Parâmetros Defensivos">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.parametrosDefensivos}
                onChange={(e) => campo("parametrosDefensivos", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Movimentação">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.movimentacao}
                onChange={(e) => campo("movimentacao", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Percepção Passiva">
              <input
                className="campo campo-caixa text-[13px]"
                value={form.percepcaoPassiva}
                onChange={(e) => campo("percepcaoPassiva", e.target.value)}
              />
            </Campo>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Golpe Brutal">
              <textarea
                rows={2}
                className="campo campo-caixa text-[13px]"
                value={form.golpeBrutal}
                onChange={(e) => campo("golpeBrutal", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Evocação Mística">
              <textarea
                rows={2}
                className="campo campo-caixa text-[13px]"
                value={form.evocacaoMistica}
                onChange={(e) => campo("evocacaoMistica", e.target.value)}
              />
            </Campo>
          </div>

          <Campo rotulo="Características">
            <textarea
              rows={4}
              className="campo campo-caixa text-[13px]"
              value={form.caracteristicas}
              onChange={(e) => campo("caracteristicas", e.target.value)}
              placeholder="Traços e habilidades especiais, um por linha"
            />
          </Campo>

          <Campo rotulo="Anotações">
            <textarea
              rows={3}
              className="campo campo-caixa text-[13px]"
              value={form.anotacoes}
              onChange={(e) => campo("anotacoes", e.target.value)}
            />
          </Campo>

          {erro ? <p className="text-[12.5px] text-carmim-luz">{erro}</p> : null}

          <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
            <button type="button" className="btn" onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              onClick={salvar}
              disabled={salvando}
            >
              {salvando ? "Salvando…" : "Salvar criatura"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
