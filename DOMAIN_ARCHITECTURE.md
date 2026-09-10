# FUMIGA — Fundação Modular M1

A pasta `client/src/game/domain/` é a primeira camada canônica de domínio. Ela não desenha Phaser e não depende de cenas.

## Módulos criados

- `core/Contracts.ts`: estados de grid, run/meta, entidades, tarefas, intenções, papéis e defaults.
- `core/DomainEventBus.ts`: eventos verificáveis de grid, tarefas, rotas, feromônios, ameaça e morte.
- `grid/GridMap.ts`: matriz autoritativa, estados 0–3, `roomId` separado, versão e conversões.
- `grid/NavigationService.ts`: A* ortogonal e invalidação observável por `gridVersion`.
- `ai/TaskSystem.ts`: reserva atômica e ciclo de tarefas documentado.
- `economy/EconomyManager.ts`: custos oficiais centralizados e transações de Biomassa.
- `persistence/DomainSaveManager.ts`: meta progressão versionada e recompensa de Geleia Real idempotente.

## Regra de integração

`BetaGameScene` continua sendo o adaptador visual durante a migração. A cena não deve tornar-se a autoridade de regras. Toda nova implementação deve chamar os serviços de domínio, emitir eventos e atualizar a view model do HUD.

## Próximo laboratório

Criar um laboratório 12×8 com parede, célula escavável, Operária, tarefa de cavar e rota A*. O laboratório só passa quando: a rota não atravessa estados 0/3; a reserva é única; escavar muda a célula para 1; `GRID_CHANGED` incrementa a versão; a rota antiga é considerada inválida; e `TASK_COMPLETED` ocorre uma única vez.
