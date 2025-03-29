/**
 * Waffenkomponente für Gegner
 * Verwaltet verschiedene Schussmuster und Projektilerzeugung
 */

import { Constants } from '../../../utils/constants';
import { Player } from '../../player/player';
import { EventBus } from '../../../utils/eventBus';

export type ShootingPattern = 'single' | 'double' | 'burst' | 'spread' | 'random';

export interface WeaponConfig {
  pattern: ShootingPattern;
  fireRate: number;
  bulletSpeed?: number;
  bulletTexture?: string;
  patternChangeInterval?: number;
  changePatternRandomly?: boolean;
  burstCount?: number;
  burstDelay?: number;
  spreadAngle?: number;
  spreadCount?: number;
  predictiveAim?: boolean;
  targetPlayer?: boolean;
}

export class WeaponComponent {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private player: Player;
  private eventBus: EventBus;
  
  private pattern: ShootingPattern;
  private fireRate: number;
  private lastShotTime: number = 0;
  private bulletSpeed: number;
  private bulletTexture: string;
  private bullets: Phaser.Physics.Arcade.Group;
  
  private patternChangeInterval: number;
  private lastPatternChangeTime: number = 0;
  private changePatternRandomly: boolean;
  
  private burstCount: number = 0;
  private burstTotal: number;
  private burstDelay: number;
  private lastBurstTime: number = 0;
  
  private spreadAngle: number;
  private spreadCount: number;
  
