export type EventEmitterHandler<T, Result = unknown> = (value: T) => Result;

export type EventEmitter<T> = {
  /**
   * Register an event handler
   */
  on: (handler: EventEmitterHandler<T>) => void;
  /**
   * Remove an event handler
   */
  off: (handler: EventEmitterHandler<T>) => void;
  /**
   * Remove all event handlers
   */
  offAll: () => void;
  /**
   * Invoke all handlers
   */
  emit: (value: T) => void;
};

export const eventEmitter: <T>() => EventEmitter<T> = <T>() => {
  const set = new Set<EventEmitterHandler<T>>();
  return {
    on(handler: EventEmitterHandler<T>) {
      set.add(handler);
    },
    off(handler: EventEmitterHandler<T>) {
      set.delete(handler);
    },
    offAll() {
      set.clear();
    },
    emit(value: T) {
      set.forEach((handler) => handler(value));
    },
  };
};
