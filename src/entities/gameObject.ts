import { Entity } from './entity';

/**
 * GameObject-Klasse
 * Erweitert Entity um Funktionen für interaktive Spielobjekte wie Gesundheit und Kollisionen.
 */
export abstract class GameObject extends Entity {
  protected health: number;
  protected maxHealth: number;
  public isDestroyed: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, health: number) {
    super(scene, x, y, texture);
    this.health = this.maxHealth = health;
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
    
    console.log(`Schaden erhalten: ${amount}, Gesundheit vor Schaden: ${this.health}`);
    
    this.health -= amount;
    
    // Begrenzen auf nicht-negative Werte
    this.health = Math.max(0, this.health);
    
    console.log(`Gesundheit nach Schaden: ${this.health}`);
    
    if (this.health <= 0) {
      this.health = 0;
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
   * Zerstört die Entität und gibt Ressourcen frei
   * Überschreibt die Basismethode, um sicherzustellen, dass onDestroy aufgerufen wird
   */
  public destroy(): void {
    console.log('GameObject: destroy aufgerufen');
    if (!this.isDestroyed) {
      this.onDestroy();
      this.isDestroyed = true;
    }
    // Rufe die Basis-Destroy-Methode auf
    super.destroy();
  }
} 