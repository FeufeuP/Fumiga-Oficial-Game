# Verificação — Criação de formigas de elite

As classes permanentes desbloqueadas na árvore agora aparecem no HUD como **CASTAS ELITE · INCUBAR**. A interface lista apenas Espiã, Cuspidora de Ácido, Gigante e Curandeira quando o perfil persistente contém seus respectivos desbloqueios.

Cada criação valida a disponibilidade da classe, o estado ativo da run e o custo de Biomassa. A transação gera a formiga na câmara, desconta Biomassa, cria sombra e identificação visual pixelada e registra o comando no log da colônia. As entidades usam a spritesheet de formiga carregada pelo Phaser, com tintes semânticos: roxo para Espiã, verde ácido para Cuspidora, vermelho para Gigante e azul para Curandeira.

A Espiã é rápida e aplica veneno a distância; a Cuspidora dispara dano ácido a distância; a Gigante é lenta, resistente e causa impacto físico pesado; a Curandeira recupera até 10 HP da Rainha a cada seis segundos quando necessário. Espiã, Cuspidora e Gigante seguem feromônios de ataque e recebem decisões pela Behavior Tree. As formigas elite são destruídas e recriadas corretamente em cada nova run.

`pnpm check`, `pnpm build`, entrada no gameplay e validação visual horizontal passaram.
