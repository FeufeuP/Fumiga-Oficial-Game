# Verificação — Expansão de gameplay / IA

## Implementado

Cada formiga agora possui um `AntBrain` baseado em Behavior Trees com nós de condição, sequência, seleção e ação. A prioridade é: soldado defendendo sob feromônio de ataque; coletora coletando ou retornando com carga; operária escavando sob sinal; retorno de formiga carregada; seguimento de rota; espera.

O runtime reavalia as decisões a cada 450 ms, atualiza a intenção de cada formiga e publica telemetria pelo EventBus. O HUD exibe `CÉREBRO DO ENXAME` com o foco atual, e coleta agora alterna entre ida ao alvo, carga, retorno à Câmara Central e entrega de Biomassa.

## Validação

`pnpm check` e `pnpm build` passaram. O preview abriu no navegador, o fluxo Jogar montou a simulação e o HUD apresentou `CÉREBRO DO ENXAME`. O fluxo automático `pnpm build-apk` também executou TypeScript, build web e sincronização Capacitor, mas a compilação Android foi bloqueada pela ausência de Android SDK (`SDK location not found`); nenhum APK foi declarado como gerado.

A tela de mutação automática apareceu durante a run e pausou corretamente o runtime, confirmando que a nova telemetria respeita os estados mutation/gameover.
