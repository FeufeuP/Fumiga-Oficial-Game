# Verificação — Combate estratégico

## Resistências por inimigo

| Inimigo | Resistência física | Resistência a ácido | Resistência a veneno | Ataque especial |
|---|---:|---:|---:|---|
| Centopeia | 90% | 120% | 45% | Mordida Venenosa: dano imediato e veneno na Rainha por 5 s |
| Besouro Guardião | 55% | 135% | 80% | Impacto de Carapaça: dano alto e interrompe rotas das formigas |
| Aranha de Emboscada | 75% | 65% | 35% | Teia Imobilizante: reduz a velocidade do enxame por 4 s |
| Vespa Predadora | 115% | 80% | 50% | Ferrão Paralisante: dano extra e prioridade sobre coletoras |

Valores acima de 100% representam vulnerabilidade; valores abaixo de 100% representam resistência. O tipo do ataque dos soldados muda conforme as mutações `Cuspe Ácido` e `Glândula Venenosa`, permitindo explorar alvos específicos.

## Validação

`pnpm check` e `pnpm build` passaram. O preview foi aberto e a mutação `Glândula Venenosa` foi aplicada. No subterrâneo, os quatro inimigos apareceram com os indicadores compactos `FIS / ÁC / VEN` visíveis sobre cada silhueta, confirmando que a informação estratégica está disponível durante a partida.
