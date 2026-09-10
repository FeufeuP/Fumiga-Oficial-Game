# Verificação — Ondas adaptativas

## Sistema

`WaveDirector` controla a onda atual, o próximo horário e o orçamento de ameaça. A primeira formação contém quatro inimigos distintos. A partir da onda 2, o orçamento cresce gradualmente e escolhe uma composição baseada no estado da colônia: colônias com Rainha saudável e Biomassa alta recebem pressão adicional; colônias com HP crítico recebem uma composição mais leve. A quantidade de soldados também influencia a ordem de seleção, introduzindo mais Vespas e Besouros contra enxames bem defendidos.

As ondas usam posições de entrada distribuídas no grid, limite crescente de inimigos vivos e intervalo progressivamente menor, com teto de segurança. Cada spawn dispara partículas, reação cômica e uma mensagem com a composição da invasão.

## Validação

`pnpm check` e `pnpm build` passaram. O preview iniciou uma nova run e exibiu no HUD `ONDA 1 · PRÓXIMA EM 16s`, mantendo a formação inicial de quatro ameaças e a contagem regressiva visível na superfície. A integração foi feita no loop principal, com reset correto do diretor ao iniciar nova run.
