# Estrutura do Preview FUMIGA

```text
client/src/
├── App.tsx                 # Moldura da aplicação e rota única
├── pages/Home.tsx          # Entrada do preview
├── components/GameCanvas.tsx
└── game/
    ├── constants.ts        # Contratos de escala, grid e input
    ├── EventBus.ts         # Comunicação gameplay ↔ HUD
    ├── events.ts           # Eventos públicos do jogo
    ├── GameState.ts        # Snapshot serializável do slice
    ├── PhaserGame.ts       # Lifecycle seguro do Phaser
    └── GameScene.ts        # Mundo, entidades placeholder e input tático
```

React controla somente a moldura e o HUD. Phaser controla o canvas, entidades e tempo da simulação. O EventBus transporta fatos; o HUD não altera diretamente a cena.
