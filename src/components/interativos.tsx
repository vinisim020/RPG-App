"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Escala em "dots" quadrados (parametros, conhecimentos, exaustao). */
export function Pontos({
  valor,
  max = 6,
  tamanho = 13,
  onChange,
  cor = "carmim",
  titulo,
}: {
  valor: number;
  max?: number;
  tamanho?: number;
  onChange?: (v: number) => void;
  cor?: "carmim" | "ambar";
  titulo?: string;
}) {
  const preenchido = (cheio: boolean) => ({
    width: tamanho,
    height: tamanho,
    borderRadius: 3,
    background: cheio
      ? cor === "carmim"
        ? "var(--color-carmim-dot)"
        : "var(--color-ambar-forte)"
      : "var(--color-track)",
    border: `1px solid ${
      cheio
        ? cor === "carmim"
          ? "var(--color-carmim-dot)"
          : "var(--color-ambar-forte)"
        : "oklch(0.34 0.02 30)"
    }`,
  });

  return (
    <div className="flex gap-[5px]" title={titulo}>
      {Array.from({ length: max }, (_, i) => {
        const cheio = i < valor;
        if (!onChange) return <span key={i} style={preenchido(cheio)} />;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => onChange(valor === i + 1 ? i : i + 1)}
            className="cursor-pointer p-0 transition-transform hover:scale-110"
            style={preenchido(cheio)}
          />
        );
      })}
    </div>
  );
}

/** Numero com botoes de -/+, para PV/PE durante o combate. */
export function Contador({
  valor,
  onChange,
  min = -999,
  max = 9999,
  largura = 56,
  cor = "carmim",
}: {
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  largura?: number;
  cor?: "carmim" | "ambar" | "neutro";
}) {
  const ajustar = (d: number) => onChange(Math.max(min, Math.min(max, valor + d)));
  return (
    <div className="flex items-center gap-1">
      <button type="button" className="btn btn-mini px-2" onClick={() => ajustar(-1)}>
        −
      </button>
      <input
        type="number"
        value={valor}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        style={{ width: largura }}
        className={cn(
          "campo campo-caixa text-center font-semibold tabular-nums",
          cor === "carmim" && "text-fg-strong",
          cor === "ambar" && "text-ambar"
        )}
      />
      <button type="button" className="btn btn-mini px-2" onClick={() => ajustar(1)}>
        +
      </button>
    </div>
  );
}

export function Modal({
  aberto,
  aoFechar,
  titulo,
  largura = 640,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  largura?: number;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", onKey);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = anterior;
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10"
      style={{ background: "oklch(0.08 0.01 30 / 0.72)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        className="cartao w-full shadow-2xl"
        style={{ maxWidth: largura, background: "oklch(0.165 0.014 28)" }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="titulo text-[20px]">{titulo}</h3>
          <button type="button" className="btn btn-mini" onClick={aoFechar}>
            Fechar
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Botao destrutivo em dois toques: "Remover" -> "Confirmar". */
export function BotaoRemover({
  aoConfirmar,
  rotulo = "Remover",
  className,
}: {
  aoConfirmar: () => void;
  rotulo?: string;
  className?: string;
}) {
  const [armado, setArmado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <button
      type="button"
      className={cn("btn btn-mini btn-perigo", armado && "text-carmim-luz", className)}
      onClick={() => {
        if (armado) {
          setArmado(false);
          aoConfirmar();
        } else {
          setArmado(true);
          timer.current = setTimeout(() => setArmado(false), 3500);
        }
      }}
    >
      {armado ? "Confirmar?" : rotulo}
    </button>
  );
}

export function Campo({
  rotulo,
  children,
  className,
}: {
  rotulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="rotulo mb-1 block">{rotulo}</span>
      {children}
    </label>
  );
}

/** Barra fixa no rodape com o estado de gravacao da ficha. */
export function BarraSalvar({
  sujo,
  salvando,
  erro,
  aoSalvar,
}: {
  sujo: boolean;
  salvando: boolean;
  erro?: string | null;
  aoSalvar: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (sujo && !salvando) aoSalvar();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sujo, salvando, aoSalvar]);

  if (!sujo && !salvando && !erro) return null;

  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur sm:-mx-11 sm:px-11">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-muted">
          {erro ? (
            <span className="text-carmim-luz">{erro}</span>
          ) : salvando ? (
            "Salvando…"
          ) : (
            "Alterações não salvas"
          )}
        </span>
        <button
          type="button"
          className="btn btn-primario"
          onClick={aoSalvar}
          disabled={salvando || !sujo}
        >
          {salvando ? "Salvando…" : "Salvar ficha"}
        </button>
      </div>
    </div>
  );
}

/** Input numerico que aceita apagar o conteudo sem "pular" para 0. */
export function InputNum({
  valor,
  onChange,
  min,
  max,
  className,
  placeholder,
}: {
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
}) {
  const [txt, setTxt] = useState(String(valor));

  useEffect(() => {
    if (Number(txt || 0) !== valor) setTxt(String(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <input
      inputMode="numeric"
      value={txt}
      placeholder={placeholder}
      className={cn("campo tabular-nums", className)}
      onChange={(e) => {
        const v = e.target.value;
        if (!/^-?\d*$/.test(v)) return;
        setTxt(v);
        let n = v === "" || v === "-" ? 0 : Number(v);
        if (min !== undefined) n = Math.max(min, n);
        if (max !== undefined) n = Math.min(max, n);
        onChange(n);
      }}
      onBlur={() => setTxt(String(valor))}
    />
  );
}

/** Alternador booleano compacto. */
export function Alternador({
  ativo,
  onChange,
  rotulo,
  titulo,
}: {
  ativo: boolean;
  onChange: (v: boolean) => void;
  rotulo: string;
  titulo?: string;
}) {
  return (
    <button
      type="button"
      title={titulo}
      onClick={() => onChange(!ativo)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors",
        ativo
          ? "border-[oklch(0.55_0.18_25_/_0.45)] bg-[oklch(0.55_0.18_25_/_0.18)] text-carmim-luz"
          : "border-line text-muted hover:text-fg-dim"
      )}
    >
      <span
        className="inline-block"
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: ativo ? "var(--color-carmim-dot)" : "var(--color-track)",
          border: `1px solid ${ativo ? "var(--color-carmim-dot)" : "oklch(0.34 0.02 30)"}`,
        }}
      />
      {rotulo}
    </button>
  );
}
