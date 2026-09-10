# Verificação — Alertas de habilidades elite

O HUD agora publica `eliteAlert` quando a habilidade de uma elite viva está a até três segundos da ativação. O alerta seleciona a habilidade com menor tempo restante e apresenta nome do inimigo, habilidade, contagem regressiva em décimos e a mensagem `ALERTA DE ELITE · PREPARE-SE`.

Visualmente, o alerta usa um painel central vinho com borda âmbar, pulso vermelho e animação discreta em passos para preservar a leitura pixel art. Em telas estreitas, o painel reduz largura e tipografia sem cobrir o HUD lateral. Ele não intercepta toque, não interfere na pausa tática e desaparece quando a habilidade é ativada ou deixa de estar iminente.

A atualização ocorre em cada frame pelo `emitHud`, mantendo a contagem sincronizada com os cooldowns. `pnpm check` e `pnpm build` passaram; a validação visual horizontal confirmou que o alerta fica oculto durante a run inicial sem elites e que a camada está preparada para aparecer nas ondas elite.
