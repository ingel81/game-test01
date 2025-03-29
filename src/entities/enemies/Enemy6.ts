import { Enemy } from './enemy';
import { Constants } from '../../utils/constants';
import { Player } from '../player/player';
import { GameObject } from '../gameObject';
import { EventBus, EventType } from '../../utils/eventBus';

/**
 * Enemy6-Klasse - basierend auf BasicEnemy
 */
export class Enemy6 extends Enemy {
  private player: Player;
  private movementPattern: 'linear' | 'zigzag' | 'circular' | 'tracking' | 'evasive' | 'sinusoidal' | 'random';
  private zigzagAmplitude: number = 100;
  private zigzagFrequency: number = 0.002;
  private circleRadius: number = 50;
  private circleSpeed: number = 0.02;
  private circleAngle: number = 0;
  private circleOriginX: number = 0;
  private lastShootTime: number = 0;
  private shootDelay: number = 800 + Math.random() * 500;
  private baseVelocityX: number = 0;
  private bullets: Phaser.Physics.Arcade.Group;
  private destroyed: boolean = false;
  private difficultyLevel: number = 1;
  private lastPatternChangeTime: number = 0;
  private patternChangeInterval: number = 4000; // 4 Sekunden
  private predictiveAimFactor: number = 0;
  private accelerationFactor: number = 1;
  private evasiveManeuverTime: number = 0;
  private lastPositionY: number = 0;
  private shootingPattern: 'single' | 'double' | 'burst' | 'random' = 'single';
  private lastShootingPatternChangeTime: number = 0;
  private shootingPatternChangeInterval: number = 6000; // 6 Sekunden
  private burstCount: number = 0;
  private burstTotal: number = 3;
  private burstDelay: number = 150;
  private lastBurstTime: number = 0;
  private sinAmplitude: number = 0;
  private sinFrequency: number = 0;
  private randomMoveTimer: number = 0;
  private randomMoveTarget: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Variablere Feuerrate
    const baseFireRate = 800 + Math.random() * 500;
    
    // Rufe den Konstruktor der Basisklasse auf
    super(
      scene,
      x,
      y,
      'enemy6', // Verwende das enemy6.png Sprite
      Constants.ENEMY_HEALTH,
      Constants.ENEMY_SPEED,
      Constants.ENEMY_SCORE,
      baseFireRate
    );
    
    this.player = player;
    this.lastPositionY = y;
    
    // Zufällige Farbvariation für mehr Abwechslung
    const colorVariation = Math.random();
    if (colorVariation > 0.8) {
      this.sprite.setTint(0x88aaff); // Bläuliche Variante
    } else if (colorVariation > 0.6) {
      this.sprite.setTint(0xffaa88); // Rötliche Variante
    } else if (colorVariation > 0.4) {
      this.sprite.setTint(0xaaffaa); // Grünliche Variante
    } else if (colorVariation > 0.2) {
      this.sprite.setTint(0xffff88); // Gelbliche Variante
    }
    
    // Zufälliges Größenvarianz für mehr Abwechslung (2.2-2.8)
    const sizeScale = 0.4;
    
    // Optimierte Sprite-Einstellungen für flüssigere Rendering
    this.sprite.setFlipX(true);     // Horizontales Spiegeln für Bewegung nach links
    this.sprite.setFlipY(false);    // Keine vertikale Spiegelung
    this.sprite.setAngle(0);        // Keine Rotation
    this.sprite.setScale(sizeScale);  // Variablere Größe
    this.sprite.setOrigin(0.5, 0.5); // Zentrum als Ursprung für pixelgenaues Rendering
    
    // Gelegentlich Pulsieren oder andere visuelle Effekte hinzufügen
    if (Math.random() > 0.7) {
      this.addPulseEffect();
    }
    
    // Texturen für besseres Rendering optimieren
    if (this.sprite.texture) {
      this.sprite.texture.setFilter(Phaser.Textures.NEAREST);
    }
    
    // Physik-Eigenschaften für bessere Performance
    if (this.sprite.body instanceof Phaser.Physics.Arcade.Body) {
      this.sprite.body.setDamping(true);
      this.sprite.body.setDrag(0.99, 0.99);
    }
    
    // Kollisionsbox optimieren
    const width = this.sprite.width * 0.8;
    const height = this.sprite.height * 0.8;
    this.sprite.body.setSize(width, height);
    this.sprite.body.setOffset((this.sprite.width - width) / 2, (this.sprite.height - height) / 2);
    
    // Bewegungsgeschwindigkeit mit etwas mehr Variation festlegen
    this.baseVelocityX = -100 - Math.random() * 80;
    
    // Bewegungsmuster zufällig wählen - jetzt mehr Muster von Anfang an
    const patterns = ['linear', 'zigzag', 'circular', 'tracking', 'evasive', 'sinusoidal', 'random'] as const;
    const patternIndex = Math.floor(Math.random() * patterns.length);
    this.movementPattern = patterns[patternIndex];
    
