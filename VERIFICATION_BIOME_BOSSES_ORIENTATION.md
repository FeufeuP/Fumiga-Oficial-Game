# Verificação — Orientação e chefes de bioma

## Orientação landscape

O Android já possui `android:screenOrientation="landscape"` no manifest. Agora o ponto de entrada também tenta `screen.orientation.lock("landscape")` quando o WebView/navegador permite. Para browsers que negam o lock automático, menu e gameplay usam fallback CSS em portrait: o palco é dimensionado como landscape e rotacionado, evitando uma tela vertical bloqueadora e mantendo a experiência jogável desde o primeiro carregamento.

## Chefes

A cada décima onda, o `WaveDirector` injeta a **Matriarca do Bosque** como chefe elite da composição. Ela possui 5x HP do Besouro base, escala visual ampliada, aro âmbar, identificação própria, habilidade `PULSO DO PÂNTANO`, dano alto, lentidão de 9 segundos e interrupção das rotas do enxame. O HUD exibe barra de vida, HP atual e habilidade. Ao derrotá-la, a colônia recebe +140 Biomassa e +1 Geleia Real, com burst de partículas ampliado.

`pnpm check`, `pnpm build`, inspeção do manifest e validação visual horizontal passaram.
