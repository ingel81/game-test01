/**
 * Basis-Klasse für alle komponentenbasierten Gegner
 * Implementiert ein modulares System mit Komponenten für Bewegung, Waffen und visuelle Effekte
 */

import { GameObject } from '../gameObject';
import { Player } from '../player/player';
import { Constants } from '../../utils/constants';
import { EventBus, EventType } from '../../utils/eventBus';
import { MovementComponent, MovementConfig, MovementPattern } from './components/movementComponent';
import { WeaponComponent, WeaponConfig, ShootingPattern } from './components/weaponComponent';
import { VisualComponent, VisualConfig } from './components/visualComponent';

// Konfigurationsoptionen für Gegner
export interface EnemyConfig {
  texture: string;
  health: number;
  speed: number; 
  scoreValue: number;
  fireRate: number;
  movement?: MovementConfig;
  weapon?: WeaponConfig;
  visual?: VisualConfig;
}

export class BaseEnemy extends GameObject {
  // Grundlegende Eigenschaften
  protected speed: number;
  protected scoreValue: number;
  protected eventBus: EventBus;
  protected player: Player;
  
  // Komponenten
  protected movementComponent: MovementComponent;
  protected weaponComponent: WeaponComponent;
  protected visualComponent: VisualComponent;
  
  // Debug-Text für die Anzeige des Namens
  protected debugText: Phaser.GameObjects.Text;
  
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    player: Player,
    config: EnemyConfig
  ) {
    super(scene, x, y, config.texture, config.health);
    this.player = player;
    this.speed = config.speed;
    this.scoreValue = config.scoreValue;
    this.eventBus = EventBus.getInstance();
    
    // Setze Metadaten für den Sprite
    this.sprite.setData('type', 'enemy');
    this.sprite.setData('instance', this);
    
    // Standard-Kollisionsbox optimieren
    const width = this.sprite.width * 0.8;
    const height = this.sprite.height * 0.8;
    this.sprite.body.setSize(width, height);
    this.sprite.body.setOffset((this.sprite.width - width) / 2, (this.sprite.height - height) / 2);
    
    // Initialisiere Komponenten
    this.initComponents(config);
    
    // Füge Debug-Text hinzu, der den Klassennamen zeigt
    this.createDebugText();
  }

  /**
   * Initialisiert die Komponenten basierend auf der Konfiguration
   */
  protected initComponents(config: EnemyConfig): void {
    // Erstelle Bewegungskomponente
    const movementConfig: MovementConfig = config.movement || {
      pattern: this.getRandomMovementPattern(),
      speed: this.speed,
      baseVelocityX: -100 - Math.random() * 50,
      changePatternRandomly: true,
      patternChangeInterval: 4000 + Math.random() * 2000
    };
    
    this.movementComponent = new MovementComponent(
      this.scene, 
      this.sprite, 
      this.player, 
      movementConfig
    );
    
    // Erstelle Waffenkomponente
    const weaponConfig: WeaponConfig = config.weapon || {
      pattern: this.getRandomShootingPattern(),
      fireRate: config.fireRate,
      changePatternRandomly: true,
      patternChangeInterval: 6000 + Math.random() * 2000
    };
    
    this.weaponComponent = new WeaponComponent(
      this.scene, 
      this.sprite, 
      this.player, 
      weaponConfig
    );
    
    // Erstelle visuelle Komponente
    const visualConfig: VisualConfig = config.visual || {
      tint: 0xFFFFFF,
      scale: 1,
      hitEffectDuration: 150
    };
    
    this.visualComponent = new VisualComponent(
      this.scene, 
      this.sprite, 
      visualConfig
    );
  }

  /**
   * Erstellt den Debug-Text über dem Gegner
   */
  private createDebugText(): void {
    // Klassen-Typ als explizite Eigenschaft statt constructor.name verwenden
    let className = this.constructor.name;
    
    // Versuche eine statische Klassennamen-Eigenschaft zu finden
    if ((this.constructor as any).enemyType) {
      className = (this.constructor as any).enemyType;
    }
    
    console.log(`[DEBUG-CREATE] Erstelle Debug-Text für ${className} an Position (${this.sprite.x}, ${this.sprite.y})`);
    
    // Erstelle den Text über dem Sprite
    this.debugText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - this.sprite.height/2 - 15,
      className,
      {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 1).setDepth(1000);
    
    // Gib dem Debug-Text eine eindeutige ID für die Verfolgung
    const debugId = `debug_${className}_${Math.floor(Math.random() * 10000)}`;
    this.debugText.setName(debugId);
    this.debugText.setData('enemyId', this.sprite.getData('instance'));
    
    console.log(`[DEBUG-CREATE] Debug-Text erstellt mit ID ${debugId}, aktiv: ${this.debugText.active}, sichtbar: ${this.debugText.visible}`);
  }

  /**
   * Gibt ein zufälliges Bewegungsmuster zurück
   */
  protected getRandomMovementPattern(): MovementPattern {
    const patterns: MovementPattern[] = ['linear', 'zigzag', 'circular', 'tracking', 'evasive', 'sinusoidal', 'random'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Gibt ein zufälliges Schussmuster zurück
   */
  protected getRandomShootingPattern(): ShootingPattern {
    const patterns: ShootingPattern[] = ['single', 'double', 'burst', 'spread', 'random'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Aktualisiert den Gegner und seine Komponenten
   */
  public update(time: number, delta: number): void {
    if (this.isDestroyed) return;
    
    // Löschen, wenn zu weit links aus dem Bildschirm
    if (this.sprite.x < -100) {
      console.log(`[ENEMY] Gegner außerhalb des Bildschirms (${this.sprite.x}, ${this.sprite.y}), wird zerstört`);
      this.destroy();
      return;
    }
    
    // Bewegung aktualisieren
    if (this.movementComponent) {
      this.movementComponent.update(time, delta);
    }
    
    // Waffe aktualisieren
    if (this.weaponComponent) {
      this.weaponComponent.update(time, delta);
    }
    
    // Visuelle Effekte aktualisieren
    if (this.visualComponent) {
      this.visualComponent.update(time, delta);
    }
    
    // Debug-Text-Position aktualisieren
    if (this.debugText) {
      this.debugText.setPosition(
        this.sprite.x,
        this.sprite.y - this.sprite.height/2 - 15
      );
    }
  }

  /**
   * Wird aufgerufen, wenn der Gegner getroffen wird
   * Überschrieben aus GameObject.takeDamage
   */
  public takeDamage(amount: number): boolean {
    const wasDestroyed = super.takeDamage(amount);
    
    // Füge visuelle Effekte hinzu
    if (!wasDestroyed) {
      this.visualComponent.playHitEffect();
    }
    
    return wasDestroyed;
  }

  /**
   * Wird aufgerufen, wenn der Gegner zerstört wird
   */
  protected onDestroy(): void {
    // Zerstöre sofort den Debug-Text
    if (this.debugText) {
      console.log(`[DEBUG-DESTROY] Zerstöre Debug-Text sofort in onDestroy() für ${this.constructor.name}`);
      this.debugText.destroy();
      this.debugText = null;
    }
    
    // Spiele Todes-Animation ab
    this.visualComponent.playDeathAnimation();
    
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
   * Erstellt ein Energie-Pickup an der aktuellen Position
   */
  private createEnergyPickup(): void {
    this.eventBus.emit('CREATE_ENERGY_PICKUP', { x: this.sprite.x, y: this.sprite.y });
  }

  /**
   * Wird aufgerufen, wenn der Gegner mit einem anderen Objekt kollidiert
   */
  protected onCollision(other: GameObject): void {
    // Standard-Kollisionsverhalten
    if (other instanceof Player) {
      other.takeDamage(20);
      this.takeDamage(this.health); // Zerstöre den Gegner bei Kollision mit dem Spieler
    }
  }

  /**
   * Wendet Schwierigkeitsanpassungen auf alle Komponenten an
   */
  public applyDifficulty(data: { difficulty: number, factor: number }): void {
    const difficulty = data.difficulty;
    
    // Anpassungen für jede Komponente
    this.movementComponent.adjustForDifficulty(difficulty);
    this.weaponComponent.adjustForDifficulty(difficulty);
    this.visualComponent.adjustForDifficulty(difficulty);
    
    // Erhöhe Gesundheit bei höherer Schwierigkeit
    if (difficulty > 1) {
      const healthBoost = Math.min(2, 1 + (difficulty - 1) * 0.2);
      this.maxHealth = Math.ceil(this.maxHealth * healthBoost);
      this.health = this.maxHealth;
    }
  }

  /**
   * Gibt die Bullets-Gruppe zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.weaponComponent.getBullets();
  }

  /**
   * Zerstört die Entität und gibt Ressourcen frei
   */
  public destroy(): void {
    // Zerstöre den Debug-Text
    if (this.debugText) {
      console.log(`[DEBUG] Versuche Debug-Text zu zerstören für ${this.constructor.name} an Position (${this.sprite.x}, ${this.sprite.y})`);
      console.log(`[DEBUG] Debug-Text aktiv: ${this.debugText.active}, sichtbar: ${this.debugText.visible}, Text: ${this.debugText.text}`);
      this.debugText.destroy();
      console.log(`[DEBUG] Debug-Text nach destroy - aktiv: ${this.debugText.active}, sichtbar: ${this.debugText.visible}`);
    } else {
      console.log(`[DEBUG] Kein Debug-Text für ${this.constructor.name} an Position (${this.sprite.x}, ${this.sprite.y})`);
    }
    
    // Zerstöre alle Komponenten
    this.visualComponent.destroy();
    
    // Rufe die Basis-Destroy-Methode auf
    console.log(`[DEBUG] Rufe super.destroy() für ${this.constructor.name} an Position (${this.sprite.x}, ${this.sprite.y}) auf`);
    super.destroy();
  }
} 