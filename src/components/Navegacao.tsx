"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Papel } from "@/lib/auth";

type Item = { href: string; rotulo: string; soMestre?: boolean };

const ITENS: Item[] = [
  { href: "/personagens", rotulo: "Personagens" },
  { href: "/iniciativa", rotulo: "Iniciativa" },
  { href: "/bestiario", rotulo: "Criaturas", soMestre: true },
  { href: "/recompensas", rotulo: "Recompensas", soMestre: true },
  { href: "/sessoes", rotulo: "Anotações de Sessão", soMestre: true },
  { href: "/usuarios", rotulo: "Usuários", soMestre: true },
];

export function Navegacao({
  papel,
  nome,
  aoSair,
}: {
  papel: Papel;
  nome: string;
  aoSair: () => void;
}) {
  const caminho = usePathname();
  const itens = ITENS.filter((i) => !i.soMestre || papel === "MESTRE");
  const ativo = (href: string) => caminho === href || caminho.startsWith(href + "/");

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-[220px] flex-none flex-col gap-1.5 border-r border-line bg-panel px-[18px] py-7 md:flex">
        <div className="mx-1.5 mb-1">
          <span className="titulo text-[23px] tracking-[0.02em]">Gaia</span>
        </div>
        <p className="mx-1.5 mb-5 text-[11px] text-muted">O Prelúdio · mesa de jogo</p>

        {itens.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "rounded-md border-l-2 px-3 py-2.5 text-[15px] transition-colors",
              ativo(i.href)
                ? "border-l-carmim bg-[oklch(0.55_0.18_25_/_0.16)] text-[oklch(0.85_0.03_30)]"
                : "border-l-transparent text-muted hover:text-fg-soft"
            )}
          >
            {i.rotulo}
          </Link>
        ))}

        <div className="mt-auto border-t border-line-soft pt-5">
          <p className="text-[12.5px] text-fg-soft">{nome}</p>
          <p className="mb-3 text-[11px] text-faint">
            {papel === "MESTRE" ? "Mestre" : "Jogador"}
          </p>
          <button type="button" onClick={aoSair} className="btn btn-mini w-full">
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile */}
      <div className="sticky top-0 z-40 border-b border-line bg-panel md:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="titulo text-[19px]">Gaia</span>
          <button type="button" onClick={aoSair} className="btn btn-mini">
            Sair
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {itens.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px]",
                ativo(i.href)
                  ? "bg-[oklch(0.55_0.18_25_/_0.16)] text-[oklch(0.85_0.03_30)]"
                  : "text-muted"
              )}
            >
              {i.rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
