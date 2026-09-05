import { db } from "./db";

export type CombatenteEstado = {
  id: string;
  tipo: "PERSONAGEM" | "CRIATURA" | "AVULSO";
  personagemId: string | null;
  criaturaId: string | null;
  nomeExibicao: string;
  valorIniciativa: number;
  ordem: number;
  pvAtual: number;
  pvTemp: number;
  pvMax: number;
  peAtual: number;
  peTemp: number;
  peMax: number;
  anotacao: string;
};

export type EstadoCombate = {
  id: string;
  nome: string;
  rodadaAtual: number;
  turnoAtualIndex: number;
  atualizadoEm: string;
  combatentes: CombatenteEstado[];
} | null;

/**
 * Estado do combate em andamento. Combatentes do tipo PERSONAGEM leem PV/PE
 * direto da ficha, para que a tela de combate e a ficha nunca divirjam.
 *
 * Para jogadores (ehMestre = false), PV/PE e anotacoes de criaturas e NPCs sao
 * removidos aqui, no servidor — nao adianta so esconder na interface.
 */
export async function carregarCombate(ehMestre: boolean): Promise<EstadoCombate> {
  const combate = await db.combateAtivo.findFirst({
    orderBy: { atualizadoEm: "desc" },
    include: {
      combatentes: {
        orderBy: { ordem: "asc" },
        include: {
          personagem: {
            select: {
              pvAtual: true,
              pvTemp: true,
              pvMax: true,
              peAtual: true,
              peTemp: true,
              peMax: true,
            },
          },
        },
      },
    },
  });

  if (!combate) return null;

  return {
    id: combate.id,
    nome: combate.nome,
    rodadaAtual: combate.rodadaAtual,
    turnoAtualIndex: combate.turnoAtualIndex,
    atualizadoEm: combate.atualizadoEm.toISOString(),
    combatentes: combate.combatentes.map((c) => {
      const ficha = c.tipo === "PERSONAGEM" ? c.personagem : null;
      const ocultar = !ehMestre && c.tipo !== "PERSONAGEM";
      if (ocultar) {
        return {
          id: c.id,
          tipo: c.tipo,
          personagemId: null,
          criaturaId: null,
          nomeExibicao: c.nomeExibicao,
          valorIniciativa: c.valorIniciativa,
          ordem: c.ordem,
          pvAtual: 0,
          pvTemp: 0,
          pvMax: 0,
          peAtual: 0,
          peTemp: 0,
          peMax: 0,
          anotacao: "",
        };
      }
      return {
        id: c.id,
        tipo: c.tipo,
        personagemId: c.personagemId,
        criaturaId: c.criaturaId,
        nomeExibicao: c.nomeExibicao,
        valorIniciativa: c.valorIniciativa,
        ordem: c.ordem,
        pvAtual: ficha?.pvAtual ?? c.pvAtual,
        pvTemp: ficha?.pvTemp ?? c.pvTemp,
        pvMax: ficha?.pvMax ?? c.pvMax,
        peAtual: ficha?.peAtual ?? c.peAtual,
        peTemp: ficha?.peTemp ?? c.peTemp,
        peMax: ficha?.peMax ?? c.peMax,
        anotacao: c.anotacao,
      };
    }),
  };
}
