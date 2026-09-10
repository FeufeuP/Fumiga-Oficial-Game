# Verificação visual e interativa — Beta 0.1

## Escopo verificado

O preview Beta abre no WebDev como uma colônia jogável Phaser 3 dentro do host React. A cena mostra o grid de 20×12 células, Câmara Central, Rainha, operárias, coletoras, soldados, quatro nós de Biomassa e uma Centopeia inimiga. O HUD apresenta Biomassa, Geleia Real, Biomassa Especial, classes, salas, escavações, seed e tempo de run.

## Fluxo de mutação verificado

O botão `MUTAÇÃO` abre uma pausa total com `timeScale = 0.0` e três cartas visíveis: Pernas Leves, Carapaça Rígida e Glândula Venenosa. A interface explica que a confirmação é única e mantém o campo visual escurecido atrás do modal.

## Build

`pnpm check` passou sem erros TypeScript. `pnpm build` passou. O preview desktop foi capturado sem erros de dependência ou LSP reportados.

## Limitações conhecidas desta entrega

O Beta já contém a arquitetura e o fluxo dos principais sistemas, mas A*, economia, combate, escavação, feromônios e save ainda são uma implementação de vertical slice demonstrável, não o balanceamento final de produção. A próxima rodada deve testar long press real, confirmação de uma carta, construção da Despensa, combate via feromônio de ataque e Game Over por aproximação da Centopeia.

## Interações adicionais

A carta `Glândula Venenosa` foi confirmada no navegador: o modal fechou, `ESPECIAL` foi consumido e a mensagem do HUD confirmou a sinergia Venom disponível com `Mandíbulas Serrilhadas`. A cena voltou para `SIMULAÇÃO ATIVA` com `×1.0`.

Durante a validação, a descoberta automática de Biomassa Especial após alguns segundos abriu novamente a escolha genética e pausou a simulação. Isso confirma o ciclo de descoberta/pausa, mas a próxima iteração deve impedir reabertura automática repetida na mesma run ou exibir uma notificação não bloqueante quando o modal já foi resolvido.
