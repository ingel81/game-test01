import { Enemy } from './enemy';
import { Constants } from '../../utils/constants';
import { Player } from '../player/player';
import { GameObject } from '../gameObject';
import { EventBus, EventType } from '../../utils/eventBus';

/**
 * StandardFeind-Klasse
 */
export class BasicEnemy extends Enemy {
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
      Constants.ASSET_ENEMY,
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
    const sizeScale = 2.2 + Math.random() * 0.6;
    
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
    // Verwende jetzt den exponentiellen difficultyFactor für stärkere Skalierung
    this.speed = Constants.ENEMY_SPEED * difficultyFactor;
    this.fireRate = Math.max(200, 800 - (newDifficulty - 1) * 100);
    
    // Viel stärkeres Zielvermögen bei höheren Levels
    this.predictiveAimFactor = Math.min(1.0, (newDifficulty - 1) * 0.2);
    
    // Deutlich höhere Beschleunigung
    this.accelerationFactor = difficultyFactor;
    
    // Ab Schwierigkeitsgrad 2: Häufigerer Bewegungsmusterwechsel
    if (newDifficulty >= 2) {
      // Schnellerer Wechsel bei höherer Schwierigkeit
      this.patternChangeInterval = Math.max(1500, 4000 - (newDifficulty - 1) * 300);
      this.shootingPatternChangeInterval = Math.max(2000, 6000 - (newDifficulty - 1) * 400);
    }
    
