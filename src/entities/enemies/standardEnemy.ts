/**
 * StandardEnemy-Klasse
 * Konkrete Implementierung eines einfachen Gegners mit dem neuen komponentenbasierten System
 */

import { BaseEnemy, EnemyConfig } from './baseEnemy';
import { Player } from '../player/player';
import { Constants } from '../../utils/constants';
import { MovementPattern } from './components/movementComponent';
import { ShootingPattern } from './components/weaponComponent';

export class StandardEnemy extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Konfiguriere den Gegner durch ein Konfigurationsobjekt
    const config: EnemyConfig = {
      texture: Constants.ASSET_ENEMY,
      health: 20,
      speed: 100 + Math.random() * 50, // Leichte Variation in der Geschwindigkeit
      scoreValue: 50,
      fireRate: 1000 + Math.random() * 500, // Leichte Variation in der Feuerrate
      
      // Bewegungseinstellungen
      movement: {
        pattern: StandardEnemy.getRandomEasyMovementPattern(),
        speed: 100 + Math.random() * 50,
        changePatternRandomly: true,
        patternChangeInterval: 3000 + Math.random() * 1000
      },
      
      // Waffeneinstellungen
      weapon: {
        pattern: 'single', // Standardgegner nutzen einfache Schussmuster
        fireRate: 1000 + Math.random() * 500,
        changePatternRandomly: false
      },
      
      // Visuelle Einstellungen
      visual: {
        tint: 0xFFFFFF, // Standardfarbe
        scale: 2.0,
        hitEffectDuration: 150
      }
    };
    
    super(scene, x, y, player, config);
  }
  
  /**
   * Gibt ein zufälliges einfaches Bewegungsmuster zurück
   * Standardgegner verwenden nur grundlegende Bewegungsmuster
   */
  private static getRandomEasyMovementPattern(): MovementPattern {
    const easyPatterns: MovementPattern[] = ['linear', 'zigzag', 'circular'];
    return easyPatterns[Math.floor(Math.random() * easyPatterns.length)];
  }
  
  /**
   * Überschriebene Methode für Schwierigkeitsanpassungen
   * Kann spezifische Anpassungen für diesen Gegnertyp enthalten
   */
  public applyDifficulty(data: { difficulty: number, factor: number }): void {
    // Rufe die Basis-Methode auf
    super.applyDifficulty(data);
    
    const difficulty = data.difficulty;
    
    // Spezifische Anpassungen für StandardEnemy
    if (difficulty >= 3) {
      // Ab Schwierigkeitsgrad 3 können Standardgegner auch fortgeschrittenere Bewegungsmuster erhalten
      const advancedPatternChance = 0.3; // 30% Chance
      
      if (Math.random() < advancedPatternChance) {
        const advancedPatterns: MovementPattern[] = ['tracking', 'sinusoidal'];
        const pattern = advancedPatterns[Math.floor(Math.random() * advancedPatterns.length)];
        this.movementComponent.setPattern(pattern);
      }
      
      // Ab Schwierigkeitsgrad 3 können sie auch Doppelschüsse abfeuern
      if (Math.random() < advancedPatternChance) {
        this.weaponComponent.setPattern('double');
      }
    }
  }
} 