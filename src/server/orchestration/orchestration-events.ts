import type { AppendOrchestrationEventInput, OrchestrationEvent } from '@/domain/orchestration';

/**
 * Publishes orchestration events to subscribers or external buses — no transport in PP-08.
 */
export type OrchestrationEventPublisher = {
  publish(event: AppendOrchestrationEventInput): Promise<OrchestrationEvent>;
};

export type OrchestrationEventSubscriber = {
  readonly subscriberId: string;
  onEvent(event: OrchestrationEvent): Promise<void>;
};

export class InMemoryOrchestrationEventPublisher implements OrchestrationEventPublisher {
  private readonly events: OrchestrationEvent[] = [];
  private sequence = 0;

  constructor(private readonly subscribers: readonly OrchestrationEventSubscriber[] = []) {}

  async publish(input: AppendOrchestrationEventInput): Promise<OrchestrationEvent> {
    this.sequence += 1;
    const event: OrchestrationEvent = {
      ...input,
      eventId: `orch-event-${this.sequence}`,
    };
    this.events.push(event);
    await Promise.all(this.subscribers.map((subscriber) => subscriber.onEvent(event)));
    return event;
  }

  list(): readonly OrchestrationEvent[] {
    return [...this.events];
  }
}

export const ORCHESTRATION_EVENT_TOKENS = {
  publisher: Symbol.for('prompt-pilot.orchestration.OrchestrationEventPublisher'),
} as const;
