import { GameObject } from '../gameObject';
import { Constants } from '../../utils/constants';
import { EventBus, EventType } from '../../utils/eventBus';
import { Player } from '../player/player';
import { Helpers } from '../../utils/helpers';

/**
 * Asteroid-Klasse
 */
export class Asteroid extends GameObject {
  private rotationSpeed: number;
  private eventBus: EventBus;
  private scoreValue: number;
  private size: 'large' | 'small';

  constructor(scene: Phaser.Scene, x: number, y: number, size: 'large' | 'small' = 'large') {
    // Wähle das richtige Asset und Gesundheit basierend auf der Größe
    const texture = size === 'large' ? Constants.ASSET_ASTEROID : Constants.ASSET_ASTEROID_SMALL;
    const health = size === 'large' ? Constants.ASTEROID_HEALTH : Constants.ASTEROID_HEALTH / 2;
    const scale = size === 'large' ? 1.5 : 1;
    const score = size === 'large' ? Constants.ASTEROID_SCORE : Constants.ASTEROID_SCORE / 2;
    
    super(scene, x, y, texture, health);
    
    this.size = size;
    this.scoreValue = score;
    this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    this.eventBus = EventBus.getInstance();
    
    // Setze die Größe und Drehung
    this.sprite.setScale(scale);
    this.sprite.setAngularVelocity(this.rotationSpeed * 100);
    
    // Y-Geschwindigkeit sehr gering oder null halten
    const speedY = (Math.random() - 0.5) * 5; // Minimal oder null
    
    // Asteroid bewegt sich hauptsächlich nach links mit konstanter Geschwindigkeit
    const speedX = -Constants.ASTEROID_SPEED;
    this.sprite.setVelocity(speedX, speedY);
    
    // Setze Eigenschaften für Kollisionen
    this.sprite.setData('type', 'asteroid');
    this.sprite.setData('size', size);
    this.sprite.setData('health', health);
    this.sprite.setData('instance', this);
    
    // Optimierung für die Physik-Engine
    this.sprite.setDamping(true);
    this.sprite.setDrag(0.99, 0.99);
    
    // Stelle sicher, dass es sich um einen dynamischen Body handelt
    if (this.sprite.body && 'useDamping' in this.sprite.body) {
      (this.sprite.body as Phaser.Physics.Arcade.Body).useDamping = true;
    }
    
    // Event-Handler für das DESTROY_ASTEROID-Event registrieren
    this.eventBus.on('DESTROY_ASTEROID', this.handleDestroyEvent);
  }

  /**
   * Aktualisiert den Asteroiden
   */
  public update(time: number, delta: number): void {
    // Feste Position für stabilere Bewegung verwenden
    this.sprite.x -= (Constants.ASTEROID_SPEED / 60); // Konstante Bewegung in X-Richtung
    
    // Nur leichte Y-Bewegung, falls vorhanden
    if (this.sprite.body.velocity.y !== 0) {
      // Drifting-Effekt beibehalten, aber minimiert
      this.sprite.y += this.sprite.body.velocity.y / 200;
    }
    
    // Zurücksetzen der X-Geschwindigkeit, um keine Beschleunigung zu haben
    this.sprite.setVelocityX(-Constants.ASTEROID_SPEED);
    
    // Wenn der Asteroid aus dem Bildschirm fliegt, zerstöre ihn
    if (this.sprite.x < -100 || 
        this.sprite.y < -100 || 
        this.sprite.y > this.scene.scale.height + 100) {
      this.destroy();
    }
  }

  /**
   * Behandelt das DESTROY_ASTEROID-Event
   */
  private handleDestroyEvent = (asteroid: Phaser.GameObjects.GameObject): void => {
    try {
      // Prüfe, ob das Event für diesen Asteroid bestimmt ist
      if (asteroid === this.sprite) {
        this.destroy();
        return;
      }
      
      // Sicherheitsüberprüfung für data und data.values
      if (asteroid && 
          asteroid.data && 
          asteroid.data.values && 
          'instance' in asteroid.data.values && 
          asteroid.data.values.instance === this) {
        this.destroy();
      }
    } catch (error) {
      console.error('[ASTEROID] Fehler beim Verarbeiten des DESTROY_ASTEROID-Events:', error);
    }
  }

  /**
   * Wird aufgerufen, wenn der Asteroid zerstört wird
   */
  protected onDestroy(): void {
    // Position des Asteroiden für die Explosion sichern, da das Sprite bald entfernt wird
    const explosionX = this.sprite.x;
    const explosionY = this.sprite.y;
    
    // Physik-Körper deaktivieren, um Debug-Anzeige zu entfernen
    if (this.sprite.body) {
      // Deaktiviere den Physik-Körper vollständig
      this.scene.physics.world.disable(this.sprite);
      this.sprite.body.enable = false;
    }
    
    // Erstelle eine Explosion mit der zentralen Helper-Funktion
    const explosionScale = this.size === 'large' ? 2 : 1.2;
    Helpers.createExplosion(
      this.scene, 
      explosionX, 
      explosionY, 
      explosionScale
    );

    // Vergebe Punkte
    this.eventBus.emit(EventType.ASTEROID_DESTROYED, this.scoreValue);

    // Wenn ein großer Asteroid zerstört wird, erschaffe kleinere Asteroiden
    if (this.size === 'large') {
      this.createSmallAsteroids();
    }
    
    // Stelle sicher, dass das Sprite inaktiv ist, bevor es komplett entfernt wird
    this.sprite.setActive(false);
    this.sprite.setVisible(false);
    
    // Event-Listener entfernen
    this.eventBus.off('DESTROY_ASTEROID', this.handleDestroyEvent);
  }

  /**
   * Wird aufgerufen, wenn der Asteroid mit einem anderen Objekt kollidiert
   */
  protected onCollision(other: GameObject): void {
    // Füge Spieler Schaden zu
    if (other instanceof Player) {
      other.takeDamage(15);
      
      // Asteroiden nehmen auch Schaden bei Kollision mit dem Spieler
      this.takeDamage(this.size === 'large' ? 20 : this.health);
    }
  }

  /**
   * Erstellt kleinere Asteroiden, wenn ein großer zerstört wird
   */
  private createSmallAsteroids(): void {
    // Speichere die aktuellen Koordinaten, da das Sprite später nicht mehr verfügbar sein kann
    const currentX = this.sprite.x;
    const currentY = this.sprite.y;
    
    // Reduziert von 2-3 auf nur 1-2 kleine Asteroiden
    const numAsteroids = 1 + Math.floor(Math.random() * 2);
    
    try {
      for (let i = 0; i < numAsteroids; i++) {
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        
        // 50% Chance, dass überhaupt ein kleiner Asteroid gespawnt wird
        if (Math.random() < 0.5) {
          // Erstelle kleinere Asteroiden über den EventBus, wird vom SpawnManager verarbeitet
          this.eventBus.emit('CREATE_SMALL_ASTEROID', {
            x: currentX + offsetX,
            y: currentY + offsetY
          });
        }
      }
    } catch (error) {
      console.error('[ASTEROID] Fehler beim Erstellen kleiner Asteroiden:', error);
    }
  }
} 