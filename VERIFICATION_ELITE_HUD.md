# Verificação — HUD de elites

O HUD React agora recebe `eliteCooldowns` e `activeEffects` pela `BetaHudState` e exibe dois painéis responsivos:

- **ELITES · HABILIDADES:** cada elite viva mostra nome, habilidade, estado `PRONTO` ou segundos restantes e barra de recarga.
- **EFEITOS ATIVOS:** mostra efeitos temporários como `RAINHA · VENENO` e `ENXAME · TEIA`, com duração e cores semânticas.

A cena publica os dados em cada atualização. Cooldowns são calculados a partir do último uso da habilidade; os efeitos são removidos automaticamente quando seus timers expiram. Os timers também são resetados ao iniciar nova run.

`pnpm check` e `pnpm build` passaram. A validação visual em viewport horizontal confirmou a integração do novo HUD e a preservação da leitura dos painéis existentes; os painéis elite aparecem quando uma variante elite é gerada pela terceira onda ou posterior.
