import { GameObject } from '../gameObject';
import { Constants } from '../../utils/constants';
import { EventBus, EventType } from '../../utils/eventBus';
import { PlayerWeapon } from './playerWeapon';

/**
 * Spielerklasse
 */
export class Player extends GameObject {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private weapon: PlayerWeapon;
  private speed: number = Constants.PLAYER_SPEED;
  private currentVelocityX: number = 0;
  private currentVelocityY: number = 0;
  private acceleration: number = 5.0;  // Extrem schnelle Beschleunigung für sofortige Reaktion
  private deceleration: number = 0.8;  // Erhöhte Abbremsung für präzisere Steuerung
  private lastShotTime: number = 0;
  private readonly SHOT_DELAY: number = Constants.PLAYER_SHOT_DELAY;
  private eventBus: EventBus;
  private isTouchDevice: boolean;
  private touchControls: {
    shoot: boolean;
    touchX: number;
    touchY: number;
    isMoving: boolean;
    pointer: Phaser.Input.Pointer | null;
  };
  private powerUpHandler: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, Constants.ASSET_PLAYER, Constants.PLAYER_INITIAL_HEALTH);
    
    // Optimierte Sprite-Einstellungen für flüssigeres Rendering
    this.sprite.setOrigin(0.5, 0.5); // Zentrum als Ursprung für pixelgenaues Rendering
    this.sprite.setCollideWorldBounds(true); // Bildschirmgrenzen einhalten
    this.sprite.setRotation(0); // Keine Rotation
    this.sprite.setScale(2);    // Größeres Sprite 
    
    // Texturen für besseres Rendering optimieren
    if (this.sprite.texture) {
      this.sprite.texture.setFilter(Phaser.Textures.NEAREST);
    }
    
    // Physik optimieren für direktere Kontrolle
    if (this.sprite.body instanceof Phaser.Physics.Arcade.Body) {
      this.sprite.body.setMaxVelocity(400, 400); // Maximale Geschwindigkeit setzen
      this.sprite.body.setFriction(0, 0);        // Keine Reibung für direktere Kontrolle
    }

    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.weapon = new PlayerWeapon(scene);
    this.eventBus = EventBus.getInstance();

    // Binde den PowerUp-Handler
    this.powerUpHandler = () => this.onPowerUpCollected();
    this.eventBus.on(EventType.POWER_PICKUP_COLLECTED, this.powerUpHandler);

    // Prüfen, ob Touch-Gerät
    this.isTouchDevice = this.scene.sys.game.device.input.touch;
    
    // Touch-Steuerung initialisieren
    this.touchControls = {
      shoot: false,
      touchX: 0,
      touchY: 0,
      isMoving: false,
      pointer: null
    };

    if (this.isTouchDevice) {
      this.setupTouchControls();
    }
  }

  /**
   * Aktualisiert den Spieler
   */
  public update(time: number, delta: number): void {
    this.handleMovement(delta);
    this.handleShooting(time);
    
    // Aktualisiere die Waffe, um Projektile zu verwalten
    this.weapon.update(delta);
  }

  /**
   * Behandelt die Spielerbewegung
   */
  private handleMovement(delta: number): void {
    // Normalisierter Zeitfaktor für gleichmäßige Bewegung bei verschiedenen Framerates
    const normalizedDelta = delta / 16.666;
    
    // Zielgeschwindigkeit
    let targetVelocityX = 0;
    let targetVelocityY = 0;

    // Tastatureingaben sammeln
    if (this.cursors.left.isDown) {
      targetVelocityX = -this.speed;
    } else if (this.cursors.right.isDown) {
      targetVelocityX = this.speed;
    }

    if (this.cursors.up.isDown) {
      targetVelocityY = -this.speed;
    } else if (this.cursors.down.isDown) {
      targetVelocityY = this.speed;
    }

    // Touch-Steuerung verarbeiten
    if (this.isTouchDevice && this.touchControls.isMoving && this.touchControls.pointer) {
      const diffX = this.touchControls.touchX - this.sprite.x;
      const diffY = this.touchControls.touchY - this.sprite.y;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);
      
      if (distance > 5) {
        // Dynamische Geschwindigkeit bei Touch basierend auf Entfernung zum Ziel
        const speedFactor = Math.min(1.0, distance / 100); // Volle Geschwindigkeit ab 100px Entfernung
        targetVelocityX = (diffX / distance) * this.speed * speedFactor;
        targetVelocityY = (diffY / distance) * this.speed * speedFactor;
      }
    }

    // Diagonale Bewegung normalisieren
    if (targetVelocityX !== 0 && targetVelocityY !== 0) {
      const normalizer = Math.sqrt(2) / 2;
      targetVelocityX *= normalizer;
      targetVelocityY *= normalizer;
    }

    // Für flüssigere Bewegung direkt mit der Physik-Engine arbeiten
    if (this.sprite.body instanceof Phaser.Physics.Arcade.Body) {
      // Erhöhte Physikbeschleunigung für schnellere Reaktion
      const acceleration = 4000; // Verdoppelte Beschleunigung
      
      // Erhöhte maximale Geschwindigkeit für flüssigeres Gefühl
      this.sprite.body.setMaxVelocity(this.speed * 1.5, this.speed * 1.5);
      
      // Aktuelle Geschwindigkeit abrufen
      const currentVelocityX = this.sprite.body.velocity.x;
      const currentVelocityY = this.sprite.body.velocity.y;
      
      // Neue Geschwindigkeiten basierend auf Zielen berechnen
      let newVelocityX = 0;
      let newVelocityY = 0;
      
      if (Math.abs(targetVelocityX) > 0) {
        // Verbesserte Beschleunigung mit Easing für natürlichere Bewegung
        const accelerationX = acceleration * Math.sign(targetVelocityX) * normalizedDelta;
        
        // Progressive Beschleunigung - schneller am Anfang, dann feiner
        const distanceToTarget = Math.abs(targetVelocityX - currentVelocityX);
        const accelerationFactor = Math.min(1.0, distanceToTarget / this.speed);
        
        newVelocityX = currentVelocityX + accelerationX * accelerationFactor;
        
        // Begrenzen auf Zielgeschwindigkeit
        if (Math.sign(newVelocityX) === Math.sign(targetVelocityX) && 
            Math.abs(newVelocityX) > Math.abs(targetVelocityX)) {
          newVelocityX = targetVelocityX;
        }
      } else {
        // Schnelleres Abbremsen für bessere Kontrolle
        const deceleration = acceleration * 0.7 * normalizedDelta;
        if (Math.abs(currentVelocityX) <= deceleration) {
          newVelocityX = 0;
        } else {
          newVelocityX = currentVelocityX - Math.sign(currentVelocityX) * deceleration;
        }
      }
      
      // Gleiche verbesserte Logik für Y-Achse
      if (Math.abs(targetVelocityY) > 0) {
        const accelerationY = acceleration * Math.sign(targetVelocityY) * normalizedDelta;
        
        // Progressive Beschleunigung
        const distanceToTarget = Math.abs(targetVelocityY - currentVelocityY);
        const accelerationFactor = Math.min(1.0, distanceToTarget / this.speed);
        
        newVelocityY = currentVelocityY + accelerationY * accelerationFactor;
        
        if (Math.sign(newVelocityY) === Math.sign(targetVelocityY) && 
            Math.abs(newVelocityY) > Math.abs(targetVelocityY)) {
          newVelocityY = targetVelocityY;
        }
      } else {
        const deceleration = acceleration * 0.7 * normalizedDelta;
        if (Math.abs(currentVelocityY) <= deceleration) {
          newVelocityY = 0;
        } else {
          newVelocityY = currentVelocityY - Math.sign(currentVelocityY) * deceleration;
        }
      }
      
      // Geschwindigkeit setzen mit direkter Berechnung für optimale Performance
      this.sprite.body.velocity.x = newVelocityX;
      this.sprite.body.velocity.y = newVelocityY;
      
      // Füge kleine visuelle Effekte bei schneller Bewegung hinzu - leichte Neigung
      const maxTilt = 0.05; // Maximale Neigung in Radiant
      const tiltFactor = this.sprite.body.velocity.x / (this.speed * 2);
      this.sprite.setRotation(-tiltFactor * maxTilt);
      
    } else {
      // Fallback für nicht-Physik Bewegung
      this.sprite.x += targetVelocityX * normalizedDelta;
      this.sprite.y += targetVelocityY * normalizedDelta;
      
      // Bildschirmgrenzen einhalten
      const halfWidth = this.sprite.displayWidth / 2;
      const halfHeight = this.sprite.displayHeight / 2;
      
      const minX = halfWidth;
      const maxX = this.scene.scale.width - halfWidth;
      const minY = halfHeight;
      const maxY = this.scene.scale.height - halfHeight;
      
      this.sprite.x = Math.max(minX, Math.min(maxX, this.sprite.x));
      this.sprite.y = Math.max(minY, Math.min(maxY, this.sprite.y));
    }
  }

  /**
   * Behandelt das Schießen
   */
  private handleShooting(time: number): void {
    // Schieße, wenn Leertaste gedrückt ist und Abklingzeit vorbei
    if (this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey('SPACE'), 50)) {
      if (time > this.lastShotTime + this.SHOT_DELAY) {
        this.lastShotTime = time;
        this.weapon.shoot(this.sprite.x, this.sprite.y);
      }
    }
    
    // Überprüfe Touch-Eingaben
    if (this.isTouchDevice && this.touchControls.shoot) {
      if (time > this.lastShotTime + this.SHOT_DELAY) {
        this.lastShotTime = time;
        this.weapon.shoot(this.sprite.x, this.sprite.y);
      }
    }
  }

  /**
   * Richtet die Touch-Steuerung ein
   */
  private setupTouchControls(): void {
    // Definiere Button-Größe und Padding
    const buttonSize = 100;
    const padding = Math.min(40, this.scene.scale.height * 0.1);
    
    // Erstelle einen sichtbaren Schussbutton
    const shootButton = this.scene.add.rectangle(
      this.scene.scale.width - padding - buttonSize/2, 
      this.scene.scale.height - padding - buttonSize - 50, // 50px höher positionieren
      buttonSize, 
      buttonSize, 
      0xff0000, 
      0.5
    )
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000);
    
    // Füge ein Symbol zum Button hinzu
    const shootIcon = this.scene.add.text(
      shootButton.x, 
      shootButton.y, 
      '⚡', 
      { fontSize: '36px' }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    
    // Schussbutton Event-Handler
    shootButton.on('pointerdown', () => {
      this.touchControls.shoot = true;
      shootButton.setAlpha(0.8);
    });
    
    shootButton.on('pointerup', () => {
      this.touchControls.shoot = false;
      shootButton.setAlpha(0.5);
    });
    
    shootButton.on('pointerout', () => {
      this.touchControls.shoot = false;
      shootButton.setAlpha(0.5);
    });

    // Linke Seite für Bewegung
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const buttonBounds = shootButton.getBounds();
      
      // Wenn der Touch nicht auf dem Schuss-Button ist, starte Bewegung
      if (!buttonBounds.contains(pointer.x, pointer.y)) {
        this.touchControls.isMoving = true;
        this.touchControls.pointer = pointer;
        this.touchControls.touchX = pointer.x;
        this.touchControls.touchY = pointer.y;
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Aktualisiere Bewegung nur wenn es der richtige Pointer ist
      if (this.touchControls.isMoving && this.touchControls.pointer && 
          this.touchControls.pointer.id === pointer.id) {
        this.touchControls.touchX = pointer.x;
        this.touchControls.touchY = pointer.y;
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // Stoppe Bewegung nur wenn es der richtige Pointer ist
      if (this.touchControls.pointer && this.touchControls.pointer.id === pointer.id) {
        this.touchControls.isMoving = false;
        this.touchControls.pointer = null;
      }
    });

    // Aktiviere Multi-Touch
    this.scene.input.addPointer(2);
  }

  /**
   * Wird aufgerufen, wenn der Spieler mit einem anderen Objekt kollidiert
   */
  protected onCollision(other: GameObject): void {
    // Kollisionslogik kann hier implementiert werden
  }

  /**
   * Wird aufgerufen, wenn der Spieler zerstört wird
   */
  protected onDestroy(): void {
    // Entferne Event-Listener
    this.eventBus.off(EventType.POWER_PICKUP_COLLECTED, this.powerUpHandler);
    
    // Erstelle eine Explosion
    const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, Constants.ASSET_EXPLOSION_1);
    explosion.setScale(3);
    explosion.play('explode');

    // Spiele einen Sound
    this.scene.sound.play(Constants.SOUND_EXPLOSION, {
      volume: 0.5
    });

    // Teile der Spielwelt mit, dass der Spieler zerstört wurde
    this.eventBus.emit(EventType.PLAYER_DESTROYED);
  }

  /**
   * Verarbeitet eingehenden Schaden und aktualisiert die UI
   */
  public takeDamage(amount: number): boolean {
    const isDead = super.takeDamage(amount);

    // Event für UI-Aktualisierung auslösen
    this.eventBus.emit(EventType.PLAYER_DAMAGED, this.health);

    // Feedback für den Spieler bei Schaden
    if (!isDead) {
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (this.sprite.active) {
          this.sprite.clearTint();
        }
      });
    }

    return isDead;
  }

  /**
   * Gibt die Bullets des Spielers zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.weapon.getBullets();
  }

  /**
   * Heilt den Spieler
   */
  public heal(amount: number): void {
    if (amount <= 0 || !this.sprite.active) return;
    
    super.heal(amount);
    this.eventBus.emit(EventType.PLAYER_HEALED, this.health);
    
    // Heal-Effekt
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.8,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  /**
   * Wird aufgerufen, wenn ein Power-Pickup eingesammelt wird
   */
  private onPowerUpCollected(): void {
    // Visueller Effekt für Power-Upgrade
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (this.sprite.active) {
          // Blauer Farbeffekt nach dem Upgrade
          this.sprite.setTint(0x0066ff);
          this.scene.time.delayedCall(500, () => {
            if (this.sprite.active) {
              this.sprite.clearTint();
            }
          });
        }
      }
    });
    
    // Zeige Text an mit aktuellem Power-Level
    const powerLevel = this.weapon.getPowerLevel() + 1; // +1 weil der Event vor dem tatsächlichen Upgrade ausgelöst wird
    const text = this.scene.add.text(
      this.sprite.x, 
      this.sprite.y - 50, 
      `POWER LVL ${powerLevel}!`, 
      {
        fontSize: '24px',
        color: '#00ffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    // Animation für den Text
    this.scene.tweens.add({
      targets: text,
      y: this.sprite.y - 100,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }
} 