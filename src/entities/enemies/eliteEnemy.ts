/**
 * EliteEnemy-Klasse
 * Elite-Gegner mit sehr fortgeschrittenen Fähigkeiten und hoher Bedrohlichkeit
 */

import { BaseEnemy, EnemyConfig } from './baseEnemy';
import { Player } from '../player/player';
import { Constants } from '../../utils/constants';
import { MovementPattern } from './components/movementComponent';
import { ShootingPattern } from './components/weaponComponent';
import { GameObject } from '../gameObject';

export class EliteEnemy extends BaseEnemy {
  // Statischer Klassenname, der im Build erhalten bleibt
  public static enemyType = 'EliteEnemy';
  
  // NEU: Definiere die erlaubten Elite-Bewegungsmuster
  private static readonly ELITE_MOVEMENT_PATTERNS: MovementPattern[] = ['tracking', 'evasive', 'sinusoidal', 'random'];
  
  // Zusätzliche Eigenschaften für EliteEnemy
  private specialAttackTimer: number = 0;
  private specialAttackInterval: number = 5000; // Alle 5 Sekunden
  
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Konfiguriere den Elite-Gegner
    const config: EnemyConfig = {
      texture: Constants.ASSET_ENEMY02, // Verfügbare Textur
      health: 350, // Deutlich mehr Gesundheit
      speed: 180 + Math.random() * 50, // Sehr schnell
      scoreValue: 200, // Mehr Punkte
      fireRate: 600 + Math.random() * 300, // Sehr schnelle Feuerrate
      
      // Bewegungseinstellungen
      movement: {
        pattern: 'tracking', // Standardmäßig den Spieler verfolgen
        speed: 180 + Math.random() * 50,
        changePatternRandomly: true,
        patternChangeInterval: 2000 + Math.random() * 1000,
        trackingFactor: 0.04, // Besseres Tracking
        predictiveAimFactor: 0.6, // Mit verbesserter Vorhersage
        allowedPatterns: EliteEnemy.ELITE_MOVEMENT_PATTERNS // NEU: Nur diese Muster erlauben
      },
      
      // Waffeneinstellungen
      weapon: {
        pattern: 'spread', // Standardmäßig Spread-Angriff
        fireRate: 600 + Math.random() * 300,
        changePatternRandomly: true,
        patternChangeInterval: 3000 + Math.random() * 1000,
        burstCount: 4,
        spreadCount: 5,
        targetPlayer: true, // Auf Spieler zielen
        predictiveAim: true // Mit Vorhersage
      },
      
      // Visuelle Einstellungen
      visual: {
        tint: 0xFF0000, // Rote Färbung für Elite-Gegner
        scale: 0.3, // Größer
        hitEffectDuration: 150,
        glowEffect: false // Mit Gloweffekt
      }
    };
    
    super(scene, x, y, player, config);
    
