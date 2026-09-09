# FUMIGA — Etapa Inicial / Stage 0

## Objetivo

Estabelecer uma fundação Phaser 3 executável, modular e verificável para o vertical slice do FUMIGA. Esta etapa não implementa o jogo completo, IA, combate, A*, feromônios ou assets finais. Ela prova que o projeto inicia, carrega cenas, mantém estado de run e suporta uma camada de UI sobreposta.

## Estado verificado antes da etapa

O repositório continha documentação do GDD, TDD, Roadmap e Art Bible, mas não possuía `package.json`, `index.html`, código Phaser, testes, assets jogáveis ou configuração Capacitor. A implementação foi iniciada na branch `stage-0-foundation`.

## Entregas desta etapa

| Entrega | Estado |
|---|---|
| `package.json` com Phaser 3 e Vite | Implementado |
| `index.html` | Implementado |
| CSS mobile-first base | Implementado |
| Configuração Phaser WebGL, fallback implícito e pixel art | Implementado |
| `BootScene` | Implementado |
| `PreloadScene` | Implementado |
| `MainMenuScene` | Implementado |
| `GameScene` com mapa placeholder e Rainha placeholder | Implementado |
| `UIScene` com HUD DOM | Implementado |
| `EventBus` ES6 | Implementado |
| `GameManager` com estado mínimo da run | Implementado |
| Diretórios de assets e sistemas | Criados |
| Spritesheets finais | Fora do escopo |
| IA, A*, feromônios, combate e save | Fora do escopo |

## Fluxo funcional

```text
BootScene
  → PreloadScene
  → MainMenuScene
  → botão Iniciar Run
  → GameScene + UIScene
```

## Critérios de aceite

1. `npm run dev` inicia um servidor local.
2. O navegador mostra a tela de menu sem erro de importação.
3. O botão `INICIAR RUN` abre a cena de jogo.
4. A `GameScene` mostra uma câmara inicial em grid e uma Rainha placeholder.
5. A `UIScene` mostra Biomassa, HP da Rainha e o estado da run.
6. O resize usa `Phaser.Scale.FIT` e mantém o canvas visível.
7. A base usa módulos ES6, sem script global de gameplay.
8. O estado mínimo da run fica fora das cenas em `GameManager`.

## Fora do escopo

Esta etapa não aprova ainda:

- qualidade final da arte;
- sprite sheet ou animação;
- caminho A*;
- comportamento autônomo de formigas;
- escavação por Operária;
- Menu Radial e long press;
- cartas genéticas e sinergias;
- IndexedDB ou Capacitor Preferences;
- build APK.

## Próxima etapa

A próxima etapa deverá validar o contrato visual inicial e o pipeline de spritesheets: manifesto, dimensões dos frames, importação via `this.load.spritesheet`, animações nomeadas e uma cena de teste com a Operária.
