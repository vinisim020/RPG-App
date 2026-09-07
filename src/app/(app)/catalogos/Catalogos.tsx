"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Cartao, Pilula, Vazio } from "@/components/ui";
import { BotaoRemover, Campo, InputNum, Modal, Alternador } from "@/components/interativos";
import { cn } from "@/lib/utils";
import {
  arquivarCaracteristicaCatalogo,
  arquivarEquipamentoCatalogo,
  arquivarHabilidadeCatalogo,
  excluirCaracteristicaCatalogo,
  excluirEquipamentoCatalogo,
  excluirHabilidadeCatalogo,
  salvarCaracteristicaCatalogo,
  salvarEquipamentoCatalogo,
  salvarHabilidadeCatalogo,
  type DadosCaracteristicaCatalogo,
  type DadosEquipamentoCatalogo,
  type DadosHabilidadeCatalogo,
} from "./actions";

export type HabilidadeItem = DadosHabilidadeCatalogo & { id: string; arquivada: boolean };
export type EquipamentoItem = DadosEquipamentoCatalogo & { id: string; arquivado: boolean };
export type CaracteristicaItem = DadosCaracteristicaCatalogo & { id: string; arquivada: boolean };
export type EspecializacaoItem = {
  id: string;
  caminho: string;
  especializacao: string;
  palavrasChave: string;
  parametrosSugeridos: string;
  preRequisito: string;
  descricaoResumo: string;
};
export type PropriedadeItem = { id: string; nome: string; efeitoResumo: string };

type Aba = "habilidades" | "equipamentos" | "caracteristicas" | "caminhos";

export function Catalogos({
  ehMestre,
  habilidades,
  equipamentos,
  caracteristicas,
  especializacoes,
  propriedades,
}: {
  ehMestre: boolean;
  habilidades: HabilidadeItem[];
  equipamentos: EquipamentoItem[];
  caracteristicas: CaracteristicaItem[];
  especializacoes: EspecializacaoItem[];
  propriedades: PropriedadeItem[];
}) {
  const [aba, setAba] = useState<Aba>("habilidades");

  const abas: { chave: Aba; rotulo: string; contagem: number }[] = [
    { chave: "habilidades", rotulo: "Habilidades", contagem: habilidades.length },
    { chave: "equipamentos", rotulo: "Equipamentos", contagem: equipamentos.length },
    { chave: "caracteristicas", rotulo: "Características de Criatura", contagem: caracteristicas.length },
    { chave: "caminhos", rotulo: "Caminhos & Especializações", contagem: especializacoes.length },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-line-soft pb-3">
        {abas.map((a) => (
          <button
            key={a.chave}
            type="button"
            onClick={() => setAba(a.chave)}
            className={cn(
              "rounded-md px-3.5 py-2 text-[13.5px] transition-colors",
              aba === a.chave
                ? "bg-[oklch(0.55_0.18_25_/_0.16)] text-[oklch(0.85_0.03_30)]"
                : "text-muted hover:text-fg-soft"
            )}
          >
            {a.rotulo} <span className="text-[11px] text-faint">({a.contagem})</span>
          </button>
        ))}
      </div>

      {aba === "habilidades" ? (
        <AbaHabilidades ehMestre={ehMestre} itens={habilidades} />
      ) : aba === "equipamentos" ? (
        <AbaEquipamentos ehMestre={ehMestre} itens={equipamentos} propriedades={propriedades} />
      ) : aba === "caracteristicas" ? (
        <AbaCaracteristicas ehMestre={ehMestre} itens={caracteristicas} />
      ) : (
        <AbaCaminhos itens={especializacoes} />
      )}
    </div>
  );
}

/* ============================================================ Habilidades */

const HABILIDADE_VAZIA: DadosHabilidadeCatalogo = {
  caminho: "Andarilho",
  especializacao: "(base)",
  nome: "",
  custoPe: "",
  tipoAcao: "",
  conjuracao: false,
  efeitoResumo: "",
  aprimoramentoA: "",
  aprimoramentoB: "",
};

const CAMINHOS = ["Andarilho", "Combatente", "Devoto", "Feiticeiro", "Ladino"] as const;

