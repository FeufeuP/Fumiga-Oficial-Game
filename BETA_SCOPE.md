# FUMIGA — Beta 0.1

## Definição da entrega

Este Beta é um vertical slice jogável para navegador, executado no preview WebDev com Phaser 3. Ele representa as principais funcionalidades do jogo em escala reduzida, sem alegar que o conteúdo completo de produção, o APK Capacitor ou todos os biomas/classes/cartas já estão concluídos.

## Sistemas presentes

| Sistema | Estado no Beta |
|---|---|
| Câmara Central e grid subterrâneo | Jogável em grade 20×12 |
| A* ortogonal | Implementado no `AStarGrid` |
| Escavação indireta | Operária recebe tarefa, calcula rota e libera célula |
| Feromônio de coleta | Coletoras recebem rota para a zona indicada |
| Feromônio de ataque | Soldados recebem rota para a Centopeia |
| Combate básico | HP, dano, morte e drop de Biomassa/Geleia |
| Ameaça à Rainha | Inimigo navega até a Câmara Central e causa dano |
| Economia | Biomassa, capacidade, Despensa e custo de construção |
| Pausa tática | Long press, `timeScale=0.1`, Menu Radial e release |
| Biomassa Especial | Abre escolha genética com pausa total |
| Cartas genéticas | Três opções, confirmação única e efeito demonstrável |
| Sinergia inicial | Venom disponível após Glândula Venenosa + carta starter |
| Game Over | Morte da Rainha encerra a run e liquida recompensa |
| Save local | Perfil e recompensas idempotentes em localStorage |
| Metaprogressão mínima | Geleia Real e estatísticas persistentes |
| Spritesheets | Rainha, Operária e Biomassa em PNG RGBA |

## Fora do escopo do Beta 0.1

O Beta ainda não entrega os 15 biomas, todas as classes Elite, chefes completos, migração entre nós, árvore integral de habilidades, todas as 24 cartas com efeitos fechados, todas as 20 sinergias, áudio final, shader de chroma key em produção, Nine-Slice final, testes automatizados abrangentes ou empacotamento APK.

## Critério de sucesso

O Beta é considerado útil quando o usuário consegue iniciar uma run, observar a colônia, emitir ordens indiretas, escavar, reagir por feromônios, combater uma ameaça, construir uma sala, escolher uma mutação, encerrar por Game Over e iniciar uma nova run no preview.
