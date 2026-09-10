# Verificação — Recordes pessoais

O `SaveManager` agora mantém os cinco melhores resultados em `localStorage` usando a chave versionada `fumiga-beta-records-v1`. O sistema é local, idempotente e separado da recompensa de metaprogressão.

A pontuação combina resultado da run, onda final, eliminações, elites, chefe derrotado, dano causado, Biomassa e Geleia Real, HP restante e penalidades de dano recebido e duração. Ao finalizar, o resumo recebe pontuação, posição local e indicação de novo recorde pessoal. Apenas vitórias entram no top 5.

A tela final de vitória exibe a pontuação formatada, `NOVO RECORDE PESSOAL` quando aplicável, posição no ranking e a tabela dos cinco melhores resultados, destacando a run atual. A tela de derrota continua funcional sem mostrar ranking de vitória. O reset do SaveManager também limpa os recordes. `pnpm check`, `pnpm build` e validação visual do preview passaram.