function AbaHabilidades({ ehMestre, itens }: { ehMestre: boolean; itens: HabilidadeItem[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [caminho, setCaminho] = useState("TODOS");
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [editando, setEditando] = useState<HabilidadeItem | "novo" | null>(null);

  const especializacoesDoCaminho = useMemo(() => {
    if (caminho === "TODOS") return [];
    return Array.from(new Set(itens.filter((h) => h.caminho === caminho).map((h) => h.especializacao)));
  }, [itens, caminho]);
  const [especializacao, setEspecializacao] = useState("TODAS");

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((h) => {
      if (!verArquivadas && h.arquivada) return false;
      if (caminho !== "TODOS" && h.caminho !== caminho) return false;
      if (especializacao !== "TODAS" && h.especializacao !== especializacao) return false;
      if (!termo) return true;
      return h.nome.toLowerCase().includes(termo) || h.efeitoResumo.toLowerCase().includes(termo);
    });
  }, [itens, busca, caminho, especializacao, verArquivadas]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <input
          className="campo campo-caixa max-w-[260px] flex-1 text-[13px]"
          placeholder="Buscar por nome ou efeito…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="campo campo-caixa w-auto text-[13px]"
          value={caminho}
          onChange={(e) => {
            setCaminho(e.target.value);
            setEspecializacao("TODAS");
          }}
        >
          <option value="TODOS">Todos os Caminhos</option>
          {CAMINHOS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {caminho !== "TODOS" ? (
          <select
            className="campo campo-caixa w-auto text-[13px]"
            value={especializacao}
            onChange={(e) => setEspecializacao(e.target.value)}
          >
            <option value="TODAS">Todas as especializações</option>
            {especializacoesDoCaminho.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        ) : null}
        {ehMestre ? (
          <button type="button" className="btn btn-mini" onClick={() => setVerArquivadas((v) => !v)}>
            {verArquivadas ? "Ocultar arquivadas" : "Ver arquivadas"}
          </button>
        ) : null}
        {ehMestre ? (
          <button type="button" className="btn btn-primario ml-auto" onClick={() => setEditando("novo")}>
            + Nova habilidade
          </button>
        ) : null}
      </div>

      {lista.length === 0 ? (
        <Vazio>Nenhuma habilidade encontrada com esses filtros.</Vazio>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {lista.map((h) => (
            <Cartao key={h.id} className="px-4 py-3.5">
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                <span className="titulo text-[16px] font-semibold">{h.nome}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {h.arquivada ? <Pilula>arquivada</Pilula> : null}
                  <Pilula variante="carmim">{h.caminho}</Pilula>
                  {h.especializacao !== "(base)" ? <Pilula>{h.especializacao}</Pilula> : null}
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted">
                {h.tipoAcao ? <span>{h.tipoAcao}</span> : null}
                {h.custoPe ? <span className="text-ambar">{h.custoPe} PE</span> : null}
                {h.conjuracao ? <Pilula>Conjuração</Pilula> : null}
              </div>
              {h.efeitoResumo ? (
                <p className="mb-2 text-[12.5px] leading-[1.5] text-fg-dim">{h.efeitoResumo}</p>
              ) : null}
              {h.aprimoramentoA || h.aprimoramentoB ? (
                <div className="mb-2 flex flex-col gap-1 border-t border-line-soft pt-2 text-[11.5px] text-fg-dim">
                  {h.aprimoramentoA ? (
                    <span>
                      <span className="text-ambar">Aprim. I:</span> {h.aprimoramentoA}
                    </span>
                  ) : null}
                  {h.aprimoramentoB ? (
                    <span>
                      <span className="text-ambar">Aprim. II:</span> {h.aprimoramentoB}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {ehMestre ? (
                <div className="flex flex-wrap gap-2 border-t border-line-soft pt-2.5">
                  <button type="button" className="btn btn-mini" onClick={() => setEditando(h)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-mini"
                    onClick={async () => {
                      await arquivarHabilidadeCatalogo(h.id, !h.arquivada);
                      router.refresh();
                    }}
                  >
                    {h.arquivada ? "Desarquivar" : "Arquivar"}
                  </button>
                  <BotaoRemover
                    className="ml-auto"
                    aoConfirmar={async () => {
                      await excluirHabilidadeCatalogo(h.id);
                      router.refresh();
                    }}
                  />
                </div>
              ) : null}
            </Cartao>
          ))}
        </div>
      )}

      {editando ? (
        <ModalHabilidade
          inicial={editando === "novo" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => router.refresh()}
        />
      ) : null}
    </>
  );
}

function ModalHabilidade({
  inicial,
  aoFechar,
  aoSalvar,
}: {
  inicial: HabilidadeItem | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [form, setForm] = useState<DadosHabilidadeCatalogo>(inicial ?? HABILIDADE_VAZIA);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function campo<K extends keyof DadosHabilidadeCatalogo>(chave: K, valor: DadosHabilidadeCatalogo[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await salvarHabilidadeCatalogo(inicial?.id ?? null, form);
      aoSalvar();
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={inicial ? "Editar habilidade" : "Nova habilidade"}
      largura={640}
    >
      <div className="flex flex-col gap-3.5">
        <Campo rotulo="Nome">
          <input
            autoFocus
            className="campo campo-caixa text-[13px]"
            value={form.nome}
            onChange={(e) => campo("nome", e.target.value)}
          />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Caminho">
            <select
              className="campo campo-caixa text-[13px]"
              value={form.caminho}
              onChange={(e) => campo("caminho", e.target.value)}
            >
              {CAMINHOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Especialização">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.especializacao}
              onChange={(e) => campo("especializacao", e.target.value)}
              placeholder="(base) ou nome da especialização"
            />
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Custo de PE">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.custoPe}
              onChange={(e) => campo("custoPe", e.target.value)}
              placeholder="2, 1-5, X PV…"
            />
          </Campo>
          <Campo rotulo="Tipo de ação">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.tipoAcao}
              onChange={(e) => campo("tipoAcao", e.target.value)}
              placeholder="Ação Simples…"
            />
          </Campo>
          <div className="flex items-end pb-1.5">
            <Alternador
              ativo={form.conjuracao}
              rotulo="Conjuração"
              onChange={(v) => campo("conjuracao", v)}
            />
          </div>
        </div>
        <Campo rotulo="Efeito (resumo mecânico)">
          <textarea
            rows={3}
            className="campo campo-caixa text-[13px]"
            value={form.efeitoResumo}
            onChange={(e) => campo("efeitoResumo", e.target.value)}
          />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Aprimoramento A">
            <textarea
              rows={2}
              className="campo campo-caixa text-[13px]"
              value={form.aprimoramentoA}
              onChange={(e) => campo("aprimoramentoA", e.target.value)}
            />
          </Campo>
          <Campo rotulo="Aprimoramento B">
            <textarea
              rows={2}
              className="campo campo-caixa text-[13px]"
              value={form.aprimoramentoB}
              onChange={(e) => campo("aprimoramentoB", e.target.value)}
            />
          </Campo>
        </div>
        {erro ? <p className="text-[12.5px] text-carmim-luz">{erro}</p> : null}
        <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
          <button type="button" className="btn" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primario" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================ Equipamentos */

const EQUIPAMENTO_VAZIO: DadosEquipamentoCatalogo = {
  categoria: "Item Mundano",
  subcategoria: "",
  nome: "",
  precoMp: "",
  unidade: "",
  danoOuBloqueio: "",
  parametroOuRequisito: "",
  alcance: "",
  propriedadeOuNotas: "",
};

function AbaEquipamentos({
  ehMestre,
  itens,
  propriedades,
}: {
  ehMestre: boolean;
  itens: EquipamentoItem[];
  propriedades: PropriedadeItem[];
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [verArquivados, setVerArquivados] = useState(false);
  const [editando, setEditando] = useState<EquipamentoItem | "novo" | null>(null);
  const [verPropriedades, setVerPropriedades] = useState(false);

  const categorias = useMemo(() => Array.from(new Set(itens.map((i) => i.categoria))).sort(), [itens]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (!verArquivados && i.arquivado) return false;
      if (categoria !== "TODAS" && i.categoria !== categoria) return false;
      if (!termo) return true;
      return i.nome.toLowerCase().includes(termo) || i.propriedadeOuNotas.toLowerCase().includes(termo);
    });
  }, [itens, busca, categoria, verArquivados]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <input
          className="campo campo-caixa max-w-[260px] flex-1 text-[13px]"
          placeholder="Buscar por nome ou propriedade…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="campo campo-caixa w-auto text-[13px]"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="TODAS">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-mini" onClick={() => setVerPropriedades((v) => !v)}>
          {verPropriedades ? "Ocultar propriedades" : "Ver propriedades de armamento"}
        </button>
        {ehMestre ? (
          <button type="button" className="btn btn-mini" onClick={() => setVerArquivados((v) => !v)}>
            {verArquivados ? "Ocultar arquivados" : "Ver arquivados"}
          </button>
        ) : null}
        {ehMestre ? (
          <button type="button" className="btn btn-primario ml-auto" onClick={() => setEditando("novo")}>
            + Novo item
          </button>
        ) : null}
      </div>

      {verPropriedades ? (
        <Cartao className="mb-5 grid gap-2.5 px-4 py-3.5 sm:grid-cols-2">
          {propriedades.map((p) => (
            <div key={p.id} className="text-[12px]">
              <span className="font-semibold text-fg-soft">{p.nome}:</span>{" "}
              <span className="text-fg-dim">{p.efeitoResumo}</span>
            </div>
          ))}
        </Cartao>
      ) : null}

      {lista.length === 0 ? (
        <Vazio>Nenhum item encontrado com esses filtros.</Vazio>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {lista.map((i) => (
            <Cartao key={i.id} className="px-4 py-3.5">
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                <span className="titulo text-[16px] font-semibold">{i.nome}</span>
                <div className="flex items-center gap-1.5">
                  {i.arquivado ? <Pilula>arquivado</Pilula> : null}
                  <Pilula variante="carmim">{i.categoria}</Pilula>
                  {i.subcategoria ? <Pilula>{i.subcategoria}</Pilula> : null}
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-muted">
                {i.precoMp ? (
                  <span>
                    Preço: <span className="text-fg-soft">{i.precoMp} MP</span>
                  </span>
                ) : null}
                {i.unidade ? (
                  <span>
                    Unidade: <span className="text-fg-soft">{i.unidade}</span>
                  </span>
                ) : null}
                {i.danoOuBloqueio ? (
                  <span>
                    Dano/Bloqueio: <span className="text-fg-soft">{i.danoOuBloqueio}</span>
                  </span>
                ) : null}
                {i.alcance ? (
                  <span>
                    Alcance: <span className="text-fg-soft">{i.alcance}</span>
                  </span>
                ) : null}
                {i.parametroOuRequisito ? (
                  <span>
                    Requisito: <span className="text-fg-soft">{i.parametroOuRequisito}</span>
                  </span>
                ) : null}
              </div>
              {i.propriedadeOuNotas ? (
                <p className="mb-2 text-[12.5px] leading-[1.5] text-fg-dim">{i.propriedadeOuNotas}</p>
              ) : null}
              {ehMestre ? (
                <div className="flex flex-wrap gap-2 border-t border-line-soft pt-2.5">
                  <button type="button" className="btn btn-mini" onClick={() => setEditando(i)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-mini"
                    onClick={async () => {
                      await arquivarEquipamentoCatalogo(i.id, !i.arquivado);
                      router.refresh();
                    }}
                  >
                    {i.arquivado ? "Desarquivar" : "Arquivar"}
                  </button>
                  <BotaoRemover
                    className="ml-auto"
                    aoConfirmar={async () => {
                      await excluirEquipamentoCatalogo(i.id);
                      router.refresh();
                    }}
                  />
                </div>
              ) : null}
            </Cartao>
          ))}
        </div>
      )}

      {editando ? (
        <ModalEquipamento
          inicial={editando === "novo" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => router.refresh()}
        />
      ) : null}
    </>
  );
}

function ModalEquipamento({
  inicial,
  aoFechar,
  aoSalvar,
}: {
  inicial: EquipamentoItem | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [form, setForm] = useState<DadosEquipamentoCatalogo>(inicial ?? EQUIPAMENTO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function campo<K extends keyof DadosEquipamentoCatalogo>(chave: K, valor: DadosEquipamentoCatalogo[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await salvarEquipamentoCatalogo(inicial?.id ?? null, form);
      aoSalvar();
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto aoFechar={aoFechar} titulo={inicial ? "Editar item" : "Novo item"} largura={620}>
      <div className="flex flex-col gap-3.5">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <Campo rotulo="Nome">
            <input
              autoFocus
              className="campo campo-caixa text-[13px]"
              value={form.nome}
              onChange={(e) => campo("nome", e.target.value)}
            />
          </Campo>
          <Campo rotulo="Categoria">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.categoria}
              onChange={(e) => campo("categoria", e.target.value)}
            />
          </Campo>
          <Campo rotulo="Subcategoria">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.subcategoria}
              onChange={(e) => campo("subcategoria", e.target.value)}
            />
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Campo rotulo="Preço (MP)">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.precoMp}
              onChange={(e) => campo("precoMp", e.target.value)}
            />
          </Campo>
          <Campo rotulo="Unidade">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.unidade}
              onChange={(e) => campo("unidade", e.target.value)}
            />
          </Campo>
          <Campo rotulo="Dano/Bloqueio">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.danoOuBloqueio}
              onChange={(e) => campo("danoOuBloqueio", e.target.value)}
            />
          </Campo>
          <Campo rotulo="Alcance">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.alcance}
              onChange={(e) => campo("alcance", e.target.value)}
            />
          </Campo>
        </div>
        <Campo rotulo="Parâmetro/Requisito">
          <input
            className="campo campo-caixa text-[13px]"
            value={form.parametroOuRequisito}
            onChange={(e) => campo("parametroOuRequisito", e.target.value)}
          />
        </Campo>
        <Campo rotulo="Propriedade/Notas">
          <textarea
            rows={2}
            className="campo campo-caixa text-[13px]"
            value={form.propriedadeOuNotas}
            onChange={(e) => campo("propriedadeOuNotas", e.target.value)}
          />
        </Campo>
        {erro ? <p className="text-[12.5px] text-carmim-luz">{erro}</p> : null}
        <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
          <button type="button" className="btn" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primario" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ======================================================== Características */

const LIVROS = [
  "Comuns",
  "Não-Vivos",
  "Artificiais",
  "Ferais",
  "Elementais",
  "Abissais",
  "Véu",
  "Primais",
  "Celestiais",
] as const;
const DIFICULDADES = ["Adicional", "Fácil", "Normal", "Difícil", "Extrema", "Tipo especial"] as const;

const CARACTERISTICA_VAZIA: DadosCaracteristicaCatalogo = {
  livro: "Comuns",
  dificuldade: "Fácil",
  nome: "",
  custoPe: "",
  tipoAcao: "",
  efeitoResumo: "",
};

function AbaCaracteristicas({ ehMestre, itens }: { ehMestre: boolean; itens: CaracteristicaItem[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [livro, setLivro] = useState("TODOS");
  const [dificuldade, setDificuldade] = useState("TODAS");
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [editando, setEditando] = useState<CaracteristicaItem | "novo" | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((c) => {
      if (!verArquivadas && c.arquivada) return false;
      if (livro !== "TODOS" && c.livro !== livro) return false;
      if (dificuldade !== "TODAS" && c.dificuldade !== dificuldade) return false;
      if (!termo) return true;
      return c.nome.toLowerCase().includes(termo) || c.efeitoResumo.toLowerCase().includes(termo);
    });
  }, [itens, busca, livro, dificuldade, verArquivadas]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <input
          className="campo campo-caixa max-w-[260px] flex-1 text-[13px]"
          placeholder="Buscar por nome ou efeito…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="campo campo-caixa w-auto text-[13px]" value={livro} onChange={(e) => setLivro(e.target.value)}>
          <option value="TODOS">Todos os Livros</option>
          {LIVROS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="campo campo-caixa w-auto text-[13px]"
          value={dificuldade}
          onChange={(e) => setDificuldade(e.target.value)}
        >
          <option value="TODAS">Todas as dificuldades</option>
          {DIFICULDADES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {ehMestre ? (
          <button type="button" className="btn btn-mini" onClick={() => setVerArquivadas((v) => !v)}>
            {verArquivadas ? "Ocultar arquivadas" : "Ver arquivadas"}
          </button>
        ) : null}
        {ehMestre ? (
          <button type="button" className="btn btn-primario ml-auto" onClick={() => setEditando("novo")}>
            + Nova característica
          </button>
        ) : null}
      </div>

      {lista.length === 0 ? (
        <Vazio>Nenhuma característica encontrada com esses filtros.</Vazio>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {lista.map((c) => (
            <Cartao key={c.id} className="px-4 py-3.5">
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                <span className="titulo text-[16px] font-semibold">{c.nome}</span>
                <div className="flex items-center gap-1.5">
                  {c.arquivada ? <Pilula>arquivada</Pilula> : null}
                  <Pilula variante="carmim">{c.livro}</Pilula>
                  <Pilula>{c.dificuldade}</Pilula>
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted">
                {c.tipoAcao ? <span>{c.tipoAcao}</span> : null}
                {c.custoPe ? <span className="text-ambar">{c.custoPe}</span> : null}
              </div>
              {c.efeitoResumo ? (
                <p className="mb-2 text-[12.5px] leading-[1.5] text-fg-dim">{c.efeitoResumo}</p>
              ) : null}
              {ehMestre ? (
                <div className="flex flex-wrap gap-2 border-t border-line-soft pt-2.5">
                  <button type="button" className="btn btn-mini" onClick={() => setEditando(c)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-mini"
                    onClick={async () => {
                      await arquivarCaracteristicaCatalogo(c.id, !c.arquivada);
                      router.refresh();
                    }}
                  >
                    {c.arquivada ? "Desarquivar" : "Arquivar"}
                  </button>
                  <BotaoRemover
                    className="ml-auto"
                    aoConfirmar={async () => {
                      await excluirCaracteristicaCatalogo(c.id);
                      router.refresh();
                    }}
                  />
                </div>
              ) : null}
            </Cartao>
          ))}
        </div>
      )}

      {editando ? (
        <ModalCaracteristica
          inicial={editando === "novo" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => router.refresh()}
        />
      ) : null}
    </>
  );
}

function ModalCaracteristica({
  inicial,
  aoFechar,
  aoSalvar,
}: {
  inicial: CaracteristicaItem | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [form, setForm] = useState<DadosCaracteristicaCatalogo>(inicial ?? CARACTERISTICA_VAZIA);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function campo<K extends keyof DadosCaracteristicaCatalogo>(
    chave: K,
    valor: DadosCaracteristicaCatalogo[K]
  ) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await salvarCaracteristicaCatalogo(inicial?.id ?? null, form);
      aoSalvar();
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={inicial ? "Editar característica" : "Nova característica"}
      largura={560}
    >
      <div className="flex flex-col gap-3.5">
        <Campo rotulo="Nome">
          <input
            autoFocus
            className="campo campo-caixa text-[13px]"
            value={form.nome}
            onChange={(e) => campo("nome", e.target.value)}
          />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Livro">
            <select
              className="campo campo-caixa text-[13px]"
              value={form.livro}
              onChange={(e) => campo("livro", e.target.value)}
            >
              {LIVROS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Dificuldade">
            <select
              className="campo campo-caixa text-[13px]"
              value={form.dificuldade}
              onChange={(e) => campo("dificuldade", e.target.value)}
            >
              {DIFICULDADES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Custo de PE">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.custoPe}
              onChange={(e) => campo("custoPe", e.target.value)}
            />
          </Campo>
          <Campo rotulo="Tipo de ação">
            <input
              className="campo campo-caixa text-[13px]"
              value={form.tipoAcao}
              onChange={(e) => campo("tipoAcao", e.target.value)}
            />
          </Campo>
        </div>
        <Campo rotulo="Efeito (resumo mecânico)">
          <textarea
            rows={3}
            className="campo campo-caixa text-[13px]"
            value={form.efeitoResumo}
            onChange={(e) => campo("efeitoResumo", e.target.value)}
          />
        </Campo>
        {erro ? <p className="text-[12.5px] text-carmim-luz">{erro}</p> : null}
        <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
          <button type="button" className="btn" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primario" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ==================================================== Caminhos (referência) */

function AbaCaminhos({ itens }: { itens: EspecializacaoItem[] }) {
  const porCaminho = useMemo(() => {
    const mapa = new Map<string, EspecializacaoItem[]>();
    for (const it of itens) {
      if (!mapa.has(it.caminho)) mapa.set(it.caminho, []);
      mapa.get(it.caminho)!.push(it);
    }
    return mapa;
  }, [itens]);

  return (
    <div className="flex flex-col gap-8">
      {Array.from(porCaminho.entries()).map(([caminho, especs]) => {
        const base = especs.find((e) => e.especializacao === "(base)");
        const outras = especs.filter((e) => e.especializacao !== "(base)");
        return (
          <section key={caminho}>
            <h2 className="secao">{caminho}</h2>
            {base ? (
              <Cartao className="mb-3 px-4 py-3.5">
                <p className="mb-1.5 text-[13px] text-fg-soft">{base.descricaoResumo}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
                  {base.palavrasChave ? (
                    <span>
                      Palavras-chave: <span className="text-fg-dim">{base.palavrasChave}</span>
                    </span>
                  ) : null}
                  {base.parametrosSugeridos ? (
                    <span>
                      Parâmetros sugeridos: <span className="text-fg-dim">{base.parametrosSugeridos}</span>
                    </span>
                  ) : null}
                </div>
              </Cartao>
            ) : null}
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {outras.map((e) => (
                <Cartao key={e.id} className="px-3.5 py-3">
                  <p className="mb-1 text-[13px] font-semibold text-fg-soft">{e.especializacao}</p>
                  <p className="text-[12px] leading-[1.45] text-fg-dim">{e.descricaoResumo}</p>
                  {e.preRequisito ? (
                    <p className="mt-1.5 text-[11px] text-carmim-suave">Pré-requisito: {e.preRequisito}</p>
                  ) : null}
                </Cartao>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
