/**
 * Importa os CSVs de prisma/catalogos/ para as tabelas de catalogo.
 * Idempotente: roda por chave natural (upsert), pode ser executado de novo
 * sempre que os CSVs forem atualizados sem duplicar linhas.
 *
 *   npm run importar-catalogos
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

for (const arquivo of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(arquivo);
  } catch {
    /* arquivo ausente e aceitavel */
  }
}

const db = new PrismaClient();
const DIR = join(process.cwd(), "prisma", "catalogos");

function lerCsv(nome: string): Record<string, string>[] {
  const texto = readFileSync(join(DIR, nome), "utf-8");
  return parse(texto, { columns: true, skip_empty_lines: true, trim: true });
}

async function importarEspecializacoes() {
  const linhas = lerCsv("taxonomia_caminhos_combate.csv");
  for (const l of linhas) {
    await db.especializacaoCombate.upsert({
      where: { caminho_especializacao: { caminho: l.caminho, especializacao: l.especializacao } },
      update: {
        palavrasChave: l.palavras_chave === "—" ? "" : l.palavras_chave,
        parametrosSugeridos: l.parametros_sugeridos === "—" ? "" : l.parametros_sugeridos,
        preRequisito: l.pre_requisito === "—" ? "" : l.pre_requisito,
        descricaoResumo: l.descricao_resumo,
      },
      create: {
        caminho: l.caminho,
        especializacao: l.especializacao,
        palavrasChave: l.palavras_chave === "—" ? "" : l.palavras_chave,
        parametrosSugeridos: l.parametros_sugeridos === "—" ? "" : l.parametros_sugeridos,
        preRequisito: l.pre_requisito === "—" ? "" : l.pre_requisito,
        descricaoResumo: l.descricao_resumo,
      },
    });
  }
  console.log(`Especializações de Combate: ${linhas.length} linhas`);
}

async function importarHabilidades() {
  const linhas = lerCsv("habilidades_personagem.csv");
  for (const l of linhas) {
    const existente = await db.habilidadeCatalogo.findFirst({
      where: { caminho: l.caminho, especializacao: l.especializacao, nome: l.nome },
      select: { id: true },
    });
    const dados = {
      caminho: l.caminho,
      especializacao: l.especializacao,
      nome: l.nome,
      custoPe: l.custo_pe === "—" ? "" : l.custo_pe,
      tipoAcao: l.tipo_acao === "—" ? "" : l.tipo_acao,
      conjuracao: l.conjuracao.toLowerCase() === "sim",
      efeitoResumo: l.efeito_resumo,
      aprimoramentoA: l.aprimoramento_a === "—" ? "" : l.aprimoramento_a,
      aprimoramentoB: l.aprimoramento_b === "—" ? "" : l.aprimoramento_b,
    };
    if (existente) await db.habilidadeCatalogo.update({ where: { id: existente.id }, data: dados });
    else await db.habilidadeCatalogo.create({ data: dados });
  }
  console.log(`Habilidades de Caminho: ${linhas.length} linhas`);
}

async function importarPropriedades() {
  const linhas = lerCsv("propriedades_armamentos.csv");
  for (const l of linhas) {
    await db.propriedadeArmamento.upsert({
      where: { nome: l.propriedade },
      update: { efeitoResumo: l.efeito_resumo },
      create: { nome: l.propriedade, efeitoResumo: l.efeito_resumo },
    });
  }
  console.log(`Propriedades de Armamento: ${linhas.length} linhas`);
}

async function importarEquipamentos() {
  const linhas = lerCsv("equipamentos.csv");
  for (const l of linhas) {
    const existente = await db.equipamentoCatalogo.findFirst({
      where: { categoria: l.categoria, subcategoria: l.subcategoria, nome: l.nome },
      select: { id: true },
    });
    const dados = {
      categoria: l.categoria,
      subcategoria: l.subcategoria === "—" ? "" : l.subcategoria,
      nome: l.nome,
      precoMp: l.preco_mp === "—" ? "" : l.preco_mp,
      unidade: l.unidade === "—" ? "" : l.unidade,
      danoOuBloqueio: l.dano_base_ou_bloqueio === "—" ? "" : l.dano_base_ou_bloqueio,
      parametroOuRequisito: l.parametro_ou_requisito === "—" ? "" : l.parametro_ou_requisito,
      alcance: l.alcance === "—" ? "" : l.alcance,
      propriedadeOuNotas: l.propriedade_ou_notas === "—" ? "" : l.propriedade_ou_notas,
    };
    if (existente) await db.equipamentoCatalogo.update({ where: { id: existente.id }, data: dados });
    else await db.equipamentoCatalogo.create({ data: dados });
  }
  console.log(`Equipamentos: ${linhas.length} linhas`);
}

async function importarCaracteristicas() {
  const linhas = lerCsv("caracteristicas_criatura.csv");
  for (const l of linhas) {
    const existente = await db.caracteristicaCriaturaCatalogo.findFirst({
      where: { livro: l.livro, nome: l.nome },
      select: { id: true },
    });
    const dados = {
      livro: l.livro,
      dificuldade: l.dificuldade,
      nome: l.nome,
      custoPe: l.custo_pe === "—" ? "" : l.custo_pe,
      tipoAcao: l.tipo_acao === "—" ? "" : l.tipo_acao,
      efeitoResumo: l.efeito_resumo,
    };
    if (existente) await db.caracteristicaCriaturaCatalogo.update({ where: { id: existente.id }, data: dados });
    else await db.caracteristicaCriaturaCatalogo.create({ data: dados });
  }
  console.log(`Características de Criatura: ${linhas.length} linhas`);
}

async function main() {
  await importarEspecializacoes();
  await importarHabilidades();
  await importarPropriedades();
  await importarEquipamentos();
  await importarCaracteristicas();
  console.log("Importação concluída.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
