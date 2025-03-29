/**
 * Bewegungskomponente für Gegner
 * Enthält wiederverwendbare Bewegungsmuster, die von Gegnern verwendet werden können
 */

import { Player } from '../../player/player';

export type MovementPattern = 'linear' | 'zigzag' | 'circular' | 'tracking' | 'evasive' | 'sinusoidal' | 'random';

export interface MovementConfig {
  pattern?: MovementPattern;
  speed?: number;
  baseVelocityX?: number;
  amplitude?: number;        // Allgemeine Amplitude für Bewegungsmuster
  frequency?: number;        // Allgemeine Frequenz für Bewegungsmuster
  zigzagAmplitude?: number;  // Spezifische Amplitude für Zickzack-Bewegung
  zigzagFrequency?: number;  // Spezifische Frequenz für Zickzack-Bewegung
  circleRadius?: number;     // Radius für Kreisbewegung
  circleSpeed?: number;      // Geschwindigkeit für Kreisbewegung
  sinAmplitude?: number;     // Amplitude für Sinusbewegung
  sinFrequency?: number;     // Frequenz für Sinusbewegung
  patternChangeInterval?: number; // Intervall für zufälligen Musterwechsel
  trackingFactor?: number;
  predictiveAimFactor?: number;
  changePatternRandomly?: boolean;
  rotateToDirection?: boolean;
  evadeDistance?: number;
  randomMovementInterval?: number;
}

export class MovementComponent {
  private pattern: MovementPattern;
  private speed: number;
  private baseVelocityX: number;
  private zigzagAmplitude: number;
  private zigzagFrequency: number;
  private circleRadius: number;
  private circleSpeed: number;
  private circleAngle: number = 0;
  private circleOriginX: number = 0;
  private lastPositionY: number = 0;
  private sinAmplitude: number;
  private sinFrequency: number;
  private randomMoveTimer: number = 0;
  private randomMoveTarget: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private lastPatternChangeTime: number = 0;
  private patternChangeInterval: number;
  private trackingFactor: number;
  private predictiveAimFactor: number;
  private changePatternRandomly: boolean;
  private evasiveManeuverTime: number = 0;
  private rotateToDirection: boolean;
  private evadeDistance: number;
  private randomMovementInterval: number;
  
