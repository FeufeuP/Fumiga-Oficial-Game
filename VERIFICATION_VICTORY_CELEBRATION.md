# Verificação — Celebração cinematográfica de vitória

A tela de vitória agora renderiza uma camada de celebração somente quando `RunSummary.result === 'victory'`. A entrada usa flash em etapas, escala elástica do painel e pulso de borda âmbar/verde. O fundo recebe raios radiais pixelados em rotação lenta; o centro apresenta um burst de oito faíscas e 34 confetes coloridos em queda com movimento discreto por steps, preservando a leitura de pixel art.

As cores seguem a identidade FUMIGA: verde ácido para conquista, âmbar para Geleia Real, coral para alerta, azul claro e creme para contraste. A camada fica atrás do conteúdo do painel e não bloqueia botões ou estatísticas. O modal de derrota não recebe confetes nem flash de vitória. `prefers-reduced-motion` desativa as animações contínuas e mantém uma celebração estática acessível.

`pnpm check`, `pnpm build` e validação visual do preview horizontal passaram.
