/**
 * EventBus
 * Zentrale Kommunikationsschnittstelle für Ereignisse zwischen Komponenten
 */
export class EventBus {
  private static instance: EventBus;
  private events: Map<string, Array<(data?: any) => void>>;

  private constructor() {
    this.events = new Map();
  }

  /**
   * Gibt die Singleton-Instanz des EventBus zurück
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Setzt die Instanz des EventBus zurück
   * Wird beim Neustart des Spiels aufgerufen
   */
  public static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.removeAllEvents();
    }
  }

  /**
   * Registriert einen Event-Listener
   * @param event Event-Name
   * @param callback Callback-Funktion
   */
  public on(event: string, callback: (data?: any) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(callback);
  }

  /**
   * Entfernt einen Event-Listener
   * @param event Event-Name
   * @param callback Callback-Funktion
   */
  public off(event: string, callback: (data?: any) => void): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Löst ein Event aus
   * @param event Event-Name
   * @param data Event-Daten
   */
  public emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Entfernt alle Event-Listener für ein bestimmtes Event
   * @param event Event-Name
   */
  public removeAllListeners(event: string): void {
    this.events.delete(event);
  }

  /**
   * Entfernt alle Event-Listener
   */
  public removeAllEvents(): void {
    this.events.clear();
  }
}

// Event-Typen
export enum EventType {
  PLAYER_CREATED = 'PLAYER_CREATED',
  ENEMY_KILLED = 'ENEMY_KILLED',
  ENEMY_DESTROYED = 'ENEMY_DESTROYED',
  BOSS_SPAWNED = 'BOSS_SPAWNED',
  PLAYER_DAMAGED = 'PLAYER_DAMAGED',
  PLAYER_HEALED = 'PLAYER_HEALED',
  PLAYER_DESTROYED = 'PLAYER_DESTROYED',
  SCORE_CHANGED = 'SCORE_CHANGED',
  DIFFICULTY_CHANGED = 'DIFFICULTY_CHANGED',
  GAME_OVER = 'GAME_OVER',
  PAUSE_GAME = 'PAUSE_GAME',
  RESUME_GAME = 'RESUME_GAME',
  PICKUP_COLLECTED = 'PICKUP_COLLECTED',
  ASTEROID_DESTROYED = 'ASTEROID_DESTROYED',
  BOSS_DESTROYED = 'BOSS_DESTROYED',
  GAME_START = 'GAME_START',
  POWER_PICKUP_COLLECTED = 'POWER_PICKUP_COLLECTED'
} 