import type { Task, Vec2 } from '../core/Contracts';
import { DomainEventBus } from '../core/DomainEventBus';

export class TaskSystem {
  private tasks = new Map<string, Task>();
  private sequence = 0;

  constructor(private readonly events: DomainEventBus) {}

  create(type: Task['type'], target: Vec2, now = Date.now(), targetEntityId?: string): Task {
    const task: Task = { id: `task-${++this.sequence}`, type, target, targetEntityId, status: 'available', createdAt: now, updatedAt: now };
    this.tasks.set(task.id, task);
    this.events.emit('TASK_CREATED', { task: { ...task } });
    return { ...task };
  }

  reserve(taskId: string, entityId: string, now = Date.now()): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'available') return false;
    task.status = 'reserved'; task.assignedEntityId = entityId; task.updatedAt = now;
    this.events.emit('TASK_RESERVED', { taskId, entityId });
    return true;
  }

  start(taskId: string, now = Date.now()): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'reserved') return false;
    task.status = 'in_progress'; task.updatedAt = now; return true;
  }

  complete(taskId: string, now = Date.now()): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedEntityId || task.status !== 'in_progress') return false;
    task.status = 'completed'; task.updatedAt = now;
    this.events.emit('TASK_COMPLETED', { taskId, entityId: task.assignedEntityId });
    return true;
  }

  fail(taskId: string, reason: string, now = Date.now()): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedEntityId || task.status === 'completed') return false;
    task.status = 'failed'; task.updatedAt = now;
    this.events.emit('TASK_FAILED', { taskId, entityId: task.assignedEntityId, reason });
    return true;
  }

  list(): Task[] { return Array.from(this.tasks.values()).map((task) => ({ ...task })); }
}
