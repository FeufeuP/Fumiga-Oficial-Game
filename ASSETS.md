# FUMIGA Preview — Assets

## Direção visual

Pixel art 16-bit em uma apresentação 2.5D leve: terra vulcânica escura, âmbar mineral, verde de biomassa, silhuetas legíveis de formigas e leitura top-down com profundidade sugerida por sombras.

## Spritesheets integradas — Stage 2

As três entidades principais agora são carregadas pelo Phaser 3 com `this.load.spritesheet`, `frameWidth`, `frameHeight` e animações nomeadas. Os arquivos são PNG RGBA 8-bit por canal, com filtro nearest e grades fixas.

| Asset | Frame | Grade | Animações ativas no preview | Storage |
|---|---:|---:|---|---|
| Rainha | 48×48 | 8×7 / 384×336 | `queen-idle` | `/manus-storage/queen_sheet_015984d6.png` |
| Operária | 32×32 | 8×6 / 256×192 | `worker-idle`, `worker-walk`, `worker-carry` | `/manus-storage/worker_sheet_54bc13d9.png` |
| Biomassa | 32×32 | 8×2 / 256×64 | `biomass-idle` | `/manus-storage/biomass_sheet_7499522d.png` |

O manifesto completo está em `assets/data/spritesheet-manifest.json`. As linhas de hurt, death, dig, egg-laying e collected já estão reservadas na grade para as próximas regras de jogo.

## Direção visual gerada

A referência visual do Stage 0 está em `/manus-storage/fumiga-visual-target-stage0_aa3a44e2.png` e continua disponível pelo botão `ART BIBLE` do HUD.

## Próximo pacote visual

Tiles subterrâneos 32×32, props de câmara, efeitos de feromônio e um painel Nine-Slice 32×32 com bordas de 8 px.