  private predictiveAim: boolean;
  private targetPlayer: boolean;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite, player: Player, config: WeaponConfig) {
    this.scene = scene;
    this.sprite = sprite;
    this.player = player;
    this.eventBus = EventBus.getInstance();
    
    // Grundlegende Waffeneinstellungen
    this.pattern = config.pattern;
    this.fireRate = config.fireRate;
    this.bulletSpeed = config.bulletSpeed || Constants.ENEMY_BULLET_SPEED;
    this.bulletTexture = config.bulletTexture || Constants.ASSET_ENEMY_BULLET;
    
    // Muster-Wechsel-Einstellungen
    this.patternChangeInterval = config.patternChangeInterval || 6000;
    this.changePatternRandomly = config.changePatternRandomly || false;
    
    // Burst-Einstellungen
    this.burstTotal = config.burstCount || 3;
    this.burstDelay = config.burstDelay || 150;
    
    // Spread-Einstellungen
    this.spreadAngle = config.spreadAngle || 15;
    this.spreadCount = config.spreadCount || 3;
    
    // Zielverfolgung
    this.predictiveAim = config.predictiveAim || false;
    this.targetPlayer = config.targetPlayer || false;
    
    // Projektilgruppe initialisieren
    this.bullets = this.scene.physics.add.group({
      defaultKey: this.bulletTexture,
      maxSize: 30,
      active: false,
      visible: false
    });
  }

  /**
   * Aktualisiert die Waffenlogik für den aktuellen Frame
   */
  public update(time: number, delta: number): void {
    // Muster-Wechsel, falls aktiviert
    if (this.changePatternRandomly && time > this.lastPatternChangeTime + this.patternChangeInterval) {
      this.changePattern();
      this.lastPatternChangeTime = time;
    }
    
    // Bei Burst-Modus prüfen, ob wir gerade in einer Burst-Sequenz sind
    if (this.pattern === 'burst' && this.burstCount > 0) {
      if (time > this.lastBurstTime + this.burstDelay) {
        this.lastBurstTime = time;
        this.burstCount--;
        
        this.fireBullet();
      }
      return;
    }
    
    // Normale Schusslogik für reguläre Zeitintervalle
    if (time > this.lastShotTime + this.fireRate) {
      this.lastShotTime = time;
      
      // Je nach Muster unterschiedliche Schussmechaniken
      switch (this.pattern) {
        case 'single':
          this.fireBullet();
          break;
          
        case 'double':
          this.fireBullet();
          this.scene.time.delayedCall(150, () => {
            if (this.sprite && this.sprite.active) {
              this.fireBullet();
            }
          });
          break;
          
        case 'burst':
          this.burstCount = this.burstTotal;
          this.lastBurstTime = time;
          this.fireBullet();
          this.burstCount--;
          break;
          
        case 'spread':
          this.fireSpread();
          break;
          
        case 'random':
          const randomType = Math.random();
          if (randomType < 0.3) {
            this.fireBullet();
          } else if (randomType < 0.6) {
            this.fireBullet();
            this.scene.time.delayedCall(150, () => {
              if (this.sprite && this.sprite.active) {
                this.fireBullet();
              }
            });
          } else {
            this.fireSpread();
          }
          break;
      }
    }
  }

  /**
   * Ändert das Schussmuster zufällig
   */
  private changePattern(): void {
    const patterns: ShootingPattern[] = ['single', 'double', 'burst', 'spread', 'random'];
    let newPatternIndex = Math.floor(Math.random() * patterns.length);
    
    // Vermeide Wiederholung des gleichen Musters
    if (patterns[newPatternIndex] === this.pattern && patterns.length > 1) {
      newPatternIndex = (newPatternIndex + 1) % patterns.length;
    }
    
    this.pattern = patterns[newPatternIndex];
    
    // Visuelles Feedback beim Musterwechsel
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.8,
      yoyo: true,
      duration: 100,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Setzt das Schussmuster explizit
   */
  public setPattern(pattern: ShootingPattern): void {
    this.pattern = pattern;
  }

  /**
   * Feuert ein einzelnes Projektil
   */
  private fireBullet(): void {
    const bullet = this.bullets.get(this.sprite.x - 20, this.sprite.y) as Phaser.Physics.Arcade.Sprite;
    
    if (!bullet) return;
    
    bullet.setActive(true);
    bullet.setVisible(true);
    
    // Setze den Typ für Kollisionserkennung
    bullet.setData('type', 'enemyBullet');
    
    // Ermittle die Richtung zum Spieler, wenn auf Spieler zielen aktiviert ist
    let velocityX = -this.bulletSpeed;
    let velocityY = 0;
    
    if (this.targetPlayer) {
      // Berechne den Winkel zum Spieler
      let targetX = this.player.getSprite().x;
      let targetY = this.player.getSprite().y;
      
      // Füge prädiktive Zielverfolgung hinzu, wenn aktiviert
      if (this.predictiveAim) {
        const distanceX = this.sprite.x - targetX;
        const timeToTarget = distanceX / this.bulletSpeed;
        targetY += this.player.getSprite().body.velocity.y * timeToTarget * 0.7;
      }
      
      // Berechne den Winkel zwischen Gegner und Spieler
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        targetX, targetY
      );
      
      // Berechne Geschwindigkeiten basierend auf dem Winkel
      velocityX = Math.cos(angle) * this.bulletSpeed;
      velocityY = Math.sin(angle) * this.bulletSpeed;
    }
    
    // Setze die Geschwindigkeit des Projektils
    bullet.setVelocity(velocityX, velocityY);
    
    // Setze die Rotation des Projektils entsprechend der Bewegungsrichtung
    if (this.targetPlayer) {
      bullet.setRotation(Math.atan2(velocityY, velocityX));
    }
    
    // Registriere das Projektil im zentralen EnemyManager, falls gewünscht
    this.eventBus.emit('REGISTER_ENEMY_BULLET', bullet);
    
    // Sound-Effekt
    this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
      volume: 0.2
    });
  }

  /**
   * Feuert mehrere Projektile in einem Fächer
   */
  private fireSpread(): void {
    const angleStep = this.spreadAngle / (this.spreadCount - 1);
    const startAngle = -this.spreadAngle / 2;
    
    for (let i = 0; i < this.spreadCount; i++) {
      const bullet = this.bullets.get(this.sprite.x - 20, this.sprite.y) as Phaser.Physics.Arcade.Sprite;
      
      if (!bullet) continue;
      
      bullet.setActive(true);
      bullet.setVisible(true);
      
      // Setze den Typ für Kollisionserkennung
      bullet.setData('type', 'enemyBullet');
      
      // Berechne den Winkel für dieses Projektil
      const angle = Phaser.Math.DegToRad(startAngle + angleStep * i);
      const dirX = -Math.cos(angle);
      const dirY = Math.sin(angle);
      
      // Setze die Geschwindigkeit des Projektils
      bullet.setVelocity(dirX * this.bulletSpeed, dirY * this.bulletSpeed);
      
      // Setze die Rotation des Projektils
      bullet.setRotation(Math.atan2(dirY, dirX));
      
      // Registriere das Projektil im zentralen EnemyManager
      this.eventBus.emit('REGISTER_ENEMY_BULLET', bullet);
    }
    
    // Sound-Effekt
    this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
      volume: 0.3
    });
  }

  /**
   * Passt Waffenparameter an die Schwierigkeit an
   */
  public adjustForDifficulty(difficulty: number): void {
    const difficultyFactor = 1 + (difficulty - 1) * 0.12;
    
    // Reduziere Feuerrate (schnelleres Schießen)
    this.fireRate = Math.max(300, this.fireRate / difficultyFactor);
    
    // Erhöhe Geschossgeschwindigkeit
    this.bulletSpeed *= difficultyFactor;
    
    // Bei höherer Schwierigkeit komplexere Schussmuster bevorzugen
    if (difficulty >= 3) {
      // Erhöhe die Wahrscheinlichkeit für fortgeschrittene Schussmuster
      const advancedPatterns: ShootingPattern[] = ['double', 'burst', 'spread'];
      
      if (this.pattern === 'single' && Math.random() < 0.6) {
        this.pattern = advancedPatterns[Math.floor(Math.random() * advancedPatterns.length)];
      }
      
      // Aktiviere prädiktives Zielen bei höherer Schwierigkeit
      if (difficulty >= 4) {
        this.predictiveAim = true;
        
        // Erhöhe die Anzahl der Projektile bei Spread-Muster
        if (this.pattern === 'spread') {
          this.spreadCount = Math.min(7, this.spreadCount + 1);
        }
        
        // Erhöhe die Anzahl der Burst-Schüsse
        if (this.pattern === 'burst') {
          this.burstTotal = Math.min(5, this.burstTotal + 1);
        }
      }
    }
  }

  /**
   * Gibt die Bullets-Gruppe zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }
} 