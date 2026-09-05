/** Listas fixas vindas da ficha oficial de Gaia: O Preludio. */

export const PARAMETROS = [
  "Precisão",
  "Brutalidade",
  "Destreza",
  "Agilidade",
  "Canalização",
  "Arcanismo",
  "Espírito",
  "Vigor",
] as const;

export const CONHECIMENTOS = [
  "Carisma",
  "Conhecimento Místico",
  "Exploração",
  "Furtividade",
  "História",
  "Intimidação",
  "Intuição",
  "Medicina",
  "Percepção",
  "Performance",
  "Religião",
  "Sobrevivência",
  "Tecnologia",
  "Vontade",
] as const;

export const ESCALA_MAX = 6; // parametros e conhecimentos: 0 a 6
export const EXAUSTAO_MAX = 5;

export const TIPOS_ACAO = [
  "INICIATIVA",
  "ATIVA",
  "PASSIVA",
  "RAPIDA",
  "SIMPLES",
  "ACELERADA",
] as const;
export type TipoAcao = (typeof TIPOS_ACAO)[number];

export const ROTULO_ACAO: Record<TipoAcao, string> = {
  INICIATIVA: "Iniciativa",
  ATIVA: "Ativa",
  PASSIVA: "Passiva",
  RAPIDA: "Rápida",
  SIMPLES: "Simples",
  ACELERADA: "Acelerada",
};

export const CATEGORIAS_SER = [
  "COMUNS",
  "NAO_VIVOS",
  "ARTIFICIAIS",
  "FERAIS",
  "ELEMENTAIS",
  "ABISSAIS",
  "DO_VEU",
  "PRIMAIS",
  "CELESTIAIS",
] as const;
export type CategoriaSer = (typeof CATEGORIAS_SER)[number];

export const ROTULO_CATEGORIA: Record<CategoriaSer, string> = {
  COMUNS: "Comuns",
  NAO_VIVOS: "Não-Vivos",
  ARTIFICIAIS: "Artificiais",
  FERAIS: "Ferais",
  ELEMENTAIS: "Elementais",
  ABISSAIS: "Abissais",
  DO_VEU: "Do Véu",
  PRIMAIS: "Primais",
  CELESTIAIS: "Celestiais",
};

export const ROTULO_TIPO_COMBATENTE: Record<string, string> = {
  PERSONAGEM: "Jogador",
  CRIATURA: "Criatura",
  AVULSO: "NPC",
};
