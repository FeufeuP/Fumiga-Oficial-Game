# FUMIGA Preview — Stage 1 Risk Slice

## Objetivo

Construir um preview jogável que prove a identidade inicial do FUMIGA: uma câmara subterrânea em pixel art procedural, uma Rainha protegida por formigas autônomas, recursos coletáveis e pausa tática acionada por long press com Menu Radial.

## Escopo desta entrega

- Phaser 3 rodando dentro de React/WebDev;
- canvas responsivo 16:9;
- câmara subterrânea desenhada proceduralmente;
- Rainha central;
- formigas operárias se deslocando em loop;
- nós de Biomassa;
- long press de 300 ms;
- `timeScale = 0.1` durante pausa tática;
- Menu Radial com Cavar, Atacar e Coletar;
- marcador visual de feromônio;
- HUD React sobreposto;
- screenshot do preview no WebDev.

## Fora do escopo

A* real, Behavior Trees completas, spritesheets finais, colisões, combate resolvido, save, cartas, sinergias, assets finais e APK.

## Critérios de verificação

1. A página abre sem erros de TypeScript ou runtime.
2. A câmara, Rainha, operárias e Biomassa ficam visíveis em desktop e mobile.
3. Segurar o dedo/mouse por aproximadamente 300 ms abre o Menu Radial no ponto pressionado.
4. Durante o long press o mundo desacelera visualmente.
5. Soltar sobre uma fatia cria marcador de feromônio e atualiza o HUD.
6. O preview mostra claramente o status da pausa tática.