  private sprite: Phaser.Physics.Arcade.Sprite;
  private player: Player;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite, player: Player, config: MovementConfig = {}) {
    this.scene = scene;
    this.sprite = sprite;
    this.player = player;
    
    // Grundlegende Bewegungseinstellungen
    this.pattern = config.pattern || 'linear';
    this.speed = config.speed !== undefined ? config.speed : 100;
    this.baseVelocityX = config.baseVelocityX || -100;
    
    // Erweiterte Musterparameter
    this.zigzagAmplitude = config.zigzagAmplitude || 30 + Math.random() * 20;
    this.zigzagFrequency = config.zigzagFrequency || 0.0005 + Math.random() * 0.001;
    this.circleRadius = config.circleRadius || 40 + Math.random() * 30;
    this.circleSpeed = config.circleSpeed || 0.01 + Math.random() * 0.02;
    this.sinAmplitude = config.sinAmplitude || 100 + Math.random() * 50;
    this.sinFrequency = config.sinFrequency || 0.001 + Math.random() * 0.001;
    
    // Muster-Wechsel-Einstellungen
    this.patternChangeInterval = config.patternChangeInterval || 4000;
    this.changePatternRandomly = config.changePatternRandomly || false;
    
    // Spieler-Tracking-Einstellungen
    this.trackingFactor = config.trackingFactor || 0.02;
    this.predictiveAimFactor = config.predictiveAimFactor || 0;
    
    // Rotation-Einstellungen
    this.rotateToDirection = config.rotateToDirection || false;
    
    // Ausweich-Einstellungen
    this.evadeDistance = config.evadeDistance || 200;
    
    // Random-Movement-Einstellungen
    this.randomMovementInterval = config.randomMovementInterval || 1000;
    
    // Initialisierung
    this.circleOriginX = this.sprite.x;
    this.lastPositionY = this.sprite.y;
  }

  /**
   * Aktualisiert die Bewegungslogik für den aktuellen Frame
   */
  public update(time: number, delta: number): void {
    // Normalisierter Zeitfaktor für gleichmäßige Bewegung unabhängig von der Framerate
    const normalizedDelta = delta / 16.666;
    
    // Muster-Wechsel, falls aktiviert
    if (this.changePatternRandomly && time > this.lastPatternChangeTime + this.patternChangeInterval) {
      this.changePattern();
      this.lastPatternChangeTime = time;
    }
    
    // Bewegungslogik basierend auf dem aktuellen Muster
    switch (this.pattern) {
      case 'linear':
        this.moveLinear(normalizedDelta);
        break;
      case 'zigzag':
        this.moveZigzag(time, normalizedDelta);
        break;
      case 'circular':
        this.moveCircular(time, normalizedDelta);
        break;
      case 'tracking':
        this.moveTracking(normalizedDelta);
        break;
      case 'evasive':
        this.moveEvasive(time, normalizedDelta);
        break;
      case 'sinusoidal':
        this.moveSinusoidal(time, normalizedDelta);
        break;
      case 'random':
        this.moveRandom(time, normalizedDelta);
        break;
    }
  }

  /**
   * Ändert das Bewegungsmuster zufällig
   */
  private changePattern(): void {
    const patterns: MovementPattern[] = ['linear', 'zigzag', 'circular', 'tracking', 'evasive', 'sinusoidal', 'random'];
    let newPatternIndex = Math.floor(Math.random() * patterns.length);
    
    // Vermeide Wiederholung des gleichen Musters
    if (patterns[newPatternIndex] === this.pattern && patterns.length > 1) {
      newPatternIndex = (newPatternIndex + 1) % patterns.length;
    }
    
    this.pattern = patterns[newPatternIndex];

    // Visuelles Feedback beim Musterwechsel
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      yoyo: true,
      duration: 150,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Setzt das Bewegungsmuster explizit
   */
  public setPattern(pattern: MovementPattern): void {
    this.pattern = pattern;
  }

  /**
   * Lineare Bewegung - einfach nach links bewegen
   */
  private moveLinear(normalizedDelta: number): void {
    this.sprite.setVelocityX(this.baseVelocityX);
    this.sprite.setVelocityY(0);
  }

  /**
   * Zickzack-Bewegung - sanfte sinusförmige Bewegung auf der Y-Achse
   */
  private moveZigzag(time: number, normalizedDelta: number): void {
    this.sprite.setVelocityX(this.baseVelocityX);
    
    // Berechne die Sinusbewegung mit reduzierter Amplitude
    const baseY = this.lastPositionY;
    const yOffset = Math.sin(time * this.zigzagFrequency) * this.zigzagAmplitude;
    
    // Sanftere Bewegung zum Ziel mit dämpfendem Faktor
    const targetY = baseY + yOffset;
    const smoothingFactor = 3.0; // Niedriger für sanftere Bewegung
    const currentVelocityY = (targetY - this.sprite.y) * smoothingFactor;
    
    this.sprite.setVelocityY(currentVelocityY);
  }

  /**
   * Kreisförmige Bewegung - Rotationsbewegung um einen Punkt
   */
  private moveCircular(time: number, normalizedDelta: number): void {
    this.circleAngle += this.circleSpeed * normalizedDelta;
    this.sprite.setVelocityX(this.baseVelocityX);
    
    const targetY = this.lastPositionY + Math.sin(this.circleAngle) * this.circleRadius;
    const velocityY = (targetY - this.sprite.y) * 10;
    this.sprite.setVelocityY(velocityY);
  }

  /**
   * Führt eine Verfolgungsbewegung zum Spieler aus
   */
  private moveTracking(normalizedDelta: number): void {
    if (!this.player || !this.player.getSprite() || !this.player.getSprite().active) return;
    
    // Berechne Richtungsvektor zum Spieler
    const playerSprite = this.player.getSprite();
    const dirX = playerSprite.x - this.sprite.x;
    const dirY = playerSprite.y - this.sprite.y;
    
    // Normalisiere den Richtungsvektor
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    const normX = dirX / length;
    const normY = dirY / length;
    
    // Anpassungen für "tracking"
    let targetX, targetY;
    
    // Achte darauf, dass Gegner nicht zu weit nach links gehen
    const minX = this.sprite.width * 1.5;
    
    if (this.trackingFactor > 0) {
      // Berechne das Ziel basierend auf dem Tracking-Faktor
      // Ein höherer Tracking-Faktor bedeutet, der Gegner folgt genauer
      targetX = Math.max(minX, this.sprite.x - this.speed * 0.01 * normalizedDelta + normX * this.trackingFactor * normalizedDelta * 0.1);
      targetY = this.sprite.y + normY * this.trackingFactor * normalizedDelta * 0.1;
      
      // Begrenze die Bewegung in X-Richtung, damit der Gegner im Bildschirm bleibt
      const maxX = this.scene.scale.width - this.sprite.width * 0.5;
      targetX = Math.min(maxX, targetX);
      
      // Debug-Logging
      if (Math.random() < 0.01) {
        console.log(`[MOVEMENT] Tracking: Position (${this.sprite.x.toFixed(0)}, ${this.sprite.y.toFixed(0)}), Ziel (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`);
      }
    } else {
      // Bei negativem Tracking-Faktor: Gegner bewegt sich zur Bildschirmmitte 
      // und bleibt zwischen 60-80% der Bildschirmbreite
      const screenCenterX = this.scene.scale.width * 0.7;
      const screenCenterY = this.scene.scale.height / 2;
      
      const toCenterX = screenCenterX - this.sprite.x;
      const toCenterY = screenCenterY - this.sprite.y;
      
      const centerLength = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
      const normCenterX = toCenterX / centerLength;
      const normCenterY = toCenterY / centerLength;
      
      targetX = this.sprite.x + normCenterX * Math.abs(this.trackingFactor) * normalizedDelta * 0.1;
      targetY = this.sprite.y + normCenterY * Math.abs(this.trackingFactor) * normalizedDelta * 0.1;
    }
    
    // Setze die neue Position
    this.sprite.setPosition(targetX, targetY);
    
    // Optional: Drehe den Gegner in Bewegungsrichtung
    if (this.rotateToDirection) {
      const angle = Math.atan2(normY, normX) * 180 / Math.PI;
      this.sprite.setAngle(angle);
    }
  }

  /**
   * Ausweich-Bewegung - versucht, dem Spieler auszuweichen
   */
  private moveEvasive(time: number, normalizedDelta: number): void {
    this.sprite.setVelocityX(this.baseVelocityX);
    
    // Evasives Manöver starten, wenn eine bestimmte Zeit vergangen ist
    if (time > this.evasiveManeuverTime) {
      // Entscheiden, ob nach oben oder unten ausgewichen werden soll
      const direction = this.sprite.y > this.player.getSprite().y ? 1 : -1;
      const randOffset = (Math.random() * 100) + 50;
      
      this.sprite.setVelocityY(direction * randOffset);
      
      // Nächstes Manöver planen
      this.evasiveManeuverTime = time + 1000 + Math.random() * 1000;
    }
  }

  /**
   * Sinusförmige Bewegung - smoothere, wellenförmige Bewegung
   */
  private moveSinusoidal(time: number, normalizedDelta: number): void {
    this.sprite.setVelocityX(this.baseVelocityX);
    
    // Berechne die sinusförmige Bewegung
    const baseY = this.lastPositionY;
    const yOffset = Math.sin(time * this.sinFrequency) * this.sinAmplitude;
    
    // Sanfte Bewegung zum Ziel
    const targetY = baseY + yOffset;
    const currentVelocityY = (targetY - this.sprite.y) * 5; // Multiplikator für Smoothing
    
    this.sprite.setVelocityY(currentVelocityY);
  }

  /**
   * Zufällige Bewegung - bewegt sich zu zufälligen Punkten
   */
  private moveRandom(time: number, normalizedDelta: number): void {
    this.sprite.setVelocityX(this.baseVelocityX);
    
    // Neues Ziel wählen, wenn Timer abgelaufen ist
    if (this.randomMoveTimer <= time) {
      // Berechne einen neuen zufälligen Punkt innerhalb des sichtbaren Bereichs
      const minY = 100;
      const maxY = this.scene.scale.height - 100;
      const randomY = minY + Math.random() * (maxY - minY);
      
      this.randomMoveTarget.set(this.sprite.x, randomY);
      this.randomMoveTimer = time + 1000 + Math.random() * 1500;
    }
    
    // Bewege zum Ziel
    const yDiff = this.randomMoveTarget.y - this.sprite.y;
    const velocityY = yDiff * 0.1 * this.speed;
    
    this.sprite.setVelocityY(velocityY);
  }

  /**
   * Passt Bewegungsparameter an die Schwierigkeit an
   */
  public adjustForDifficulty(difficulty: number): void {
    const difficultyFactor = 1 + (difficulty - 1) * 0.15;
    
    // Erhöhe Geschwindigkeit mit steigender Schwierigkeit
    this.speed *= difficultyFactor;
    this.baseVelocityX *= difficultyFactor;
    
    // Verbessere Tracking mit steigender Schwierigkeit
    if (difficulty >= 3) {
      this.trackingFactor *= 1.2;
      this.predictiveAimFactor = Math.min(1.5, this.predictiveAimFactor + 0.2);
      
      // Erhöhe die Häufigkeit der Musteränderungen
      this.patternChangeInterval = Math.max(2000, this.patternChangeInterval * 0.8);
    }
  }
} 