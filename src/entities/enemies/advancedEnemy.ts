/**
 * AdvancedEnemy-Klasse
 * Fortgeschrittener Gegner mit komplexeren Angriffsmustern und Bewegungen
 */

import { BaseEnemy, EnemyConfig } from './baseEnemy';
import { Player } from '../player/player';
import { Constants } from '../../utils/constants';
import { MovementPattern } from './components/movementComponent';
import { ShootingPattern } from './components/weaponComponent';
import { GameObject } from '../gameObject';

export class AdvancedEnemy extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Konfiguriere den fortgeschrittenen Gegner
    const config: EnemyConfig = {
      texture: Constants.ASSET_ENEMY, // Verwende verfügbare Textur
      health: 200, // Mehr Gesundheit
      speed: 150 + Math.random() * 50, // Schneller
      scoreValue: 100, // Mehr Punkte
      fireRate: 800 + Math.random() * 400, // Schnellere Feuerrate
      
      // Bewegungseinstellungen
      movement: {
        pattern: AdvancedEnemy.getRandomAdvancedMovementPattern(),
        speed: 150 + Math.random() * 50,
        changePatternRandomly: true,
        patternChangeInterval: 2500 + Math.random() * 1000,
        trackingFactor: 0.03, // Besseres Tracking
        predictiveAimFactor: 0.3 // Mit Vorhersage
      },
      
      // Waffeneinstellungen
      weapon: {
        pattern: AdvancedEnemy.getRandomAdvancedShootingPattern(),
        fireRate: 800 + Math.random() * 400,
        changePatternRandomly: true,
        patternChangeInterval: 4000 + Math.random() * 1000,
        burstCount: 3,
        spreadCount: 3,
        targetPlayer: true, // Auf Spieler zielen
        predictiveAim: false // Anfangs noch keine Vorhersage
      },
      
      // Visuelle Einstellungen
      visual: {
        tint: 0xFF9000, // Orange-Färbung für fortgeschrittene Gegner
        scale: 1.1, // Etwas größer
        hitEffectDuration: 150,
        glowEffect: true // Mit Gloweffekt
      }
    };
    
    super(scene, x, y, player, config);
  }
  
  /**
   * Gibt ein zufälliges fortgeschrittenes Bewegungsmuster zurück
   */
  private static getRandomAdvancedMovementPattern(): MovementPattern {
    // Bevorzugt komplexere Bewegungsmuster
    const patterns: MovementPattern[] = ['zigzag', 'circular', 'tracking', 'evasive', 'sinusoidal'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
  
  /**
   * Gibt ein zufälliges fortgeschrittenes Schussmuster zurück
   */
  private static getRandomAdvancedShootingPattern(): ShootingPattern {
    // Bevorzugt komplexere Schussmuster
    const patterns: ShootingPattern[] = ['double', 'burst', 'spread', 'random'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
  
  /**
   * Überschriebene Methode für Schwierigkeitsanpassungen
   * Kann spezifische Anpassungen für diesen Gegnertyp enthalten
   */
  public applyDifficulty(data: { difficulty: number, factor: number }): void {
    // Rufe die Basis-Methode auf
    super.applyDifficulty(data);
    
    const difficulty = data.difficulty;
    
    // Spezifische Anpassungen für AdvancedEnemy
    if (difficulty >= 3) {
      // Bei höherer Schwierigkeit prädiktives Zielen aktivieren
      if (Math.random() < 0.5) {
        // Setze die Weapon-Komponente per Reflection-Zugriff
        this.weaponComponent['predictiveAim'] = true;
      }
      
      // Bei höchster Schwierigkeit Bewegungs-Tracking-Faktor erhöhen
      if (difficulty >= 5) {
        // Setze Tracking-Faktor in der Movement-Komponente
        this.movementComponent['trackingFactor'] = 0.05;
      }
    }
  }
  
  /**
   * Überschriebene onCollision-Methode für spezifisches Verhalten
   */
  protected onCollision(other: GameObject): void {
    if (other instanceof Player) {
      // Verursache mehr Schaden bei Kollision
      other.takeDamage(30);
      
      // Zerstöre auch den fortgeschrittenen Gegner
      this.takeDamage(this.health);
    }
  }
} 