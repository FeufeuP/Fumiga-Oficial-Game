# FUMIGA Preview — Memory

- O repositório GitHub original ainda é documental; a fundação Phaser vanilla está na branch `stage-0-foundation`.
- O preview WebDev usa React apenas como host e HUD; o gameplay permanece em classes TypeScript sem acoplamento ao React.
- Phaser deve permanecer na linha 3.x conforme TDD do FUMIGA.
- A primeira fatia usa arte procedural para reduzir risco e validar input/tempo antes das spritesheets.
- A referência visual gerada foi enviada ao storage do WebDev.
- Não usar `timeScale` diretamente na UI. O GameScene controla a pausa tática nesta fatia; um TimeController formal será extraído na próxima etapa.
