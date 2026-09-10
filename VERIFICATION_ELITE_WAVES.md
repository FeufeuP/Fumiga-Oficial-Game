# Verificação — Ondas elite

## Regras

A cada terceira onda (`3, 6, 9...`) o `WaveDirector` converte o primeiro inimigo da composição em uma variante elite, pagando o dobro do orçamento de ameaça. As variantes recebem 1,8x HP, escala visual maior, aro âmbar, identificação `ELITE`, habilidade exclusiva e recompensa maior.

- **Centopeia Elite — Ninhada Ácida:** veneno prolongado na Rainha.
- **Besouro Elite — Carapaça Refletora:** dano físico muito reduzido, dano pesado à Rainha e interrupção das rotas.
- **Aranha Elite — Teia de Domínio:** imobiliza rotas dos soldados e reduz a velocidade por mais tempo.
- **Vespa Elite — Enxame de Ferrões:** atinge todas as coletoras simultaneamente.

As ondas continuam adaptativas: HP da Rainha, Biomassa e quantidade de soldados alteram o orçamento e a ordem da composição. Elites também concedem +55 Biomassa e +1 Geleia Real.

## Validação

`pnpm check` e `pnpm build` passaram. O preview iniciou a run e manteve o contador `ONDA 1 · PRÓXIMA EM 16s` visível. A captura do gameplay mostrou os indicadores de habilidade/resistência sobre as ameaças e o sistema permanece integrado ao ciclo de invasões.
