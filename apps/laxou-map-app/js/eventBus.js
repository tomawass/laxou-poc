/**
 * EventBus - Lightweight Pub/Sub Event Bus for Laxou & Nancy Map App
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe handle
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('EventBus callback must be a function');
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event.
   * If callback is provided, removes that specific listener.
   * If callback is omitted, removes all listeners for the event.
   * @param {string} event 
   * @param {Function} [callback] 
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    if (typeof callback === 'function') {
      const set = this.listeners.get(event);
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * Subscribe to an event for one-time execution.
   * @param {string} event 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe handle
   */
  once(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('EventBus callback must be a function');
    }
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    wrapper.originalCallback = callback;
    return this.on(event, wrapper);
  }

  /**
   * Emit an event with data.
   * Iterates over a snapshot to be safe if a listener modifies listeners.
   * @param {string} event 
   * @param {*} [data] 
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    const set = this.listeners.get(event);
    const snapshot = Array.from(set);

    for (const callback of snapshot) {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in EventBus listener for event "${event}":`, err);
      }
    }
  }

  /**
   * Clear all event listeners.
   */
  clear() {
    this.listeners.clear();
  }
}

export const defaultEventBus = new EventBus();
