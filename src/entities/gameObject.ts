import { Entity } from './entity';
import { EventBus, EventType } from '../utils/eventBus';

/**
 * GameObject-Klasse
 * Erweitert Entity um Funktionen für interaktive Spielobjekte wie Gesundheit und Kollisionen.
 */
export abstract class GameObject extends Entity {
  protected health: number;
  protected maxHealth: number;
  public isDestroyed: boolean = false;
  protected eventBus: EventBus;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, health: number) {
    super(scene, x, y, texture);
    this.health = this.maxHealth = health;
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Verarbeitet eingehenden Schaden
   * @param amount Menge des Schadens
   * @returns True, wenn das Objekt zerstört wurde
   */
  public takeDamage(amount: number): boolean {
    if (this.isDestroyed) return true;
    
    // Stelle sicher, dass der Schaden nicht negativ ist und als Ganzzahl behandelt wird
    amount = Math.max(0, Math.round(amount));
    
    //console.log(`[GAME_OBJECT] takeDamage in ${this.constructor.name}: amount=${amount}, health vorher=${this.health}`);
    
    this.health -= amount;
    
    // Begrenzen auf nicht-negative Werte
    this.health = Math.max(0, this.health);
    
    //console.log(`[GAME_OBJECT] Gesundheit nach Schaden in ${this.constructor.name}: ${this.health}`);
    
    if (this.health <= 0) {
      this.health = 0;
      //console.log(`[GAME_OBJECT] ${this.constructor.name} wird zerstört`);
      this.onDestroy();
      this.isDestroyed = true;
      return true;
    }
    
    return false;
  }

  /**
   * Gibt den aktuellen Gesundheitswert zurück
   */
  public getHealth(): number {
    return this.health;
  }

  /**
   * Gibt den maximalen Gesundheitswert zurück
   */
  public getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Gibt den Gesundheitsprozentsatz zurück
   */
  public getHealthPercentage(): number {
    return this.health / this.maxHealth;
  }

  /**
   * Erhöht die Gesundheit um den angegebenen Wert, maximal bis zum Maximum
   */
  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Wird aufgerufen, wenn dieses Objekt mit einem anderen kollidiert
   */
  protected abstract onCollision(other: GameObject): void;

  /**
   * Wird aufgerufen, wenn dieses Objekt zerstört wird
   */
  protected abstract onDestroy(): void;

  /**
   * Entfernt das GameObject still ohne Effekte
   * Für das Entfernen von Objekten außerhalb des Bildschirms
   */
  public remove(): void {
    // Markiere als zerstört, aber ohne onDestroy aufzurufen
    this.isDestroyed = true;
    
    // Rufe die Basis-Remove-Methode auf
    super.remove();
  }

  /**
   * Zerstört die Entität und gibt Ressourcen frei
   * Überschreibt die Basismethode, um sicherzustellen, dass onDestroy aufgerufen wird
   */
  public destroy(): void {
    console.log('GameObject: destroy aufgerufen');
    
    // Überprüfe, ob wir uns bereits im "Spiel beendet" Zustand befinden
    const isGameEnding = this.scene.registry.get('isGameEnding') || false;
    
    // Prüfe, ob es sich um ein Pickup handelt oder ob das Objekt aktiv zerstört werden soll
    const isPickup = this.constructor.name.includes('Pickup');
    
    // Rufe onDestroy nur auf, wenn:
    // - Das Objekt noch nicht zerstört wurde und
    // - Das Spiel nicht beendet wird ODER es handelt sich um ein Pickup (Pickups brauchen immer onDestroy)
    if (!this.isDestroyed && (!isGameEnding || isPickup)) {
      // Rufe onDestroy auf
      this.onDestroy();
    }
    
    // isDestroyed wird in remove() gesetzt
    this.remove();
  }
} 