    // Spezielle Initialisierung für Elite-Gegner
    this.specialAttackTimer = scene.time.now + this.specialAttackInterval;
  }
  
  /**
   * Überschriebene Update-Methode für spezielle Angriffe
   */
  public update(time: number, delta: number): void {
    super.update(time, delta);
    
    // Spezialangriff in regelmäßigen Abständen
    if (time > this.specialAttackTimer && !this.isDestroyed) {
      this.performSpecialAttack();
      this.specialAttackTimer = time + this.specialAttackInterval;
    }
  }
  
  /**
   * Führt einen Spezialangriff aus
   */
  private performSpecialAttack(): void {
    // Je nach Fall verschiedene Spezialangriffe
    const attackType = Math.floor(Math.random() * 3);
    
    switch (attackType) {
      case 0:
        // 360-Grad-Angriff
        this.fire360Degrees();
        break;
      case 1:
        // Teleport und Angriff
        this.teleportAndAttack();
        break;
      case 2:
        // Geschwindigkeitsschub
        this.speedBoost();
        break;
    }
  }
  
  /**
   * Spezialangriff: 360-Grad-Feuer
   */
  private fire360Degrees(): void {
    // Visueller Effekt vor dem Angriff
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        // Feuer in alle Richtungen
        const bulletCount = 12;
        const angleStep = 360 / bulletCount;
        
        for (let i = 0; i < bulletCount; i++) {
          const angle = i * angleStep;
          
          // Spawnposition für das Projektil
          const radians = Phaser.Math.DegToRad(angle);
          const x = this.sprite.x + Math.cos(radians) * 20;
          const y = this.sprite.y + Math.sin(radians) * 20;
          
          // Erstelle Projektil im zentralen Bullet-Pool
          const bullet = this.weaponComponent.getBullets().get(x, y) as Phaser.Physics.Arcade.Sprite;
          
          if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            
            // Drehe das Sprite um (statt Rotation)
            bullet.setFlipX(true);
            
            // Setze den Typ für Kollisionserkennung
            bullet.setData('type', 'enemyBullet');
            
            // Setze Geschwindigkeit und Richtung
            const speed = 200;
            bullet.setVelocity(Math.cos(radians) * speed, Math.sin(radians) * speed);
            
            // Setze die Rotation des Projektils
            bullet.setRotation(radians);
            
            // Registriere das Projektil
            this.eventBus.emit('REGISTER_ENEMY_BULLET', bullet);
          }
        }
        
        // Sound-Effekt
        this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
          volume: 0.4
        });
      }
    });
  }
  
  /**
   * Spezialangriff: Teleportieren und Angreifen
   */
  private teleportAndAttack(): void {
    // Ursprüngliche Position speichern
    const originalX = this.sprite.x;
    const originalY = this.sprite.y;
    
    // Visueller Effekt: Verschwinden
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        // Neue Position berechnen (in Spielernähe, aber nicht zu nah)
        const targetX = this.player.getSprite().x + 150 + Math.random() * 100;
        const minY = Math.max(50, this.player.getSprite().y - 200);
        const maxY = Math.min(this.scene.scale.height - 50, this.player.getSprite().y + 200);
        const targetY = minY + Math.random() * (maxY - minY);
        
        // Teleportieren
        this.sprite.setPosition(targetX, targetY);
        
        // Wieder erscheinen
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 1,
          duration: 300,
          onComplete: () => {
            // Sofortiger Angriff nach dem Teleport
            this.fire360Degrees();
          }
        });
      }
    });
  }
  
  /**
   * Spezialangriff: Geschwindigkeitsschub
   */
  private speedBoost(): void {
    // Visueller Effekt: Pulsieren
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      yoyo: true,
      repeat: 3,
      duration: 100,
      onComplete: () => {
        // Vorübergehender Geschwindigkeitsboost
        const originalSpeed = this.movementComponent['speed'];
        const boostFactor = 2.5;
        
        // Setze erhöhte Geschwindigkeit
        this.movementComponent['speed'] = originalSpeed * boostFactor;
        
        // Nach kurzer Zeit wieder auf normal zurücksetzen
        this.scene.time.delayedCall(1500, () => {
          if (!this.isDestroyed) {
            this.movementComponent['speed'] = originalSpeed;
          }
        });
        
        // Während des Boosts schnellere Schussrate
        const originalFireRate = this.weaponComponent['fireRate'];
        this.weaponComponent['fireRate'] = originalFireRate / 2;
        
        // Nach kurzer Zeit wieder auf normal zurücksetzen
        this.scene.time.delayedCall(1500, () => {
          if (!this.isDestroyed) {
            this.weaponComponent['fireRate'] = originalFireRate;
          }
        });
      }
    });
  }
  
  /**
   * Überschriebene Methode für Schwierigkeitsanpassungen
   */
  public applyDifficulty(data: { difficulty: number, factor: number }): void {
    // Rufe die Basis-Methode auf
    super.applyDifficulty(data);
    
    const difficulty = data.difficulty;
    
    // Spezifische Anpassungen für EliteEnemy
    if (difficulty >= 3) {
      // Reduziere das Intervall für Spezialangriffe
      this.specialAttackInterval = Math.max(3000, 5000 - (difficulty - 3) * 500);
    }
  }
  
  /**
   * Überschriebene onCollision-Methode für spezifisches Verhalten
   */
  protected onCollision(other: GameObject): void {
    if (other instanceof Player) {
      // Verursache noch mehr Schaden bei Kollision
      other.takeDamage(40);
      
      // Elite-Gegner nehmen auch selbst Schaden bei Kollision
      this.takeDamage(this.health / 2); // Elites werden nicht direkt zerstört
    }
  }
} 