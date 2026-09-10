# Verificação — Menu cinematográfico

A nova arte do menu foi aplicada com fundo panorâmico em pixel art, pôr do sol ocre/coral, água refletiva e silhueta monumental orgânica no lado direito. O título foi removido do tratamento rosa anterior e voltou a uma solução clara com sombra quente. Os botões foram convertidos em barras horizontais vinho/coral com acento dourado, posicionadas no terço esquerdo e integradas ao horizonte, sem cartões creme deslocados.

Build TypeScript e build de produção passaram. Screenshot 1280x720 confirmou leitura do título, contraste da navegação e coerência entre fundo e controles.

## Direção aplicada

A referência do usuário foi usada apenas para princípios gerais de composição e atmosfera de menu pixel art cinematográfico; o cenário gerado é original, com arquitetura orgânica do FUMIGA e sem copiar personagens, texto ou composição específica.

## Próximo teste

Validar o botão Jogar e a leitura em viewport horizontal menor antes de salvar o checkpoint.

## Validação interativa

O botão `JOGAR` abriu corretamente a simulação da superfície e preservou o fluxo atual do Beta. Em 960×540 landscape, o título, a silhueta do cenário, as barras de navegação e o rodapé permaneceram legíveis e alinhados.

## Tipografia e movimento

O título foi ampliado de forma expressiva, o subtítulo também recebeu escala maior e ambos possuem movimento contínuo sutil. Os botões ficaram mais arredondados, maiores e receberam animação de respiração, hover e compressão ao toque. Em 960×540 landscape, o subtítulo não sobrepõe mais a navegação após o ajuste responsivo.

## Transição cinematográfica

Ao clicar em `JOGAR`, o botão muda para `ENTRANDO NO MUNDO...`, os elementos do menu desaparecem suavemente, o cenário aproxima-se com escala e saturação, e uma camada radial apresenta `O INSTINTO DESPERTA` / `entrando no Bosque Úmido`. Após aproximadamente 1,25 segundo, a transição conclui e o canvas do Beta é montado com a superfície jogável.
