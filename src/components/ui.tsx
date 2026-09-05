import { cn } from "@/lib/utils";

export function Cartao({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("cartao", className)} {...props}>
      {children}
    </div>
  );
}

export function TituloSecao({
  children,
  acao,
}: {
  children: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="secao mb-0">{children}</h2>
      {acao}
    </div>
  );
}

export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="titulo text-[28px]">{titulo}</h1>
        {descricao ? <p className="mt-1 text-[13px] text-muted">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}

export function Pilula({
  children,
  variante = "neutra",
  className,
}: {
  children: React.ReactNode;
  variante?: "neutra" | "carmim" | "ambar";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pilula",
        variante === "carmim" && "pilula-carmim",
        variante === "ambar" && "pilula-ambar",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Barra({
  valor,
  max,
  cor = "carmim",
}: {
  valor: number;
  max: number;
  cor?: "carmim" | "ambar";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-[5px] bg-track">
      <div
        className="h-full transition-[width] duration-200"
        style={{
          width: `${pct}%`,
          background: cor === "carmim" ? "var(--color-carmim)" : "var(--color-ambar-forte)",
        }}
      />
    </div>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="cartao px-5 py-10 text-center text-[13px] text-muted">{children}</div>
  );
}

export function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="rotulo">{children}</span>;
}
