# Verificação — Inimigos com padrões distintos

## Ameaças implementadas

- **Centopeia:** perseguição direta à Rainha, dano moderado e velocidade média.
- **Besouro Guardião:** patrulha em pontos do mapa, possui mais vida, dano elevado e drop maior de Biomassa/Geleia Real quando derrotado.
- **Aranha de Emboscada:** permanece inativa até detectar feromônio de ataque ou proximidade da Rainha; então escolhe uma formiga como ponto de emboscada.
- **Vespa Predadora:** prioriza coletoras, possui maior velocidade e pode derrubar uma coletora em ataques sucessivos.

Todos os inimigos usam `EnemyBrain`, rotas A* no grid e perfis centralizados em `ENEMY_PROFILES`. Os rótulos visuais diferenciam as ameaças no mapa e o HUD passou a mostrar quatro ameaças na inicialização da run.

## Validação parcial

`pnpm check` e `pnpm build` passaram. O preview iniciou corretamente pela tela principal e entrou no gameplay; o HUD mostrou `AMEAÇAS 4`, confirmando a nova formação. O teste visual final de movimentação/combate será concluído após a captura do estado estável do gameplay.

## Validação visual final

A transição para o SUBTERRÂNEO foi validada no navegador. A captura exibiu simultaneamente os quatro inimigos, com rótulos legíveis e silhuetas distintas: Aranha de Emboscada no alto à esquerda, Vespa Predadora no alto à direita, Centopeia no corredor central e Besouro Guardião na região inferior direita. O HUD confirmou `AMEAÇAS 4`, e a simulação permaneceu ativa com a Rainha em `100/100`.
