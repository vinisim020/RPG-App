"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Barra, Cartao, TituloSecao } from "@/components/ui";
import {
  Alternador,
  BarraSalvar,
  BotaoRemover,
  Campo,
  InputNum,
  Pontos,
} from "@/components/interativos";
import {
  CONHECIMENTOS,
  ESCALA_MAX,
  EXAUSTAO_MAX,
  PARAMETROS,
  ROTULO_ACAO,
  TIPOS_ACAO,
  type TipoAcao,
} from "@/lib/constants";
import {
  arquivarPersonagem,
  excluirPersonagem,
  salvarFicha,
  type DadosFicha,
} from "../actions";

export function Ficha({
  id,
  inicial,
  donoNome,
  arquivado,
}: {
  id: string;
  inicial: DadosFicha;
  donoNome: string;
  arquivado: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState<DadosFicha>(inicial);
  const [sujo, setSujo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /** Toda edicao passa por aqui, sempre com updater funcional: dois ajustes
   *  no mesmo lote de renderizacao nao se sobrescrevem. */
  function atualizar(fn: (p: DadosFicha) => DadosFicha) {
    setD(fn);
    setSujo(true);
    setErro(null);
  }

  function set<K extends keyof DadosFicha>(chave: K, valor: DadosFicha[K]) {
    atualizar((p) => ({ ...p, [chave]: valor }));
  }

  const salvar = useCallback(async () => {
    setSalvando(true);
    setErro(null);
    try {
      await salvarFicha(id, d);
      setSujo(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar a ficha.");
    } finally {
      setSalvando(false);
    }
  }, [id, d, router]);

  const setParametro = (nome: string, valor: number) =>
    atualizar((p) => ({
      ...p,
      parametros: p.parametros.map((x) => (x.nome === nome ? { ...x, valor } : x)),
    }));

  const setConhecimento = (
    nome: string,
    patch: Partial<DadosFicha["conhecimentos"][number]>
  ) =>
    atualizar((p) => ({
      ...p,
      conhecimentos: p.conhecimentos.map((c) => (c.nome === nome ? { ...c, ...patch } : c)),
    }));

  const setEquip = (i: number, patch: Partial<DadosFicha["equipamentos"][number]>) =>
    atualizar((p) => {
      const arr = [...p.equipamentos];
      arr[i] = { ...arr[i], ...patch };
      return { ...p, equipamentos: arr };
    });

  const setHab = (i: number, patch: Partial<DadosFicha["habilidades"][number]>) =>
    atualizar((p) => {
      const arr = [...p.habilidades];
      arr[i] = { ...arr[i], ...patch };
      return { ...p, habilidades: arr };
    });

  const setItem = (i: number, patch: Partial<DadosFicha["itens"][number]>) =>
    atualizar((p) => {
      const arr = [...p.itens];
      arr[i] = { ...arr[i], ...patch };
      return { ...p, itens: arr };
    });

  const moverHab = (i: number, delta: number) =>
    atualizar((p) => {
      const j = i + delta;
      if (j < 0 || j >= p.habilidades.length) return p;
      const arr = [...p.habilidades];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, habilidades: arr };
    });

  const removerDe = (
    chave: "equipamentos" | "habilidades" | "itens",
    i: number
  ) =>
    atualizar((p) => ({ ...p, [chave]: p[chave].filter((_, k) => k !== i) }));

  const armas = d.equipamentos.map((e, i) => ({ e, i })).filter((x) => x.e.tipo === "ARMA");
  const armaduras = d.equipamentos
    .map((e, i) => ({ e, i }))
    .filter((x) => x.e.tipo === "ARMADURA");

  const novoEquipamento = (tipo: "ARMA" | "ARMADURA") =>
    atualizar((p) => ({
      ...p,
      equipamentos: [
        ...p.equipamentos,
        {
          tipo,
          nome: "",
          dano: "",
          alcance: "",
          bloqueio: "",
          inaptidao: "",
          propriedade: "",
        },
      ],
    }));

  return (
    <div>
      {/* cabecalho ------------------------------------------------------- */}
      <div className="mb-7 flex flex-wrap items-start gap-5">
        <div
          className="flex h-[88px] w-[88px] flex-none items-center justify-center overflow-hidden rounded-lg border border-[oklch(0.35_0.03_25)]"
          style={{
            background: d.retratoUrl
              ? undefined
              : "repeating-linear-gradient(135deg, oklch(0.22 0.02 25), oklch(0.22 0.02 25) 6px, oklch(0.19 0.018 25) 6px, oklch(0.19 0.018 25) 12px)",
          }}
        >
          {d.retratoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={d.retratoUrl} alt={d.nome} className="h-full w-full object-cover" />
          ) : (
            <span className="font-mono text-[9px] text-[oklch(0.6_0.03_30)]">retrato</span>
          )}
        </div>

        <div className="min-w-[280px] flex-1">
          <input
            className="campo titulo -ml-2 font-serif text-[34px] font-bold"
            value={d.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Nome do personagem"
          />
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <Campo rotulo="Legado">
              <input
                className="campo campo-caixa text-[13px]"
                value={d.legado}
                onChange={(e) => set("legado", e.target.value)}
                placeholder="Linhagem"
              />
            </Campo>
            <Campo rotulo="Nível de Despertar">
              <InputNum
                valor={d.nivelDespertar}
                min={0}
                max={99}
                onChange={(v) => set("nivelDespertar", v)}
                className="campo-caixa text-[13px]"
              />
            </Campo>
            <Campo rotulo="Jogador">
              <input
                className="campo campo-caixa text-[13px]"
                value={d.jogadorNome}
                onChange={(e) => set("jogadorNome", e.target.value)}
                placeholder={donoNome}
              />
            </Campo>
            <Campo rotulo="Retrato (URL)">
              <input
                className="campo campo-caixa text-[13px]"
                value={d.retratoUrl}
                onChange={(e) => set("retratoUrl", e.target.value)}
                placeholder="https://..."
              />
            </Campo>
          </div>
        </div>
      </div>

      {/* recursos -------------------------------------------------------- */}
      <div className="mb-4 grid gap-3.5 md:grid-cols-3">
        <Cartao className="px-4 py-3.5">
          <div className="rotulo mb-2 text-carmim-suave">Vida</div>
          <div className="mb-2.5 flex items-center gap-1.5">
            <InputNum
              valor={d.pvAtual}
              onChange={(v) => set("pvAtual", v)}
              className="campo-caixa w-[62px] text-center text-[20px] font-bold"
            />
            <span className="text-[13px] text-faint">/</span>
            <InputNum
              valor={d.pvMax}
              min={0}
              onChange={(v) => set("pvMax", v)}
              className="campo-caixa w-[54px] text-center text-[13px]"
            />
            <span className="ml-auto text-[10.5px] text-carmim-suave">temp</span>
            <InputNum
              valor={d.pvTemp}
              onChange={(v) => set("pvTemp", v)}
              className="campo-caixa w-[46px] text-center text-[13px]"
            />
          </div>
          <Barra valor={d.pvAtual} max={d.pvMax} />
        </Cartao>

        <Cartao className="px-4 py-3.5">
          <div className="rotulo mb-2 text-ambar">Pontos de Energia</div>
          <div className="mb-2.5 flex items-center gap-1.5">
            <InputNum
              valor={d.peAtual}
              onChange={(v) => set("peAtual", v)}
              className="campo-caixa w-[62px] text-center text-[20px] font-bold"
            />
            <span className="text-[13px] text-faint">/</span>
            <InputNum
              valor={d.peMax}
              min={0}
              onChange={(v) => set("peMax", v)}
              className="campo-caixa w-[54px] text-center text-[13px]"
            />
            <span className="ml-auto text-[10.5px] text-ambar">temp</span>
            <InputNum
              valor={d.peTemp}
              onChange={(v) => set("peTemp", v)}
              className="campo-caixa w-[46px] text-center text-[13px]"
            />
          </div>
          <Barra valor={d.peAtual} max={d.peMax} cor="ambar" />
        </Cartao>

        <Cartao className="px-4 py-3.5">
          <div className="rotulo mb-2">Exaustão</div>
          <div className="mt-3.5 flex items-center gap-3">
            <Pontos
              valor={d.exaustao}
              max={EXAUSTAO_MAX}
              tamanho={16}
              onChange={(v) => set("exaustao", v)}
            />
            <span className="text-[12px] tabular-nums text-faint">
              {d.exaustao}/{EXAUSTAO_MAX}
            </span>
          </div>
        </Cartao>
      </div>

      <Cartao className="mb-8 grid gap-4 px-4 py-3.5 sm:grid-cols-3">
        <Campo rotulo="Movimentação">
          <input
            className="campo campo-caixa text-[13px]"
            value={d.movimentacao}
            onChange={(e) => set("movimentacao", e.target.value)}
          />
        </Campo>
        <Campo rotulo="Bloqueio">
          <input
            className="campo campo-caixa text-[13px]"
            value={d.bloqueio}
            onChange={(e) => set("bloqueio", e.target.value)}
          />
        </Campo>
        <Campo rotulo="Percepção Passiva">
          <input
            className="campo campo-caixa text-[13px]"
            value={d.percepcaoPassiva}
            onChange={(e) => set("percepcaoPassiva", e.target.value)}
          />
        </Campo>
      </Cartao>

      {/* parametros ------------------------------------------------------ */}
      <TituloSecao>Parâmetros</TituloSecao>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {PARAMETROS.map((nome) => {
          const valor = d.parametros.find((p) => p.nome === nome)?.valor ?? 0;
          return (
            <Cartao key={nome} className="px-3.5 py-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] text-fg-soft">{nome}</span>
                <span className="text-[12px] tabular-nums text-faint">{valor}</span>
              </div>
              <Pontos
                valor={valor}
                max={ESCALA_MAX}
                tamanho={12}
                onChange={(v) => setParametro(nome, v)}
              />
            </Cartao>
          );
        })}
      </div>

      {/* conhecimentos --------------------------------------------------- */}
      <TituloSecao>Conhecimentos</TituloSecao>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CONHECIMENTOS.map((nome) => {
          const c = d.conhecimentos.find((x) => x.nome === nome);
          const valor = c?.valor ?? 0;
          return (
            <Cartao key={nome} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg-soft">{nome}</span>
              <Pontos
                valor={valor}
                max={ESCALA_MAX}
                tamanho={11}
                onChange={(v) => setConhecimento(nome, { valor: v })}
              />
              <Alternador
                ativo={Boolean(c?.temMaestria)}
                rotulo="M"
                titulo="Maestria"
                onChange={(v) => setConhecimento(nome, { temMaestria: v })}
              />
            </Cartao>
          );
        })}
      </div>
      <Cartao className="mb-8 px-4 py-3.5">
        <Campo rotulo="Maestrias">
          <textarea
            rows={2}
            className="campo campo-caixa text-[13px]"
            value={d.maestrias}
            onChange={(e) => set("maestrias", e.target.value)}
            placeholder="Liste as maestrias do personagem"
          />
        </Campo>
      </Cartao>

      {/* equipamentos ---------------------------------------------------- */}
      <TituloSecao
        acao={
          <div className="flex gap-2">
            <button type="button" className="btn btn-mini" onClick={() => novoEquipamento("ARMA")}>
              + Armamento
            </button>
            <button
              type="button"
              className="btn btn-mini"
              onClick={() => novoEquipamento("ARMADURA")}
            >
              + Armadura / Escudo
            </button>
          </div>
        }
      >
        Equipamentos
      </TituloSecao>

      <Cartao className="mb-3.5 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr_auto] gap-2 border-b border-line px-4 py-2.5 text-[11px] uppercase tracking-[0.04em] text-faint">
          <span>Armamento</span>
          <span>Dano</span>
          <span>Alcance</span>
          <span>Propriedade</span>
          <span />
        </div>
        {armas.length === 0 ? (
          <p className="px-4 py-4 text-[12.5px] text-faint">Nenhum armamento.</p>
        ) : (
          armas.map(({ e, i }) => (
            <div
              key={i}
              className="grid grid-cols-[2fr_1fr_1fr_1.4fr_auto] items-center gap-2 border-b border-line-soft px-3 py-1.5 last:border-0"
            >
              <input
                className="campo text-[13px]"
                value={e.nome}
                onChange={(ev) => setEquip(i, { nome: ev.target.value })}
                placeholder="Nome"
              />
              <input
                className="campo text-[13px]"
                value={e.dano}
                onChange={(ev) => setEquip(i, { dano: ev.target.value })}
              />
              <input
                className="campo text-[13px]"
                value={e.alcance}
                onChange={(ev) => setEquip(i, { alcance: ev.target.value })}
              />
              <input
                className="campo text-[13px]"
                value={e.propriedade}
                onChange={(ev) => setEquip(i, { propriedade: ev.target.value })}
              />
              <BotaoRemover
                rotulo="x"
                aoConfirmar={() => removerDe("equipamentos", i)}
              />
            </div>
          ))
        )}
      </Cartao>

      <Cartao className="mb-8 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr_auto] gap-2 border-b border-line px-4 py-2.5 text-[11px] uppercase tracking-[0.04em] text-faint">
          <span>Armadura / Escudo</span>
          <span>Bloqueio</span>
          <span>Inaptidão</span>
          <span>Propriedade</span>
          <span />
        </div>
        {armaduras.length === 0 ? (
          <p className="px-4 py-4 text-[12.5px] text-faint">Nenhuma armadura ou escudo.</p>
        ) : (
          armaduras.map(({ e, i }) => (
            <div
              key={i}
              className="grid grid-cols-[2fr_1fr_1fr_1.4fr_auto] items-center gap-2 border-b border-line-soft px-3 py-1.5 last:border-0"
            >
              <input
                className="campo text-[13px]"
                value={e.nome}
                onChange={(ev) => setEquip(i, { nome: ev.target.value })}
                placeholder="Nome"
              />
              <input
                className="campo text-[13px]"
                value={e.bloqueio}
                onChange={(ev) => setEquip(i, { bloqueio: ev.target.value })}
              />
              <input
                className="campo text-[13px]"
                value={e.inaptidao}
                onChange={(ev) => setEquip(i, { inaptidao: ev.target.value })}
              />
              <input
                className="campo text-[13px]"
                value={e.propriedade}
                onChange={(ev) => setEquip(i, { propriedade: ev.target.value })}
              />
              <BotaoRemover
                rotulo="x"
                aoConfirmar={() => removerDe("equipamentos", i)}
              />
            </div>
          ))
        )}
      </Cartao>

      {/* legado ---------------------------------------------------------- */}
      <TituloSecao>Habilidades de Legado</TituloSecao>
      <Cartao className="mb-8 px-4 py-3.5">
        <textarea
          rows={5}
          className="campo campo-caixa text-[13px]"
          value={d.habilidadesLegado}
          onChange={(e) => set("habilidadesLegado", e.target.value)}
          placeholder="Habilidades concedidas pela linhagem"
        />
      </Cartao>

      {/* poderes --------------------------------------------------------- */}
      <TituloSecao
        acao={
          <button
            type="button"
            className="btn btn-mini"
            onClick={() =>
              atualizar((p) => ({
                ...p,
                habilidades: [
                  ...p.habilidades,
                  {
                    nome: "",
                    tipoAcao: "ATIVA",
                    custoPe: 0,
                    conjuracao: false,
                    tipoConjuracao: "",
                    duracao: "",
                    pagina: "",
                    aprimoramentoA: false,
                    aprimoramentoB: false,
                    descricao: "",
                  },
                ],
              }))
            }
          >
            + Habilidade
          </button>
        }
      >
        Poderes &amp; Habilidades
      </TituloSecao>

      <div className="mb-8 flex flex-col gap-3">
        {d.habilidades.length === 0 ? (
          <Cartao className="px-4 py-6 text-center text-[12.5px] text-faint">
            Nenhuma habilidade de Caminho de Combate cadastrada.
          </Cartao>
        ) : (
          d.habilidades.map((h, i) => (
            <Cartao key={i} className="px-4 py-4">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <input
                  className="campo titulo min-w-[180px] flex-1 font-serif text-[17px] font-semibold"
                  value={h.nome}
                  onChange={(e) => setHab(i, { nome: e.target.value })}
                  placeholder="Nome da habilidade"
                />
                <select
                  className="campo campo-caixa w-auto text-[12px]"
                  value={h.tipoAcao}
                  onChange={(e) => setHab(i, { tipoAcao: e.target.value })}
                >
                  {TIPOS_ACAO.map((t) => (
                    <option key={t} value={t}>
                      {ROTULO_ACAO[t as TipoAcao]}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <InputNum
                    valor={h.custoPe}
                    min={0}
                    onChange={(v) => setHab(i, { custoPe: v })}
                    className="campo-caixa w-[52px] text-center text-[12px]"
                  />
                  <span className="text-[11px] text-ambar">PE</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-mini px-2"
                    onClick={() => moverHab(i, -1)}
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-mini px-2"
                    onClick={() => moverHab(i, 1)}
                    title="Descer"
                  >
                    ↓
                  </button>
                  <BotaoRemover
                    rotulo="x"
                    aoConfirmar={() => removerDe("habilidades", i)}
                  />
                </div>
              </div>

              <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                <Alternador
                  ativo={h.conjuracao}
                  rotulo="Conjuração"
                  onChange={(v) => setHab(i, { conjuracao: v })}
                />
                <input
                  className="campo campo-caixa w-[150px] text-[12px]"
                  value={h.tipoConjuracao}
                  onChange={(e) => setHab(i, { tipoConjuracao: e.target.value })}
                  placeholder="Tipo"
                />
                <input
                  className="campo campo-caixa w-[140px] text-[12px]"
                  value={h.duracao}
                  onChange={(e) => setHab(i, { duracao: e.target.value })}
                  placeholder="Duração"
                />
                <input
                  className="campo campo-caixa w-[100px] text-[12px]"
                  value={h.pagina}
                  onChange={(e) => setHab(i, { pagina: e.target.value })}
                  placeholder="Página"
                />
                <Alternador
                  ativo={h.aprimoramentoA}
                  rotulo="Aprim. I"
                  onChange={(v) => setHab(i, { aprimoramentoA: v })}
                />
                <Alternador
                  ativo={h.aprimoramentoB}
                  rotulo="Aprim. II"
                  onChange={(v) => setHab(i, { aprimoramentoB: v })}
                />
              </div>

              <textarea
                rows={3}
                className="campo campo-caixa text-[13px] leading-[1.55]"
                value={h.descricao}
                onChange={(e) => setHab(i, { descricao: e.target.value })}
                placeholder="Descrição"
              />
            </Cartao>
          ))
        )}
      </div>

      {/* inventario ------------------------------------------------------ */}
      <TituloSecao>Inventário</TituloSecao>
      <Cartao className="mb-3.5 grid gap-4 px-4 py-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <Campo rotulo="Prata">
          <InputNum
            valor={d.moedasPrata}
            min={0}
            onChange={(v) => set("moedasPrata", v)}
            className="campo-caixa text-[13px]"
          />
        </Campo>
        <Campo rotulo="Ouro">
          <InputNum
            valor={d.moedasOuro}
            min={0}
            onChange={(v) => set("moedasOuro", v)}
            className="campo-caixa text-[13px]"
          />
        </Campo>
        <Campo rotulo="Imperiais">
          <InputNum
            valor={d.moedasImperiais}
            min={0}
            onChange={(v) => set("moedasImperiais", v)}
            className="campo-caixa text-[13px]"
          />
        </Campo>
        <Campo rotulo="Potência">
          <InputNum
            valor={d.potencia}
            onChange={(v) => set("potencia", v)}
            className="campo-caixa text-[13px]"
          />
        </Campo>
        <Campo rotulo="Pontuação de Unidade">
          <InputNum
            valor={d.pontuacaoUnidade}
            onChange={(v) => set("pontuacaoUnidade", v)}
            className="campo-caixa text-[13px]"
          />
        </Campo>
      </Cartao>

      <Cartao className="mb-2 overflow-hidden">
        <div className="grid grid-cols-[2.4fr_0.7fr_0.8fr_1fr_auto] gap-2 border-b border-line px-4 py-2.5 text-[11px] uppercase tracking-[0.04em] text-faint">
          <span>Item</span>
          <span>Qtd.</span>
          <span>Peso</span>
          <span>Categoria</span>
          <span />
        </div>
        {d.itens.length === 0 ? (
          <p className="px-4 py-4 text-[12.5px] text-faint">Inventário vazio.</p>
        ) : (
          d.itens.map((it, i) => (
            <div key={i} className="border-b border-line-soft px-3 py-1.5 last:border-0">
              <div className="grid grid-cols-[2.4fr_0.7fr_0.8fr_1fr_auto] items-center gap-2">
                <input
                  className="campo text-[13.5px]"
                  value={it.nome}
                  onChange={(e) => setItem(i, { nome: e.target.value })}
                  placeholder="Nome do item"
                />
                <InputNum
                  valor={it.quantidade}
                  min={0}
                  onChange={(v) => setItem(i, { quantidade: v })}
                  className="text-[13px]"
                />
                <input
                  className="campo text-[13px]"
                  value={it.peso}
                  onChange={(e) => setItem(i, { peso: e.target.value })}
                />
                <input
                  className="campo text-[13px]"
                  value={it.categoria}
                  onChange={(e) => setItem(i, { categoria: e.target.value })}
                />
                <BotaoRemover
                  rotulo="x"
                  aoConfirmar={() => removerDe("itens", i)}
                />
              </div>
              <input
                className="campo text-[12px] text-muted"
                value={it.descricao}
                onChange={(e) => setItem(i, { descricao: e.target.value })}
                placeholder="Descrição (opcional)"
              />
            </div>
          ))
        )}
      </Cartao>
      <button
        type="button"
        className="btn btn-fantasma mb-8 w-full"
        onClick={() =>
          atualizar((p) => ({
            ...p,
            itens: [
              ...p.itens,
              { nome: "", quantidade: 1, peso: "", categoria: "", descricao: "" },
            ],
          }))
        }
      >
        + Adicionar item
      </button>

      {/* anotacoes ------------------------------------------------------- */}
      <TituloSecao>Anotações</TituloSecao>
      <Cartao className="mb-8 px-4 py-3.5">
        <textarea
          rows={6}
          className="campo campo-caixa text-[13px]"
          value={d.anotacoes}
          onChange={(e) => set("anotacoes", e.target.value)}
          placeholder="Anotações pessoais deste personagem"
        />
      </Cartao>

      <div className="flex items-center justify-end gap-2 border-t border-line-soft pt-5">
        {arquivado ? (
          <span className="mr-auto text-[12px] text-carmim-suave">
            Ficha arquivada: fica fora da lista de combatentes.
          </span>
        ) : null}
        <button
          type="button"
          className="btn btn-mini"
          onClick={async () => {
            await arquivarPersonagem(id, !arquivado);
            router.refresh();
          }}
        >
          {arquivado ? "Desarquivar" : "Arquivar"}
        </button>
        <BotaoRemover
          rotulo="Excluir personagem"
          aoConfirmar={async () => {
            await excluirPersonagem(id);
            router.push("/personagens");
          }}
        />
      </div>

      <BarraSalvar sujo={sujo} salvando={salvando} erro={erro} aoSalvar={salvar} />
    </div>
  );
}
