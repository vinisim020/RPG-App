# Regras de Criação de Criaturas (Sistema Homuncularium)

Extraído do Capítulo do Mestre — regras mecânicas para a calculadora/gerador de criaturas do app.

## Estrutura de uma criatura
- **Poder**: atributo central da criatura (substitui Parâmetros individuais em vários cálculos)
- **Parâmetros Ofensivos**: equivalem a Precisão + Canalização somados
- **Parâmetros Defensivos**: equivalem a Agilidade + Espírito + Vigor somados (Narrador pode usar Bloqueio no lugar de Agilidade)
- **Dificuldade**: Fácil / Normal / Difícil / Extrema — define limites e Pontos de Desafio
- **Nível de Criatura**: por padrão = maior Nível de Despertar do grupo de jogadores

## Limites de Parâmetros por Dificuldade
| Dificuldade | Máx. por categoria de Parâmetro |
|---|---|
| Fácil / Normal | 4 pontos |
| Difícil / Extrema | 6 pontos |

## Pontos de Vida adicionais por Nível de Criatura
| Dificuldade | PV adicionais por Nível de Criatura |
|---|---|
| Fácil | +4 |
| Normal | +8 |
| Difícil | +16 |
| Extrema | +32 |

- PE adicional = metade do total de Níveis de Criatura
- A cada 6 Níveis de Criatura: +1 Poder e +1 ponto (Ofensivo ou Defensivo, à escolha)

## Ataques padrão (toda criatura com Característica do Homuncularium)
- **Golpe Brutal** — Ação Ativa, Ataque Físico corpo a corpo (1m, +3m por Ação Simples/Rápida/1 PE): 1d8 de Dano Físico por ponto de Poder
- **Evocação Mística** — 1 PE, Ação Ativa, Ataque Mágico (Conjuração, 8m): 1d8 de Dano Mágico Neutro por ponto de Poder
- Se Dificuldade Difícil ou Extrema: o dado de ambos os ataques vira d10 em vez de d8

## Características (traços)
- Organizadas em 9 "Livros" (ver `caracteristicas_criatura.csv`), cada um com traços Fáceis/Normais/Difíceis/Extremas
- Uma criatura só pode ter Características da sua Dificuldade ou inferior
- O número de Características que uma criatura pode ter é definido pelo Narrador ao criá-la
- Não pode repetir a mesma Característica duas vezes
- Tipos especiais de Característica (só pode ter 1 de cada, exceto onde indicado):
  - **Ação Final**: só ativa ao chegar a 0 PV ou menos
  - **Cólera**: só ativa ao chegar à metade do PV pela 1ª vez (só criaturas Extremas)
  - **Presença**: efeito de área contínuo
  - **Característica Adicional**: vem grátis ao ter qualquer traço daquele Livro (não conta no limite)

## Outras regras fixas do Homuncularium
- Conhecimentos: usa o valor de Poder em todos os testes
- Movimentação base: 6m, +1m a cada 2 pontos em Parâmetros Defensivos
- Percepção Passiva: 6 + Poder
- Não recebem efeito de Poções nem de equipamentos (armas/armaduras/relíquias)
- Morrem ao chegar a 0 PV ou menos (sem Dado de Morte)

## Pontos de Desafio (balanceamento de combate)
- Cada jogador em combate = 2 Pontos de Desafio (grupo de 4 = 8 Pontos de Desafio)
- Custo por criatura:
  | Dificuldade | Pontos de Desafio |
  |---|---|
  | Fácil | 1 |
  | Normal | 2 |
  | Difícil | 6 |
  | Extrema | 8 |
- Pontos de Desafio sobrando (ao usar criatura Difícil/Extrema) podem virar bônus:
  - 2 pontos → Ação Simples ou Rápida adicional
  - 4 pontos → turno adicional (com nova Iniciativa) + Ação Rápida adicional
- Recomendação: no máximo 1 inimigo por jogador na mesa, para facilitar a gestão

## Ficha rápida de "Personagem Legado" (NPC hostil usando regras de personagem)
| Dificuldade | PV | PE | Poder | Parâmetros (cada categoria) | Nº de Características |
|---|---|---|---|---|---|
| Fácil | 25 | 2 | 1 | 2 | 2 |
| Normal | 40 | 4 | 2 | 3 | 3 |
| Difícil | 80 | 8 | 3 | 4 | 4 |
| Extrema | 120 | 12 | 4 | 5 | 5 |

- Poder equivale a Brutalidade + Destreza + Arcanismo (máx. 6)
- Parâmetros divididos em Ofensivos (Precisão+Canalização) e Defensivos (Agilidade ou Bloqueio + Espírito + Vigor)
- Nº de Habilidades de Caminho: Fácil=2, Normal=3, Difícil=4 (com 1 Aprimoramento cada), Extrema=5 (com todos os Aprimoramentos)
- Não recebe bônus de equipamentos (armas/armaduras)
- 7 pontos de Conhecimento + 2 Maestrias iniciais

## Observação sobre o "Códice de Criaturas"
O livro também traz um bestiário pronto (criaturas já montadas com nome, PV/PE/Poder e Características escolhidas), organizado por Dificuldade. Não foi extraído nesta passada por ser um conjunto separado de "criaturas prontas" (não são "características" em si) — posso extrair isso depois se for útil como ponto de partida/inspiração para novas criaturas.
