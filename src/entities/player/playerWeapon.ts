import { Constants } from '../../utils/constants';
import { EventBus, EventType } from '../../utils/eventBus';

/**
 * PlayerWeapon-Klasse
 * Verwaltet die Waffe des Spielers und das Schießen
 */
export class PlayerWeapon {
  private scene: Phaser.Scene;
  private bullets: Phaser.Physics.Arcade.Group;
  private lastShotTime: number = 0;
  private powerLevel: number = 1; // Stärke-Level der Waffe, startet bei 1
  private eventBus: EventBus;
  private powerUpHandler: () => void;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    // Arrow-Funktion für den Event-Handler, der gebunden ist
    this.powerUpHandler = () => this.upgradePowerLevel();
    
    this.bullets = this.scene.physics.add.group({
      defaultKey: Constants.ASSET_BULLET,
      maxSize: 60, // Erhöht für mehrere Schüsse
      runChildUpdate: true // Automatische Updates für Kindobjekte aktivieren
    });
    
    // Event-Listener für Weltgrenzen
    this.scene.physics.world.on('worldbounds', this.handleWorldBoundsCollision, this);
    
    // Event-Listener für Power-Pickup
    this.eventBus.on(EventType.POWER_PICKUP_COLLECTED, this.powerUpHandler);
  }

  /**
   * Feuert einen Schuss ab
   */
  public shoot(x: number, y: number): void {
    // Überprüfe gültige Position
    if (x < 0 || x > this.scene.scale.width || y < 0 || y > this.scene.scale.height) {
      return;
    }
    
    // Feuerrate begrenzen (200ms zwischen Schüssen)
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastShotTime < 200) {
      return;
    }
    this.lastShotTime = currentTime;
    
    // Je nach Power-Level verschiedene Schussmuster
    if (this.powerLevel === 1) {
      // Level 1: Einfacher Schuss
      this.createBullet(x + 20, y);
    } else if (this.powerLevel === 2) {
      // Level 2: Drei parallele Schüsse
      this.createBullet(x + 20, y - 15);
      this.createBullet(x + 20, y);
      this.createBullet(x + 20, y + 15);
    } else if (this.powerLevel === 3) {
      // Level 3: Drei parallele Schüsse + zwei im 45-Grad-Winkel
      this.createBullet(x + 20, y - 15);
      this.createBullet(x + 20, y);
      this.createBullet(x + 20, y + 15);
      
      // Schüsse im 45-Grad-Winkel
      this.createAngledBullet(x + 20, y, -45);
      this.createAngledBullet(x + 20, y, 45);
    } else if (this.powerLevel >= 4) {
      // Level 4+: Fünf parallele Schüsse + vier im 45-Grad-Winkel
      this.createBullet(x + 20, y - 25);
      this.createBullet(x + 20, y - 12);
      this.createBullet(x + 20, y);
      this.createBullet(x + 20, y + 12);
      this.createBullet(x + 20, y + 25);
      
      // Schüsse im 45-Grad-Winkel
      this.createAngledBullet(x + 20, y - 15, -45);
      this.createAngledBullet(x + 20, y + 15, 45);
      this.createAngledBullet(x + 20, y - 15, -30);
      this.createAngledBullet(x + 20, y + 15, 30);
    }
    
    // Spiele den Sound
    this.scene.sound.play(Constants.SOUND_SHOOT, {
      volume: 0.3,
      detune: Math.random() * 600
    });
  }
  
  /**
   * Erstellt ein einzelnes Projektil mit den angegebenen Koordinaten
   */
  private createBullet(x: number, y: number): void {
    const bullet = this.bullets.get(x, y, Constants.ASSET_BULLET) as Phaser.Physics.Arcade.Sprite;
    
    if (!bullet) return;
    
    // Aktiviere die Kugel
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setScale(1.5);
    
    // Stelle sicher, dass die Physik aktiviert ist
    if (!bullet.body || !bullet.body.enable) {
      this.scene.physics.world.enable(bullet);
    }
    
    // Setze Position nach Aktivierung der Physik
    bullet.setPosition(x, y);
    
    // Optimiere das Projektil für flüssigere Bewegung
    if (bullet.body) {
      // Cast zum Arcade-Body für typensichere Operationen
      const arcadeBody = bullet.body as Phaser.Physics.Arcade.Body;
      
      // Physik-Eigenschaften korrekt setzen
      arcadeBody.setAllowGravity(false);
      arcadeBody.setBounce(0, 0);
      arcadeBody.setVelocity(Constants.BULLET_SPEED, 0);
      
      // Kollisionsbox optimieren
      arcadeBody.setSize(bullet.width * 0.8, bullet.height * 0.8, true);
    } else {
      // Fallback wenn kein Physics-Body verfügbar
      bullet.setVelocity(Constants.BULLET_SPEED, 0);
    }
    
    // Texturen für besseres Rendering optimieren
    if (bullet.texture) {
      bullet.texture.setFilter(Phaser.Textures.NEAREST);
    }
    
    // Tint basierend auf Power-Level (höhere Level = intensivere Farbe)
    const tintColor = this.powerLevel === 1 ? 0xff8888 : (this.powerLevel === 2 ? 0xff5555 : 0xff0000);
    bullet.setTint(tintColor);
    
    // NICHT an den Weltgrenzen stoppen
    bullet.setCollideWorldBounds(false);
    
    // Markiere diese Kugel für die Identifizierung
    bullet.setData('damage', Constants.BULLET_DAMAGE);
    bullet.setData('owner', 'player');
    bullet.setData('bulletId', Date.now() + Math.random());
    bullet.setData('creationTime', this.scene.time.now);
  }
  
  /**
   * Erstellt ein Projektil, das in einem bestimmten Winkel abgefeuert wird
   */
  private createAngledBullet(x: number, y: number, angle: number): void {
    const bullet = this.bullets.get(x, y, Constants.ASSET_BULLET) as Phaser.Physics.Arcade.Sprite;
    
    if (!bullet) return;
    
    // Aktiviere die Kugel
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setScale(1.5);
    bullet.setRotation(Phaser.Math.DegToRad(angle)); // Drehe das Sprite entsprechend dem Winkel
    
    // Stelle sicher, dass die Physik aktiviert ist
    if (!bullet.body || !bullet.body.enable) {
      this.scene.physics.world.enable(bullet);
    }
    
    // Setze Position nach Aktivierung der Physik
    bullet.setPosition(x, y);
    
    // Berechne Geschwindigkeitskomponenten basierend auf dem Winkel
    const radians = Phaser.Math.DegToRad(angle);
    const velocityX = Math.cos(radians) * Constants.BULLET_SPEED;
    const velocityY = Math.sin(radians) * Constants.BULLET_SPEED;
    
    // Optimiere das Projektil für flüssigere Bewegung
    if (bullet.body) {
      // Cast zum Arcade-Body für typensichere Operationen
      const arcadeBody = bullet.body as Phaser.Physics.Arcade.Body;
      
      // Physik-Eigenschaften korrekt setzen
      arcadeBody.setAllowGravity(false);
      arcadeBody.setBounce(0, 0);
      arcadeBody.setVelocity(velocityX, velocityY);
      
      // Kollisionsbox optimieren
      arcadeBody.setSize(bullet.width * 0.8, bullet.height * 0.8, true);
    } else {
      // Fallback wenn kein Physics-Body verfügbar
      bullet.setVelocity(velocityX, velocityY);
    }
    
    // Texturen für besseres Rendering optimieren
    if (bullet.texture) {
      bullet.texture.setFilter(Phaser.Textures.NEAREST);
    }
    
    // Tint basierend auf Power-Level (höhere Level = intensivere Farbe)
    const tintColor = this.powerLevel === 1 ? 0xff8888 : (this.powerLevel === 2 ? 0xff5555 : 0xff0000);
    bullet.setTint(tintColor);
    
    // NICHT an den Weltgrenzen stoppen
    bullet.setCollideWorldBounds(false);
    
    // Markiere diese Kugel für die Identifizierung
    bullet.setData('damage', Constants.BULLET_DAMAGE);
    bullet.setData('owner', 'player');
    bullet.setData('bulletId', Date.now() + Math.random());
    bullet.setData('creationTime', this.scene.time.now);
  }

  /**
   * Erhöht das Power-Level der Waffe um 1
   */
  public upgradePowerLevel(): void {
    if (this.powerLevel < Constants.PLAYER_MAX_POWER_LEVEL) {
      this.powerLevel++;
      
      // Visuelles Feedback für das Upgrade
      this.scene.cameras.main.flash(500, 0, 100, 255); // Blauer Flash-Effekt
      
      console.log(`Weapon power upgraded to level ${this.powerLevel}`);
    }
  }

  /**
   * Behandelt Kollisionen mit Weltgrenzen
   */
  private handleWorldBoundsCollision(body: Phaser.Physics.Arcade.Body): void {
    if (!body || !body.gameObject) return;
    
    const sprite = body.gameObject as Phaser.Physics.Arcade.Sprite;
    if (sprite && sprite.getData('owner') === 'player') {
      this.destroyBullet(sprite);
    }
  }

  /**
   * Zerstört eine Kugel
   */
  private destroyBullet(bullet: Phaser.Physics.Arcade.Sprite): void {
    if (!bullet || !bullet.active) return;
    
    bullet.setActive(false);
    bullet.setVisible(false);
    if (bullet.body) {
      bullet.body.stop();
      bullet.body.enable = false;
    }
    bullet.destroy();
  }

  /**
   * Gibt die Bullets-Gruppe zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }
  
  /**
   * Gibt das aktuelle Power-Level zurück
   */
  public getPowerLevel(): number {
    return this.powerLevel;
  }

  /**
   * Bereinigt die Waffe beim Zerstören
   */
  public destroy(): void {
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
    this.scene.physics.world.off('worldbounds', this.handleWorldBoundsCollision, this);
    this.eventBus.off(EventType.POWER_PICKUP_COLLECTED, this.powerUpHandler);
  }

  /**
   * Aktualisiert die Bullets und entfernt die, die außerhalb des Bildschirms sind
   */
  public update(delta: number): void {
    // Zeitsteuerbasis für gleichmäßige Bewegung bei verschiedenen Framerates
    const normalizedDelta = delta / 16.666;
    
    this.bullets.children.each((bullet: Phaser.GameObjects.GameObject) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      
      if (!b.active) return true;
      
      // Überprüfen, ob das Projektil zu lange existiert (5 Sekunden)
      const creationTime = b.getData('creationTime') || 0;
      if (this.scene.time.now - creationTime > 5000) {
        this.destroyBullet(b);
        return true;
      }
      
      // Prüfe, ob das Projektil außerhalb des Bildschirms ist (mit größerem Puffer)
      if (b.x > this.scene.scale.width + 100 || 
          b.x < -100 || 
          b.y > this.scene.scale.height + 100 || 
          b.y < -100) {
        this.destroyBullet(b);
      }
      
      return true;
    });
  }
} 