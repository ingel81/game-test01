import { GameObject } from '../gameObject';
import { Constants } from '../../utils/constants';
import { EventBus } from '../../utils/eventBus';

/**
 * Basisklasse für alle Pickups
 */
export abstract class BasePickup extends GameObject {
  protected eventBus: EventBus;
  protected container: Phaser.GameObjects.Container;
  protected visualCircle: Phaser.GameObjects.Graphics;
  protected visualText: Phaser.GameObjects.Text;
  protected color: number;
  protected text: string;
  protected soundRate: number = 1.5; // Standard-Rate für Sound-Effekt
  private updateEvent: Phaser.Events.EventEmitter;
  
  constructor(scene: Phaser.Scene, x: number, y: number, color: number, text: string) {
    super(scene, x, y, 'particle', 1); // Transparentes Dummy-Sprite für Physik
    
    this.color = color;
    this.text = text;
    this.eventBus = EventBus.getInstance();
    
    // Verstecke das eigentliche Physik-Sprite
    this.sprite.setVisible(false);
    this.sprite.setScale(0.5); // Anpassen der Hitbox-Größe
    
    // Setze die Physik-Hitbox manuell - mache sie kleiner für genauere Kollisionserkennung
    this.sprite.body.setCircle(10);  // Kleinerer Radius als der visuelle Kreis
    
    // Erstelle Container für visuelle Elemente
    this.container = this.scene.add.container(x, y);
    
    // Erstelle den visuellen Kreis
    this.visualCircle = this.scene.add.graphics();
    this.visualCircle.clear();
    this.visualCircle.fillStyle(this.color, 0.8);
    this.visualCircle.fillCircle(0, 0, 15); // Visueller Radius ist 15, Kollisionsradius ist 10
    
    // Füge Text hinzu
    this.visualText = this.scene.add.text(0, 0, this.text, {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'monospace',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Füge die visuellen Elemente zum Container hinzu
    this.container.add([this.visualCircle, this.visualText]);
    
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
    
    // Wichtig: Registriere einen Event-Handler, der in jedem Frame vor der Update-Phase ausgeführt wird
    // Dies stellt sicher, dass die visuelle Darstellung immer mit der Hitbox synchronisiert ist
    this.updateEvent = this.scene.events.on('preupdate', this.syncVisuals, this);
    
    // Timer zum Zerstören des Drops nach der konfigurierten Zeit
    const lifetime = Constants.PICKUP_LIFETIME || 5000; // Fallback von 5 Sekunden
    this.scene.time.delayedCall(lifetime, () => {
      if (this.sprite && this.sprite.active) {
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
   * Synchronisiert die visuelle Darstellung mit der Hitbox
   */
  private syncVisuals(): void {
    if (this.container && this.sprite && this.sprite.active) {
      this.container.setPosition(this.sprite.x, this.sprite.y);
    }
  }

  /**
   * Aktualisiert das Pickup
   */
  public update(time: number, delta: number): void {
    // Prüfe, ob das Pickup aus dem Bildschirm geflogen ist
    if (this.sprite && (this.sprite.x < -50 || this.sprite.y < 0 || this.sprite.y > this.scene.scale.height)) {
      this.destroy();
    }
  }

  /**
   * Wird aufgerufen, wenn das Pickup eingesammelt wird
   */
  public collect(): void {
    // Erstelle einen Aufsammel-Effekt
    const collectEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, this.color, 0.5);
    this.scene.tweens.add({
      targets: collectEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => collectEffect.destroy()
    });
    
    // Spiele einen Sound mit der Rate, die für diesen Pickup-Typ festgelegt wurde
    this.scene.sound.play(Constants.SOUND_EXPLOSION, {
      volume: 0.3,
      rate: this.soundRate
    });

    // Konkrete Implementierung durch abgeleitete Klassen
    this.onCollect();

    // Zerstöre das Pickup
    this.destroy();
  }

  /**
   * Wird von der abgeleiteten Klasse implementiert, um spezifisches Verhalten beim Einsammeln zu definieren
   */
  protected abstract onCollect(): void;

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
    // Entferne den Event-Listener
    if (this.updateEvent) {
      this.scene.events.off('preupdate', this.syncVisuals, this);
    }
    
    // Räume visuelle Ressourcen auf
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    
    if (this.visualCircle) {
      this.visualCircle.destroy();
      this.visualCircle = null;
    }
    
    if (this.visualText) {
      this.visualText.destroy();
      this.visualText = null;
    }
  }
} 