    // Zufälliges Schussmuster wählen
    const shootPatterns = ['single', 'double', 'burst', 'random'] as const;
    this.shootingPattern = shootPatterns[Math.floor(Math.random() * shootPatterns.length)];
    
    // Individuelle Parameter für mehr Variation
    this.zigzagAmplitude = 80 + Math.random() * 60;
    this.zigzagFrequency = 0.001 + Math.random() * 0.002;
    this.circleRadius = 40 + Math.random() * 30;
    this.circleSpeed = 0.01 + Math.random() * 0.02;
    this.sinAmplitude = 100 + Math.random() * 50;
    this.sinFrequency = 0.001 + Math.random() * 0.001;
    
    // Timer für das Schießen initialisieren
    this.lastShootTime = 0;
    this.shootDelay = baseFireRate;
    
    // Bullets-Gruppe mit optimierten Einstellungen initialisieren
    this.bullets = this.scene.physics.add.group({
      defaultKey: Constants.ASSET_ENEMY_BULLET,
      maxSize: 10,
      runChildUpdate: true // Aktiviere automatische Updates für Kinder
    });
    
    // Setze Daten für Kollisionen
    this.sprite.setData('type', 'enemy');
    this.sprite.setData('health', 100);
    this.sprite.setData('instance', this);
    
    // Ereignislistener für Schwierigkeitsänderung hinzufügen
    this.eventBus.on(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);
  }

  /**
   * Behandelt Schwierigkeitsänderungen
   */
  private onDifficultyChanged = (data: any): void => {
    const newDifficulty = typeof data === 'object' ? data.difficulty : data;
    const difficultyFactor = typeof data === 'object' ? data.factor : 1.0 + (newDifficulty - 1) * 0.1;
    
    this.difficultyLevel = newDifficulty;
    
    // Erhöhe Geschwindigkeit, Feuerkraft und KI-Intelligenz mit zunehmender Schwierigkeit
    this.speed = Constants.ENEMY_SPEED * difficultyFactor;
    this.fireRate = Math.max(200, 800 - (newDifficulty - 1) * 100);
    
    // Viel stärkeres Zielvermögen bei höheren Levels
    this.predictiveAimFactor = Math.min(1.0, (newDifficulty - 1) * 0.2);
    
    // Deutlich höhere Beschleunigung
    this.accelerationFactor = difficultyFactor;
  };

  /**
   * Fügt einen Pulseffekt zum Sprite hinzu
   */
  private addPulseEffect(): void {
    if (!this.sprite || !this.sprite.active) return;
    
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.1,
      scaleY: this.sprite.scaleY * 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  protected move(time: number, delta: number): void {
    if (!this.sprite || !this.sprite.active) return;
    
    // Basisbewegung nach links
    this.sprite.setVelocityX(this.baseVelocityX);
    
    // Vertikale Bewegung basierend auf dem aktuellen Muster
    switch (this.movementPattern) {
      case 'linear':
        this.sprite.setVelocityY(0);
        break;
      case 'zigzag':
        this.sprite.setVelocityY(Math.sin(time * this.zigzagFrequency) * this.zigzagAmplitude);
        break;
      default:
        this.sprite.setVelocityY(0);
    }
  }

  protected shoot(time: number): void {
    if (!this.sprite || !this.sprite.active) return;
    
    if (time - this.lastShootTime >= this.shootDelay) {
      const bullet = this.bullets.create(this.sprite.x, this.sprite.y, Constants.ASSET_ENEMY_BULLET);
      if (bullet) {
        bullet.setVelocity(-200, 0);
        bullet.setAngle(180); // Drehe das Schuss-Sprite um 180 Grad
        this.lastShootTime = time;
      }
    }
  }

  protected onCollision(other: GameObject): void {
    if (other.getSprite().getData('type') === 'player') {
      this.takeDamage(100);
    }
  }

  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }

  public update(time: number, delta: number): void {
    if (this.destroyed) return;
    
    this.move(time, delta);
    this.shoot(time);
  }

  protected onDestroy(): void {
    this.destroyed = true;
    super.onDestroy();
  }

  public takeDamage(amount: number): boolean {
    const isDead = super.takeDamage(amount);
    if (isDead) {
      this.destroyed = true;
    }
    return isDead;
  }

  public applyDifficulty(data: any): void {
    const newDifficulty = typeof data === 'object' ? data.difficulty : data;
    const difficultyFactor = typeof data === 'object' ? data.factor : 1.0 + (newDifficulty - 1) * 0.1;
    
    this.difficultyLevel = newDifficulty;
    
    // Erhöhe Geschwindigkeit, Feuerkraft und KI-Intelligenz mit zunehmender Schwierigkeit
    this.speed = Constants.ENEMY_SPEED * difficultyFactor;
    this.fireRate = Math.max(200, 800 - (newDifficulty - 1) * 100);
    
    // Viel stärkeres Zielvermögen bei höheren Levels
    this.predictiveAimFactor = Math.min(1.0, (newDifficulty - 1) * 0.2);
    
    // Deutlich höhere Beschleunigung
    this.accelerationFactor = difficultyFactor;
  }
} 