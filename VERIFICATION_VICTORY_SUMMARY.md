# Verificação — Tela de vitória detalhada

Ao derrotar a Matriarca do Bosque, a cena encerra a run com resultado `victory` e pausa o tempo. O evento `run:ended` agora transporta um `RunSummary` estruturado contendo duração, onda final, eliminações totais, elites derrotadas, chefe derrotado, dano causado, dano recebido, mutações, HP final da Rainha e recompensas.

A tela final apresenta o título **A Matriarca caiu!**, mensagem de conquista do bioma, cards de Biomassa e Geleia Real, confirmação do chefe derrotado e uma grade com as estatísticas de combate. O botão `NOVA RUN` reinicia a colônia como antes. O modal de derrota existente também recebe o payload estruturado sem perder o fluxo de permadeath.

A contagem de dano e recompensas é registrada durante o combate. O resumo é enviado antes do settle da metaprogressão, preservando os valores da partida. `pnpm check`, `pnpm build` e validação visual do menu/fluxo inicial passaram.
