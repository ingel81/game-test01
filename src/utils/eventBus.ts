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
  ENEMY_DESTROYED = 'enemy_destroyed',
  PLAYER_DESTROYED = 'player_destroyed',
  GAME_OVER = 'game_over',
  GAME_RESUMED = 'game_resumed',
  PAUSE_GAME = 'pause_game',
  RESUME_GAME = 'resume_game',
  PICKUP_COLLECTED = 'pickup_collected',
  
  // Ereignisse für Gegner und Gameplay
  DEBUG_TOGGLED = 'debug_toggled',
  
  // Neue Level-bezogene Events
  LEVEL_STARTED = 'level_started',
  LEVEL_ENDING = 'level_ending',
  LEVEL_ENEMIES_CLEARED = 'level_enemies_cleared',
  LEVEL_COMPLETED = 'level_completed',
  NEXT_LEVEL_STARTING = 'next_level_starting',
  
  // Spielerfolgs-Events
  GAME_WON = 'game_won',
  
  // Fehlende Event-Typen hinzufügen
  ASTEROID_DESTROYED = 'asteroid_destroyed',
  POWER_PICKUP_COLLECTED = 'power_pickup_collected',
  BOSS_DESTROYED = 'boss_destroyed',
  ENEMY_KILLED = 'enemy_killed',
  PLAYER_DAMAGED = 'player_damaged',
  PLAYER_HEALED = 'player_healed',
  
  // Fehlende Events, die im Code verwendet werden
  SCORE_CHANGED = 'score_changed',
  
  // Zusätzliche String-Events aus der Codebase
  REGISTER_ENEMY_BULLET = 'REGISTER_ENEMY_BULLET',
  CREATE_SMALL_ASTEROID = 'CREATE_SMALL_ASTEROID',
  CREATE_ENERGY_PICKUP = 'CREATE_ENERGY_PICKUP',
  CREATE_POWER_PICKUP = 'CREATE_POWER_PICKUP',
  DESTROY_ASTEROID = 'DESTROY_ASTEROID',
  
  // Neues Event für still entfernte Gegner
  ENEMY_REMOVED = 'enemy_removed',
} 