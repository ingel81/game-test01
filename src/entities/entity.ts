/**
 * Entity-Basisklasse
 * Grundlage für alle interaktiven und nicht-interaktiven Spielobjekte.
 */
export abstract class Entity {
  protected sprite: Phaser.Physics.Arcade.Sprite;
  protected scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, texture);
  }

  /**
   * Gibt das Phaser-Sprite zurück
   */
  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  /**
   * Aktualisierungsmethode, die in jedem Frame aufgerufen wird
   * @param time Aktuelle Zeit
   * @param delta Zeit seit dem letzten Frame
   */
  public abstract update(time: number, delta: number): void;

  /**
   * Zerstört die Entität und gibt Ressourcen frei
   */
  public destroy(): void {
    console.log('Entity: destroy aufgerufen');
    this.sprite.destroy();
  }

  /**
   * Setzt die Position der Entität
   */
  public setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  /**
   * Setzt die Geschwindigkeit der Entität
   */
  public setVelocity(x: number, y: number): void {
    this.sprite.setVelocity(x, y);
  }
} 