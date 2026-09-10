# Verificação — Gameplay limpo e unificado

A tela de gameplay foi simplificada para evitar poluição visual. O selo/imagem que aparecia no canto superior esquerdo foi removido do HUD e a ação `ART BIBLE` também deixou de aparecer no gameplay.

A interface agora exibe somente informação operacional: recursos principais, camada atual, onda e próxima invasão, estado da simulação, mapa, comandos de alternância/construção/mutação e barra da Rainha. Foram removidos do fluxo principal o painel de cérebro do enxame, cards de cooldown, painel de efeitos ativos, estatísticas duplicadas e o bloco de referência visual.

A paleta foi alinhada ao menu inicial: vinho, coral, ocre, creme escuro e verde de sinalização. O fundo branco foi substituído por uma moldura vinho e os painéis receberam contraste quente, bordas douradas e sombras curtas. O modal de mutação também foi ajustado para o mesmo tratamento visual.

`pnpm check`, `pnpm build` e validação visual horizontal passaram.