    // Ab Schwierigkeitsgrad 3: Erweiterte Bewegungsmuster bevorzugen
    if (newDifficulty >= 3) {
      const patterns = ['linear', 'zigzag', 'circular', 'tracking', 'evasive', 'sinusoidal', 'random'] as const;
      // Erhöhe die Wahrscheinlichkeit für komplexere Muster bei höherer Schwierigkeit
      let patternIndex = 0;
      
      if (newDifficulty >= 5) {
        // Bei höheren Schwierigkeitsgraden bevorzuge fortgeschrittene Bewegungsmuster
        patternIndex = Math.floor(Math.random() * patterns.length * 2);
        if (patternIndex >= patterns.length) {
          // Doppelte Chance auf fortgeschrittene Muster (tracking, evasive, etc.)
          patternIndex = 3 + Math.floor(Math.random() * 4);
        }
      } else {
        patternIndex = Math.floor(Math.random() * patterns.length);
      }
      
      patternIndex = Math.min(patternIndex, patterns.length - 1);
      this.movementPattern = patterns[patternIndex];
      
      // Auch das Schussmuster dynamisch anpassen
      const shootPatterns = ['single', 'double', 'burst', 'random'] as const;
      const preferAdvanced = Math.random() < 0.6; // 60% Chance für fortgeschrittene Muster
      if (preferAdvanced) {
        this.shootingPattern = shootPatterns[1 + Math.floor(Math.random() * 3)]; // Bevorzuge double, burst oder random
      } else {
        this.shootingPattern = shootPatterns[Math.floor(Math.random() * shootPatterns.length)];
      }
    }
  }

  /**
   * Bewegt sich schnell auf den Spieler zu für einen Angriff
   * Wird bei hohen Schwierigkeitsgraden als Teil des 'tracking' Musters verwendet
   */
  private executeAggressiveMove(deltaTime: number): void {
    if (!this.player || !this.sprite.active) return;
    
    const playerSprite = this.player.getSprite();
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, 
      playerSprite.x, playerSprite.y
    );
    
    // Spezielle Animation für den aggressiven Angriff
    if (this.sprite.alpha === 1) {
      // Nur einmal pro Angriff animieren
      this.sprite.setAlpha(0.9);
      
      // Veränderung der Farbe für den Angriff
      this.sprite.setTint(0xff0000); // Rot für aggressiven Angriff
      
      // Kurzes Aufblähen als Warnung
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: this.sprite.scaleX * 1.2,
        scaleY: this.sprite.scaleY * 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (this.sprite && this.sprite.active) {
            this.sprite.setAlpha(1);
          }
        }
      });
    }
    
    // Bewege aggressiv in Richtung Spieler mit erhöhter Geschwindigkeit
    const angle = Math.atan2(playerSprite.y - this.sprite.y, playerSprite.x - this.sprite.x);
    const speedFactor = 2.5 * this.accelerationFactor;
    
    // X-Bewegung ist immer negativ (nach links), aber mit variablen Geschwindigkeit
    let velX = Math.cos(angle) * this.speed * speedFactor;
    
    // Bei zu starker X-Bewegung nach rechts begrenzen
    if (velX > 0) velX = -this.speed * 0.5;
    
    const velY = Math.sin(angle) * this.speed * speedFactor;
    
    this.sprite.setVelocity(velX, velY);
  }

  /**
   * Bewegung des Feindes
   */
  protected move(time: number, delta: number): void {
    // Ein konstanter Zeitfaktor ist wichtig für gleichmäßige Bewegung unabhängig von der Framerate
    const normalizedDelta = delta / 16.666;
    
    // Verwende die Basis-Geschwindigkeit aus der Enemy-Klasse, mit Schwierigkeitsfaktor
    const baseSpeed = this.speed * 0.05 * this.accelerationFactor;
    
    // Wechsle Bewegungsmuster bei höherer Schwierigkeit
    if (time > this.lastPatternChangeTime + this.patternChangeInterval) {
      this.lastPatternChangeTime = time;
      // Muster zufällig wählen mit bevorzugten Mustern je nach Schwierigkeit
      const patterns = ['linear', 'zigzag', 'circular', 'tracking', 'evasive', 'sinusoidal', 'random'] as const;
      if (this.difficultyLevel >= 3) {
        // Komplexere Bewegung für höhere Schwierigkeitsgrade
        const advancedPatternChance = 0.3 + (this.difficultyLevel - 3) * 0.1; // 30-70% Chance
        if (Math.random() < advancedPatternChance) {
          const advancedPatterns = ['tracking', 'evasive', 'sinusoidal', 'random'];
          this.movementPattern = advancedPatterns[Math.floor(Math.random() * advancedPatterns.length)] as any;
        } else {
          this.movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
        }
      } else {
        // Bei niedrigeren Schwierigkeitsgraden nur grundlegende Muster
        const basicPatterns = ['linear', 'zigzag', 'circular'];
        this.movementPattern = basicPatterns[Math.floor(Math.random() * basicPatterns.length)] as any;
      }
      
      // Visuelles Feedback beim Musterwechsel
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.7,
        yoyo: true,
        duration: 150,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Prüfen, ob wir einen aggressiven Angriff durchführen sollten (bei höheren Schwierigkeitsgraden)
    if (this.difficultyLevel >= 4 && 
        this.movementPattern === 'tracking' && 
        Math.random() < 0.01 * this.difficultyLevel) { // 4-10% Chance pro Frame bei hoher Schwierigkeit
      
      this.executeAggressiveMove(delta);
      return; // Wir haben bereits die Bewegung durchgeführt
    }
    
    // Berechne Positionen: für flüssigere Bewegung direkt mit der Physik arbeiten
    let deltaX = -baseSpeed * 3;  
    let deltaY = 0;
    
    // Bewegungsmuster mit Zeitabständen, die für flüssigere Animation sorgen
    switch (this.movementPattern) {
      case 'linear':
        // Lineare Bewegung mit minimaler Schwankung
        deltaY = Math.sin(time * 0.0005) * 0.3; 
        break;
        
      case 'zigzag':
        // Zick-Zack mit optimierten Faktoren
        const zigzagFrequency = this.zigzagFrequency * (1 + (this.difficultyLevel - 1) * 0.1);
        deltaY = Math.sin(time * zigzagFrequency) * 1.5 * this.accelerationFactor;
        break;
        
      case 'circular':
        // Kreisförmige Bewegung mit kontinuierlicher Winkeländerung
        const circleSpeed = this.circleSpeed * (1 + (this.difficultyLevel - 1) * 0.1);
        this.circleAngle += circleSpeed * normalizedDelta;
        deltaY = Math.sin(this.circleAngle) * 1.2 * this.accelerationFactor;
        break;
        
      case 'sinusoidal':
        // Wellenförmige Bewegung mit komplexerer Formel
        deltaY = Math.sin(time * this.sinFrequency) * this.sinAmplitude * 0.01 * this.accelerationFactor;
        // Variiere auch die X-Geschwindigkeit sinusförmig
        deltaX = -baseSpeed * (2.5 + Math.sin(time * 0.0005) * 0.7);
        break;
        
      case 'random':
        // Zufällige Bewegung mit Zielpunktwechsel
        this.randomMoveTimer -= delta;
        if (this.randomMoveTimer <= 0) {
          // Neuen zufälligen Zielpunkt wählen
          this.randomMoveTimer = 1000 + Math.random() * 1000;
          this.randomMoveTarget.y = 100 + Math.random() * (this.scene.scale.height - 200);
        }
        
        // Bewege in Richtung des Zielpunkts
        const targetDiffY = this.randomMoveTarget.y - this.sprite.y;
        deltaY = Math.sign(targetDiffY) * Math.min(Math.abs(targetDiffY) * 0.02, baseSpeed * 1.2);
        
        // Variiere die X-Geschwindigkeit für unvorhersehbare Bewegung
        deltaX = -baseSpeed * (2 + (Math.random() - 0.5) * 0.8);
        break;
        
      case 'tracking':
        // Folgt aktiv dem Spieler mit angepasster Geschwindigkeit
        const playerY = this.player.getSprite().y;
        const playerDiffY = playerY - this.sprite.y;
        const trackingSpeed = 0.5 + (this.difficultyLevel - 1) * 0.15;
        
        // Berechne Verfolgungsweg mit sanfter Annäherung
        deltaY = Math.sign(playerDiffY) * Math.min(Math.abs(playerDiffY) * 0.05, baseSpeed * trackingSpeed);
        
        // Zusätzliche horizontale Komponente für unerwartetes Verhalten
        if (this.difficultyLevel >= 4) {
          const xDrift = Math.sin(time * 0.001) * 0.3;
          deltaX = -baseSpeed * (2.8 + xDrift);
        }
        break;
        
      case 'evasive':
        // Ausweichbewegungen wenn der Spieler schießt oder in der Nähe ist
        // Prüfe Entfernung zum Spieler
        const playerSprite = this.player.getSprite();
        const distanceToPlayer = Phaser.Math.Distance.Between(
          this.sprite.x, this.sprite.y, 
          playerSprite.x, playerSprite.y
        );
        
        // Evasive Manöver wenn nahe am Spieler oder wenn Zeit für Richtungswechsel
        if (distanceToPlayer < 200 || time > this.evasiveManeuverTime) {
          this.evasiveManeuverTime = time + 1000 + Math.random() * 1000;
          // Zufällige Bewegung nach oben/unten
          deltaY = (Math.random() - 0.5) * 3 * baseSpeed * this.accelerationFactor;
        } else {
          // Schnelle Richtungswechsel
          deltaY = Math.sin(time * 0.003) * 2.5 * this.accelerationFactor;
        }
        
        // Variable horizontale Geschwindigkeit
        const xVariation = Math.cos(time * 0.0015) * 0.5;
        deltaX = -baseSpeed * (2.5 + xVariation);
        break;
    }
    
    // Geschwindigkeiten direkt auf den Körper anwenden statt Position zu verändern
    // Dies führt zu flüssigerem Rendering durch Phaser's Physik-System
    if (this.sprite.body instanceof Phaser.Physics.Arcade.Body) {
      this.sprite.body.setVelocity(
        deltaX * normalizedDelta * 60, // Skalieren für 60 FPS als Basis
        deltaY * normalizedDelta * 60
      );
    } else {
      // Fallback für den Fall, dass kein Arcade-Body vorhanden ist
      this.sprite.x += deltaX * normalizedDelta;
      this.sprite.y += deltaY * normalizedDelta;
      this.sprite.setVelocity(0, 0); // Nullsetzen der Geschwindigkeit
    }
    
    // Speichere aktuelle Position für Bewegungsberechnungen
    this.lastPositionY = this.sprite.y;
    
    // Pixelgenaues Rendering für schärfere Darstellung
    this.sprite.setOrigin(0.5, 0.5); // Zentrum als Ursprung
    
    // Entferne den Feind, wenn er den Bildschirm verlässt
    if (this.sprite.x < -50) {
      this.destroy();
    }
    
    // Wechsle Schussmuster bei höherer Schwierigkeit
    if (time > this.lastShootingPatternChangeTime + this.shootingPatternChangeInterval) {
      this.lastShootingPatternChangeTime = time;
      
      // Wähle ein neues Schussmuster mit bevorzugten Mustern je nach Schwierigkeit
      const patterns = ['single', 'double', 'burst', 'random'] as const;
      
      if (this.difficultyLevel >= 3) {
        // Komplexere Schussmuster für höhere Schwierigkeitsgrade
        const advancedPatternChance = 0.3 + (this.difficultyLevel - 3) * 0.1; // 30-70% Chance
        if (Math.random() < advancedPatternChance) {
          const advancedPatterns = ['double', 'burst', 'random'];
          this.shootingPattern = advancedPatterns[Math.floor(Math.random() * advancedPatterns.length)] as any;
        } else {
          this.shootingPattern = patterns[Math.floor(Math.random() * patterns.length)];
        }
      } else {
        // Bei niedrigeren Schwierigkeitsgraden bevorzugt einfache Schussmuster
        const basicPatternChance = 0.7; // 70% Chance für den einfachen Schuss
        if (Math.random() < basicPatternChance) {
          this.shootingPattern = 'single';
        } else {
          this.shootingPattern = patterns[Math.floor(Math.random() * patterns.length)];
        }
      }
    }
  }

  /**
   * Schießen des Feindes
   */
  protected shoot(time: number): void {
    // Für Burst-Schussmuster prüfen, ob wir gerade in einer Burst-Sequenz sind
    if (this.shootingPattern === 'burst' && this.burstCount > 0) {
      // Bei Burst-Modus mehrere Schüsse hintereinander
      if (time > this.lastBurstTime + this.burstDelay) {
        this.lastBurstTime = time;
        this.burstCount--;
        
        this.fireBasicShot();
      }
      return;
    }
    
    // Normale Schusslogik für reguläre Zeitintervalle
    if (time > this.lastShootTime + this.fireRate) {
      this.lastShootTime = time;
      
      // Unterschiedliche Schussmuster
      switch (this.shootingPattern) {
        case 'single':
          // Standard Einzelschuss
          this.fireBasicShot();
          break;
          
        case 'double':
          // Doppelschuss mit leichter Verzögerung
          this.fireBasicShot();
          this.scene.time.delayedCall(150, () => {
            if (this.sprite && this.sprite.active) {
              this.fireBasicShot();
            }
          });
          break;
          
        case 'burst':
          // Burst von 3-5 schnellen Schüssen
          this.burstTotal = 3 + Math.floor(Math.random() * 3); // 3-5 Schüsse
          this.burstCount = this.burstTotal;
          this.burstDelay = 100 + Math.random() * 50; // 100-150ms zwischen Schüssen
          this.lastBurstTime = time;
          
          // Ersten Schuss sofort abfeuern
          this.fireBasicShot();
          this.burstCount--;
          break;
          
        case 'random':
          // Zufällig eines der anderen Muster wählen
          const randomPattern = Math.random();
          if (randomPattern < 0.33) {
            this.fireBasicShot();
          } else if (randomPattern < 0.66) {
            // Doppelschuss
            this.fireBasicShot();
            this.scene.time.delayedCall(150, () => {
              if (this.sprite && this.sprite.active) {
                this.fireBasicShot();
              }
            });
          } else {
            // Mini-Burst von 2-3 Schüssen
            const miniBurstCount = 2 + Math.floor(Math.random() * 2);
            this.fireBasicShot();
            
            for (let i = 1; i < miniBurstCount; i++) {
              this.scene.time.delayedCall(i * 120, () => {
                if (this.sprite && this.sprite.active) {
                  this.fireBasicShot();
                }
              });
            }
          }
          break;
      }
    }
  }
  
  /**
   * Fügt einen pulsierenden Effekt zum Feind hinzu
   */
  private addPulseEffect(): void {
    // Pulsierender Effekt mit zufälliger Intensität
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.8,
      duration: 700 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Leichtes Skalieren für "Atmen"-Effekt
    const scaleVariation = 0.1 + Math.random() * 0.1;
    const originalScaleX = this.sprite.scaleX;
    const originalScaleY = this.sprite.scaleY;
    
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: originalScaleX * (1 + scaleVariation),
      scaleY: originalScaleY * (1 - scaleVariation * 0.5),
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Feuert einen grundlegenden Schuss ab
   */
  private fireBasicShot(): void {
    // Hole die zentrale Bullet-Gruppe vom Registry
    const enemyManager = this.scene.registry.get('enemyManager') as any;
    if (!enemyManager) return;
    
    // Erstelle die Kugel aus dem zentralen Pool
    const bullet = enemyManager.getEnemyBulletGroup().get() as Phaser.Physics.Arcade.Sprite;
    
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      
      // Position links vom Gegner
      bullet.setPosition(this.sprite.x - 25, this.sprite.y);
      
      // Berechne die aktuelle Geschwindigkeit des Gegners
      const enemyVelocityX = this.sprite.body ? Math.abs(this.sprite.body.velocity.x) : 0;
      
      // Setze Geschwindigkeit - IMMER nur horizontal nach links
      // Die Geschwindigkeit ist jetzt 1.25x bis 1.5x schneller als die Basisgeschwindigkeit der Projektile
      // Zusätzlich addieren wir einen Teil der Geschwindigkeit des Gegners
      const bulletSpeed = Constants.ENEMY_BULLET_SPEED * (1.25 + Math.random() * 0.25) + Math.abs(enemyVelocityX) * 0.5;
      
      // Stelle sicher, dass die Projektile immer mindestens 1.5x schneller sind wie der Gegner
      const finalBulletSpeed = Math.max(bulletSpeed, enemyVelocityX * 1.5);
      
      // Setze die endgültige Geschwindigkeit
      bullet.setVelocity(-finalBulletSpeed, 0);
      
      // KEINE Kollision mit Weltgrenzen - wird über EnemyManager verwaltet
      bullet.setCollideWorldBounds(false);
      
      // Metadaten für Kollisionen
      bullet.setData('damage', Constants.DAMAGE.ENEMY_BULLET);
      bullet.setData('owner', 'enemy');
      
      // Keine Rotation, nur horizontale Ausrichtung
      bullet.setRotation(0);
      
      // Sprite zeigt immer nach links
      bullet.setFlipX(true);
      
      // Farbeffekte je nach Schussmuster
      if (this.shootingPattern === 'burst') {
        bullet.setTint(0xff8866); // Rötliche Projektile für Burst
        bullet.setScale(1.2);
      } else if (this.shootingPattern === 'double') {
        bullet.setTint(0x88aaff); // Bläuliche Projektile für Doppelschuss
        bullet.setScale(1.3);
      } else if (this.shootingPattern === 'random') {
        bullet.setTint(0xaaffaa); // Grünliche Projektile für Zufallsmuster
        bullet.setScale(1.1);
      } else {
        bullet.setScale(1.0);
      }
      
      // Bei der zentralen Verwaltung registrieren
      enemyManager.registerEnemyBullet(bullet);
      
      // Bei bestimmten Schussmustern zusätzliche Effekte hinzufügen
      if (this.shootingPattern === 'burst' || this.shootingPattern === 'double') {
        // Kurzes Aufleuchten
        const originalTint = this.sprite.tint;
        this.sprite.setTint(0xffffff);
        this.scene.time.delayedCall(50, () => {
          if (this.sprite && this.sprite.active) {
            this.sprite.setTint(originalTint);
          }
        });
      }
    }
    
    // Spiele Sound mit variabler Tonhöhe für größere Abwechslung
    const detune = Math.random() * 200 - 100;
    this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
      volume: 0.2,
      detune: detune
    });
  }

  /**
   * Wird aufgerufen, wenn der Feind mit einem anderen Objekt kollidiert
   */
  protected onCollision(other: GameObject): void {
    // Verursache Schaden am Spieler, wenn es eine Kollision gibt
    if (other instanceof Player) {
      other.takeDamage(20);
      this.takeDamage(this.health); // Zerstöre den Feind bei Kollision mit dem Spieler
    }
  }

  /**
   * Gibt die Bullets des Feindes zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    // Wir verwenden jetzt die zentrale Bullet-Gruppe
    const enemyManager = this.scene.registry.get('enemyManager') as any;
    if (enemyManager) {
      return enemyManager.getEnemyBulletGroup();
    }
    
    // Fallback: Gib die eigene Gruppe zurück
    return this.bullets;
  }

  /**
   * Aktualisiert den Feind
   */
  public update(time: number, delta: number): void {
    if (this.isDestroyed) return;
    
    // Rufe die Basisfunktionalität auf
    super.update(time, delta);
    
    // Verwalte Projektile zusätzlich zur Basisklassenfunktionalität
    if (this.bullets) {
      this.bullets.children.each((gameObject: Phaser.GameObjects.GameObject) => {
        const bullet = gameObject as Phaser.Physics.Arcade.Sprite;
        
        // Überprüfen, ob das Projektil korrekt bewegt wird
        if (bullet.active && bullet.body && bullet.body.velocity.x === 0 && bullet.body.velocity.y === 0) {
          // Wenn das Projektil stehengeblieben ist, setzen wir die Geschwindigkeit erneut
          bullet.setVelocity(-Constants.BULLET_SPEED, 0);
        }
        
        // Prüfe, ob das Projektil außerhalb des Bildschirms ist
        if (bullet.x < -50 || 
            bullet.x > this.scene.scale.width + 50 || 
            bullet.y < -50 || 
            bullet.y > this.scene.scale.height + 50) {
          // Zerstöre das Projektil
          bullet.setActive(false);
          bullet.setVisible(false);
          if (bullet.body) {
            bullet.body.enable = false;
          }
          bullet.destroy();
        }
        
        return true;
      });
    }
  }

  /**
   * Wird beim Zerstören des Feindes aufgerufen
   */
  protected onDestroy(): void {
    // Entferne Event-Listener
    this.eventBus.off(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);
    
    // Markiere als zerstört
    this.destroyed = true;
    
    // Füge eine Explosionsanimation hinzu
    if (this.scene) {
      // Hauptexplosion
      const explosion = this.scene.add.sprite(
        this.sprite.x,
        this.sprite.y,
        Constants.ASSET_EXPLOSION_1
      );
      
      // Größe basierend auf der Feindgröße
      const explosionScale = this.sprite.scaleX * 0.8;
      explosion.setScale(explosionScale);
      
      // Spiele die Explosionsanimation ab
      explosion.play('explode');
      
      // Nach der Animation zerstören
      explosion.on('animationcomplete', () => {
        explosion.destroy();
      });
      
      // Bei höheren Schwierigkeitsgraden zusätzliche kleinere Explosionen
      if (this.difficultyLevel >= 3) {
        const explosionCount = 1 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < explosionCount; i++) {
          // Verzögere die zusätzlichen Explosionen leicht
          this.scene.time.delayedCall(i * 100, () => {
            if (!this.scene) return;
            
            // Positionsabweichung
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            // Kleinere Sekundärexplosion
            const secondaryExplosion = this.scene.add.sprite(
              this.sprite.x + offsetX,
              this.sprite.y + offsetY,
              Constants.ASSET_EXPLOSION_1
            );
            
            secondaryExplosion.setScale(explosionScale * 0.5);
            secondaryExplosion.play('explode');
            
            // Nach der Animation zerstören
            secondaryExplosion.on('animationcomplete', () => {
              secondaryExplosion.destroy();
            });
          });
        }
      }
      
      // Explosionsgeräusch mit zufälliger Tonhöhe abspielen
      this.scene.sound.play(Constants.SOUND_EXPLOSION, {
        volume: 0.3,
        detune: Math.random() * 400 - 200
      });
    }
    
    // Rufe die Basis-Implementation auf
    super.onDestroy();
  }

  /**
   * Setzt die Schwierigkeit direkt für den Gegner
   * Wird beim Spawnen neuer Gegner mit dem aktuellen Schwierigkeitsgrad aufgerufen
   */
  public applyDifficulty(data: any): void {
    this.onDifficultyChanged(data);
  }

  /**
   * Wird aufgerufen, wenn der Feind Schaden nimmt
   */
  public takeDamage(amount: number): boolean {
    const result = super.takeDamage(amount);
    
    // Visuelle Effekte für Schadensereignis
    if (this.sprite && this.sprite.active) {
      // Kurzes Aufblinken rot/weiß
      this.sprite.setTint(0xffffff);
      
      // Ruckeln-Effekt
      this.scene.tweens.add({
        targets: this.sprite,
        x: this.sprite.x + (Math.random() - 0.5) * 10,
        y: this.sprite.y + (Math.random() - 0.5) * 10,
        duration: 50,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (this.sprite && this.sprite.active) {
            // Zurück zur originalen Farbe oder leicht rötlich bei niedrigem Leben
            const healthPercent = this.health / Constants.ENEMY_HEALTH;
            if (healthPercent < 0.5) {
              // Bei niedrigem Leben rötlicher färben
              const red = Math.min(255, Math.round(255 - (healthPercent * 200)));
              const other = Math.max(50, Math.round(healthPercent * 200));
              this.sprite.setTint(Phaser.Display.Color.GetColor(red, other, other));
            } else {
              // Ursprüngliche Farbe wiederherstellen
              this.sprite.clearTint();
            }
          }
        }
      });
      
      // Geschwindigkeit kurz reduzieren
      if (this.sprite.body) {
        const currentVelX = this.sprite.body.velocity.x;
        const currentVelY = this.sprite.body.velocity.y;
        
        // Verlangsamen als Reaktion auf den Treffer
        this.sprite.setVelocity(
          currentVelX * 0.5,
          currentVelY * 0.5
        );
      }
    }
    
    return result;
  }
} 