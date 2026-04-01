import { EventEmitter } from 'events';

import { AggregatedSocketEvent } from './types';

class ControlPlaneEventBus {
  private readonly emitter = new EventEmitter();

  public on(listener: (event: AggregatedSocketEvent) => void) {
    this.emitter.on('event', listener);
    return () => this.emitter.off('event', listener);
  }

  public emit(event: AggregatedSocketEvent): void {
    this.emitter.emit('event', event);
  }
}

const globalForEventBus = globalThis as typeof globalThis & {
  __controlPlaneEventBus?: ControlPlaneEventBus;
};

export function getControlPlaneEventBus(): ControlPlaneEventBus {
  if (!globalForEventBus.__controlPlaneEventBus) {
    globalForEventBus.__controlPlaneEventBus = new ControlPlaneEventBus();
  }

  return globalForEventBus.__controlPlaneEventBus;
}
