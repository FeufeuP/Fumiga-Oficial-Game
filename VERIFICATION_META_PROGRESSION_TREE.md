# Verificação — Árvore de metaprogressão

O menu principal agora possui a entrada **PROGRESSÃO / ÁRVORE DA COLÔNIA**. A interface exibe a carteira de Geleia Real, três ramos oficiais — Atributos, Infraestrutura e Elite —, custos, efeitos, pré-requisitos, estado desbloqueado e mensagens de bloqueio.

O catálogo centralizado `META_TREE` contém 16 melhorias compráveis: Carapaça Fortalecida I–II, Pernas Adaptadas, Sorte Genética, Despensa Expandida I–II, Reserva Real, Protocolo de Incubação, Câmara de Fungos, castas Espiã, Cuspidora de Ácido, Gigante e Curandeira, Escavadeira Pesada e Comando da Colônia. Os desbloqueios contemplam as classes e salas avançadas descritas na especificação.

`SaveManager.purchaseNode` valida existência, nível máximo, pré-requisitos e saldo; debita a Geleia Real e grava o perfil em uma transação local. As compras não possuem reembolso. Os efeitos ativos são aplicados na próxima run: HP da Rainha, velocidade de navegação, Biomassa/capacidade iniciais, Biomassa Especial, Operárias e Soldados iniciais. Classes e salas são registradas nos arrays persistentes de desbloqueio.

A árvore foi validada visualmente no menu horizontal; `pnpm check` e `pnpm build` passaram.
