# Verificação — Spritesheets exclusivos das castas elite

Foram gerados quatro spritesheets PNG RGBA com grade canônica de 8 colunas por 3 linhas, normalizados para 256×96 px e frames de 32×32 px:

- Espiã: idle, caminhada e infiltração com névoa violeta.
- Cuspidora de Ácido: idle, caminhada e ataque com projétil verde ácido.
- Gigante: idle, caminhada pesada e impacto com poeira vermelha.
- Curandeira: idle, caminhada e cura com partículas ciano/verde.

Os assets são carregados com `this.load.spritesheet`, sem imagens estáticas, usando frameWidth/frameHeight de 32. O Phaser registra 12 animações elite: idle, walk e ability para cada uma das quatro castas. A fábrica de formigas escolhe automaticamente a spritesheet da casta; as ordens de movimento, coleta, ataque e cura alternam os estados correspondentes. Após uma habilidade, a animação retorna para idle ou caminhada.

Os PNGs foram publicados no armazenamento WebDev, o projeto passou em `pnpm check` e `pnpm build`, e o preview horizontal continuou carregando corretamente no navegador.
