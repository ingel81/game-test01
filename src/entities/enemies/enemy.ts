import { GameObject } from '../gameObject';
import { Constants } from '../../utils/constants';
import { EventBus, EventType } from '../../utils/eventBus';

/**
 * Abstrakte Basisklasse für alle Feinde
 */
export abstract class Enemy extends GameObject {
  protected speed: number;
  protected scoreValue: number;
  protected eventBus: EventBus;
  protected lastShotTime: number = 0;
  protected fireRate: number;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    texture: string, 
    health: number,
    speed: number,
    scoreValue: number,
    fireRate: number
  ) {
    super(scene, x, y, texture, health);
    this.speed = speed;
    this.scoreValue = scoreValue;
    this.fireRate = fireRate;
    this.eventBus = EventBus.getInstance();
    
    // Setze die Standardeigenschaften
    this.sprite.setData('type', 'enemy');
  }

  /**
   * Bewegung des Feindes
   */
  protected abstract move(time: number, delta: number): void;

  /**
   * Schießen des Feindes
   */
  protected abstract shoot(time: number): void;

  /**
   * Aktualisiert den Feind
   */
  public update(time: number, delta: number): void {
    if (this.isDestroyed) return;
    
    this.move(time, delta);
    this.shoot(time);
  }

  /**
   * Wird aufgerufen, wenn der Feind zerstört wird
   * Wichtig: Keine Bullets/Projektile deaktivieren, damit sie weiterfliegen können
   */
  protected onDestroy(): void {
    console.log('Enemy: onDestroy aufgerufen, Position:', this.sprite.x, this.sprite.y);
    // Erstelle eine Explosion
    const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, Constants.ASSET_EXPLOSION_1);
    explosion.play('explode');

    // Spiele einen Sound
    this.scene.sound.play(Constants.SOUND_EXPLOSION, {
      volume: 0.3
    });

    // Vergebe Punkte
    this.eventBus.emit(EventType.ENEMY_KILLED, this.scoreValue);

    // Prüfe, ob ein Energie-Pickup erstellt werden soll
    if (Math.random() < Constants.ENEMY_DROP_CHANCE) {
      this.createEnergyPickup();
    }
  }

  /**
   * Wird aufgerufen, wenn der Feind mit einem anderen Objekt kollidiert
   */
  protected onCollision(other: GameObject): void {
    // Implementieren in abgeleiteten Klassen
  }

  /**
   * Erstellt ein Energie-Pickup an der aktuellen Position
   */
  private createEnergyPickup(): void {
    console.log('Enemy: createEnergyPickup aufgerufen, Position:', this.sprite.x, this.sprite.y);
    // Hier könnte der SpawnManager verwendet werden, um das Pickup zu erzeugen
    this.eventBus.emit('CREATE_ENERGY_PICKUP', { x: this.sprite.x, y: this.sprite.y });
    console.log('Enemy: CREATE_ENERGY_PICKUP Event gesendet');
  }

  /**
   * Prüft, ob der Feind noch auf dem Bildschirm ist
   */
  protected isOnScreen(): boolean {
    const bounds = new Phaser.Geom.Rectangle(
      0, 
      0, 
      this.scene.scale.width, 
      this.scene.scale.height
    );
    
    return bounds.contains(this.sprite.x, this.sprite.y);
  }

  /**
   * Gibt die Bullets des Feindes zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.scene.physics.add.group();
  }
} 