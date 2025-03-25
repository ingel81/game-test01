import { GameObject } from '../gameObject';
import { Constants } from '../../utils/constants';
import { EventBus, EventType } from '../../utils/eventBus';

/**
 * EnergyPickup-Klasse
 * Ein Pickup, das die Gesundheit des Spielers wiederherstellt
 */
export class EnergyPickup extends GameObject {
  private healAmount: number = Constants.ENERGY_HEAL_AMOUNT;
  private eventBus: EventBus;
  private container: Phaser.GameObjects.Container;
  private visualCircle: Phaser.GameObjects.Graphics;
  private visualText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'particle', 1); // Transparentes Dummy-Sprite für Physik
    
    this.eventBus = EventBus.getInstance();
    
    // Verstecke das eigentliche Physik-Sprite
    this.sprite.setVisible(false);
    this.sprite.setScale(0.5); // Anpassen der Hitbox-Größe
    
    // Erstelle Container für visuelle Elemente
    this.container = this.scene.add.container(x, y);
    
    // Erstelle den visuellen Kreis
    this.visualCircle = this.scene.add.graphics();
    this.visualCircle.fillStyle(0x00ffff, 0.8);
    this.visualCircle.fillCircle(0, 0, 15);
    this.container.add(this.visualCircle);
    
    // Füge Text hinzu
    this.visualText = this.scene.add.text(0, 0, 'E', {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'monospace',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.container.add(this.visualText);
    
    // Pulsierende Animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Setze die Physik-Eigenschaften
    this.sprite.body.immovable = true;
    
    // Initiiere horizontale Bewegung nach links (langsamer als Feinde)
    this.sprite.setVelocityX(-100);
    
    // Timer zum Zerstören des Drops nach der konfigurierten Zeit
    this.scene.time.delayedCall(Constants.ENERGY_PICKUP_LIFETIME, () => {
      if (this.sprite.active) {
        // Fade-out Animation
        this.scene.tweens.add({
          targets: this.container,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            this.destroy();
          }
        });
      }
    });
  }

  /**
   * Aktualisiert das Pickup
   */
  public update(time: number, delta: number): void {
    // Synchronisiere Container mit der Physik-Position
    if (this.container && this.sprite.active) {
      this.container.setPosition(this.sprite.x, this.sprite.y);
    }
    
    // Wenn das Pickup aus dem Bildschirm fliegt, zerstöre es
    if (this.sprite.x < -50 || this.sprite.y < 0 || this.sprite.y > this.scene.scale.height) {
      this.destroy();
    }
  }

  /**
   * Wird aufgerufen, wenn das Pickup eingesammelt wird
   */
  public collect(): void {
    // Erstelle einen Aufsammel-Effekt
    const collectEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0x00ffff, 0.5);
    this.scene.tweens.add({
      targets: collectEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => collectEffect.destroy()
    });
    
    // Spiele einen Sound
    this.scene.sound.play(Constants.SOUND_EXPLOSION, {
      volume: 0.3,
      rate: 1.5
    });

    // Teile der Spielwelt mit, dass ein Pickup eingesammelt wurde
    this.eventBus.emit(EventType.PICKUP_COLLECTED, this.healAmount);

    // Zerstöre das Pickup
    this.destroy();
  }

  /**
   * Gibt die Heilungsmenge zurück
   */
  public getHealAmount(): number {
    return this.healAmount;
  }

  /**
   * Wird aufgerufen, wenn das Pickup mit einem anderen Objekt kollidiert
   */
  protected onCollision(other: GameObject): void {
    // Keine Kollisionslogik erforderlich
  }

  /**
   * Wird aufgerufen, wenn das Pickup zerstört wird
   */
  protected onDestroy(): void {
    if (this.container) {
      this.container.destroy();
    }
  }
} 