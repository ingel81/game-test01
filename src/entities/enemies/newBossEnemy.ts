/**
 * BossEnemy-Klasse
 * Mächtiger Bossgegner mit mehreren Phasen und komplexen Angriffsmustern
 */

import { BaseEnemy, EnemyConfig } from './baseEnemy';
import { Player } from '../player/player';
import { Constants } from '../../utils/constants';
import { MovementPattern } from './components/movementComponent';
import { ShootingPattern } from './components/weaponComponent';
import { GameObject } from '../gameObject';
import { EventBus, EventType } from '../../utils/eventBus';

// Definiere die verschiedenen Bossphasen
type BossPhase = 'entry' | 'phase1' | 'phase2' | 'phase3' | 'rage' | 'retreat';

export class BossEnemy extends BaseEnemy {
  // Boss-spezifische Eigenschaften
  private currentPhase: BossPhase = 'entry';
  private phaseHealthThresholds: Record<BossPhase, number> = {
    entry: 1.0,       // 100%
    phase1: 0.8,      // 80%
    phase2: 0.5,      // 50%
    phase3: 0.25,     // 25%
    rage: 0.1,        // 10%
    retreat: 0        // 0% (nicht direkt erreichbar)
  };
  private phaseTimer: number = 0;
  private phaseDuration: number = 20000; // 20 Sekunden pro Phase
  private phasePatterns: Record<BossPhase, { movement: MovementPattern; shooting: ShootingPattern }> = {
    entry: { movement: 'linear', shooting: 'single' },
    phase1: { movement: 'sinusoidal', shooting: 'double' },
    phase2: { movement: 'circular', shooting: 'spread' },
    phase3: { movement: 'evasive', shooting: 'burst' },
    rage: { movement: 'tracking', shooting: 'random' },
    retreat: { movement: 'linear', shooting: 'single' }
  };
  private attackCooldown: number = 0;
  private attackInterval: number = 3000; // Anfängliches Intervall
  private rageMode: boolean = false;
  private shieldActive: boolean = false;
  private shieldSprite: Phaser.GameObjects.Sprite | null = null;
  private minions: BaseEnemy[] = [];
  private isInvulnerable: boolean = false;
  
  // Gesundheitsanzeige
  private healthBar: Phaser.GameObjects.Graphics;
  private healthBarWidth: number = 80;
  private healthBarHeight: number = 8;
  
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Konfiguriere den Boss-Gegner
    const config: EnemyConfig = {
      texture: Constants.ASSET_BOSS,
      health: 200, // Hohe Gesundheit
      speed: 80, // Langsamer als normale Gegner
      scoreValue: 1000, // Viele Punkte
      fireRate: 1200, // Anfangs langsamer Feuerrate
      
      // Bewegungseinstellungen
      movement: {
        pattern: 'linear', // Anfangspattern
        speed: 80,
        baseVelocityX: -50, // Langsamer als normale Gegner
        changePatternRandomly: false, // Muster werden durch Phasen gesteuert
      },
      
      // Waffeneinstellungen
      weapon: {
        pattern: 'single', // Anfangsmuster
        fireRate: 1200,
        changePatternRandomly: false, // Muster werden durch Phasen gesteuert
        spreadCount: 7, // Mehr Projektile bei Spread
        burstCount: 5, // Mehr Projektile bei Burst
        targetPlayer: true
      },
      
      // Visuelle Einstellungen
      visual: {
        //tint: 0xAA00FF, // Lila Färbung für den Boss
        scale: 0.5, // Deutlich größer
        hitEffectDuration: 200,
        glowEffect: false, // Mit Gloweffekt
        particleEffect: false // Mit Partikeleffekt
      }
    };
    
    super(scene, x, y, player, config);
    
    // Boss-spezifische Initialisierung
    this.initBoss();
    
    // Gesundheitsanzeige erstellen
    this.createHealthBar();
  }
  
  /**
   * Initialisiert den Boss
   */
  private initBoss(): void {
    // Setze den Sprite als Boss-Typ
    this.sprite.setData('type', 'boss');
    
    // Event-Listener für Boss-bezogene Events
    this.eventBus.emit(EventType.BOSS_SPAWNED, this);
    
    // Starte mit der Entry-Phase
    this.enterPhase('entry');
    
    // Erstelle den Schild
    this.createShield();
  }
  
  /**
   * Erstellt die Gesundheitsanzeige für den Boss
   */
  private createHealthBar(): void {
    // Erstelle ein Graphics-Objekt für die Gesundheitsanzeige
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(1000); // Stelle sicher, dass die Anzeige über anderen Objekten liegt
    
    // Zeichne die initiale Gesundheitsanzeige
    this.updateHealthBar();
  }
  
  /**
   * Aktualisiert die Gesundheitsanzeige basierend auf dem aktuellen Gesundheitszustand
   */
  private updateHealthBar(): void {
    if (!this.healthBar || this.isDestroyed) return;
    
    // Lösche die vorherige Anzeige
    this.healthBar.clear();
    
    // Berechne den prozentualen Gesundheitswert
    const healthPercent = this.health / this.maxHealth;
    const barWidth = this.healthBarWidth * healthPercent;
    
    // Position der Anzeige über dem Boss
    const barX = this.sprite.x - this.healthBarWidth / 2;
    const barY = this.sprite.y - this.sprite.height / 2 - 15;
    
    // Zeichne den Hintergrund (grauer Balken)
    this.healthBar.fillStyle(0x666666, 0.8);
    this.healthBar.fillRect(barX, barY, this.healthBarWidth, this.healthBarHeight);
    
    // Bestimme die Farbe basierend auf der Gesundheit
    let color;
    if (healthPercent > 0.6) {
      color = 0x00ff00; // Grün für hohe Gesundheit
    } else if (healthPercent > 0.3) {
      color = 0xffaa00; // Orange für mittlere Gesundheit
    } else {
      color = 0xff0000; // Rot für niedrige Gesundheit
    }
    
    // Zeichne den Vordergrund (farbiger Balken)
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(barX, barY, barWidth, this.healthBarHeight);
    
    // Füge einen Rahmen hinzu
    this.healthBar.lineStyle(1, 0xFFFFFF, 0.8);
    this.healthBar.strokeRect(barX, barY, this.healthBarWidth, this.healthBarHeight);
    
    // Füge Phasenmarkierungen hinzu
    for (const [phase, threshold] of Object.entries(this.phaseHealthThresholds)) {
      if (phase !== 'entry' && phase !== 'retreat') {
        const markerX = barX + this.healthBarWidth * threshold;
        this.healthBar.lineStyle(2, 0xFFFFFF, 0.6);
        this.healthBar.lineBetween(markerX, barY - 2, markerX, barY + this.healthBarHeight + 2);
      }
    }
  }
  
  /**
   * Erstellt einen visuellen Schild um den Boss
   */
  private createShield(): void {
    this.shieldSprite = this.scene.add.sprite(this.sprite.x, this.sprite.y, this.sprite.texture.key);
    this.shieldSprite.setScale(1.7);
    this.shieldSprite.setAlpha(0.4);
    this.shieldSprite.setTint(0x00FFFF);
    this.shieldSprite.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldSprite.setDepth(this.sprite.depth - 1);
    
    // Pulsieren-Animation
    this.scene.tweens.add({
      targets: this.shieldSprite,
      alpha: { from: 0.4, to: 0.2 },
      scaleX: { from: 1.7, to: 1.8 },
      scaleY: { from: 1.7, to: 1.8 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Schild anfangs nicht aktiv
    this.shieldSprite.setVisible(false);
    this.shieldActive = false;
  }
  
  /**
   * Wechselt zu einer neuen Phase
   */
  private enterPhase(phase: BossPhase): void {
    this.currentPhase = phase;
    this.phaseTimer = this.scene.time.now + this.phaseDuration;
    
    // Setze Bewegungs- und Schussmuster
    const patterns = this.phasePatterns[phase];
    this.movementComponent.setPattern(patterns.movement);
    this.weaponComponent.setPattern(patterns.shooting);
    
    // Phase-spezifische Anpassungen
    switch (phase) {
      case 'entry':
        // Eingangsphase: Bewegung auf den Bildschirm
        this.sprite.setData('invulnerable', true);
        this.isInvulnerable = true;
        
        // Nach 3 Sekunden zur Phase 1 wechseln
        this.scene.time.delayedCall(3000, () => {
          this.enterPhase('phase1');
        });
        break;
        
      case 'phase1':
        // Phase 1: Normaler Angriff
        this.sprite.setData('invulnerable', false);
        this.isInvulnerable = false;
        this.attackInterval = 3000;
        break;
        
      case 'phase2':
        // Phase 2: Schild aktivieren und Minions spawnen
        this.activateShield();
        this.spawnMinions(3);
        this.attackInterval = 2500;
        break;
        
      case 'phase3':
        // Phase 3: Schnellere Angriffe
        this.attackInterval = 2000;
        this.weaponComponent['fireRate'] = 800;
        break;
        
      case 'rage':
        // Rage-Phase: Sehr aggressive Angriffe
        this.rageMode = true;
        this.attackInterval = 1500;
        this.weaponComponent['fireRate'] = 500;
        
        // Visuelles Feedback
        this.visualComponent.setTint(0xFF0000);
        
        // Spawne mehr Minions
        this.spawnMinions(5);
        break;
        
      case 'retreat':
        // Rückzugsphase: Boss flieht
        this.sprite.setData('invulnerable', true);
        this.isInvulnerable = true;
        
        this.scene.tweens.add({
          targets: this.sprite,
          x: this.scene.scale.width + 100,
          duration: 3000,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            this.destroy();
          }
        });
        break;
    }
    
    // Visuelles Feedback beim Phasenwechsel
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      scaleX: 1.7,
      scaleY: 1.7,
      duration: 300,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
    
    // Sound beim Phasenwechsel
    this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
      volume: 0.5
    });
  }
  
  /**
   * Aktiviert den Schutzschild des Bosses
   */
  private activateShield(): void {
    this.shieldActive = true;
    if (this.shieldSprite) {
      this.shieldSprite.setVisible(true);
      this.shieldSprite.setAlpha(0.4);
      
      // Animation beim Aktivieren
      this.scene.tweens.add({
        targets: this.shieldSprite,
        alpha: { from: 0, to: 0.4 },
        scaleX: { from: 2.0, to: 1.7 },
        scaleY: { from: 2.0, to: 1.7 },
        duration: 500,
        ease: 'Bounce.easeOut'
      });
    }
  }
  
  /**
   * Deaktiviert den Schutzschild des Bosses
   */
  private deactivateShield(): void {
    this.shieldActive = false;
    if (this.shieldSprite) {
      // Animation beim Deaktivieren
      this.scene.tweens.add({
        targets: this.shieldSprite,
        alpha: 0,
        scaleX: 2.0,
        scaleY: 2.0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          if (this.shieldSprite) {
            this.shieldSprite.setVisible(false);
          }
        }
      });
    }
  }
  
  /**
   * Spawnt Begleitgegner
   */
  private spawnMinions(count: number): void {
    // Lösche alte Minions
    this.minions.forEach(minion => {
      if (!minion.isDestroyed) {
        minion.destroy();
      }
    });
    this.minions = [];
    
    // Erstelle neue Minions
    for (let i = 0; i < count; i++) {
      // Position rund um den Boss
      const angle = (i / count) * Math.PI * 2;
      const distance = 100;
      const x = this.sprite.x + Math.cos(angle) * distance;
      const y = this.sprite.y + Math.sin(angle) * distance;
      
      // Erzeuge einen StandardEnemy als Minion
      // Hier musst du die entsprechende Klasse importieren und verwenden
      // Für dieses Beispiel nutzen wir BaseEnemy direkt
      const config: EnemyConfig = {
        texture: Constants.ASSET_ENEMY,
        health: 50,
        speed: 120,
        scoreValue: 20,
        fireRate: 2000,
        movement: {
          pattern: 'circular',
          speed: 120,
          circleRadius: 80,
          circleSpeed: 0.02
        },
        weapon: {
          pattern: 'single',
          fireRate: 2000
        },
        visual: {
          tint: 0xAA00FF, // Gleiche Farbe wie Boss
          scale: 0.7
        }
      };
      
      const minion = new BaseEnemy(this.scene, x, y, this.player, config);
      this.minions.push(minion);
    }
  }
  
  /**
   * Überschriebene Update-Methode für Boss-Phasen
   */
  public update(time: number, delta: number): void {
    if (this.isDestroyed) return;
    
    // Debug: Position des Bosses loggen
    if (time % 5000 < 20) { // etwa alle 5 Sekunden
      console.log(`[BOSS] Position: (${this.sprite.x.toFixed(0)}, ${this.sprite.y.toFixed(0)}), Active: ${this.sprite.active}, Visible: ${this.sprite.visible}, Phase: ${this.currentPhase}`);
    }
    
    super.update(time, delta);
    
    // Wenn zerstört, nichts machen
    if (this.isDestroyed) return;
    
    // Aktualisiere die Gesundheitsanzeige
    this.updateHealthBar();
    
    // Schild aktualisieren
    if (this.shieldActive && this.shieldSprite) {
      this.shieldSprite.setPosition(this.sprite.x, this.sprite.y);
    }
    
    // Prüfe auf Phasenwechsel basierend auf Gesundheit
    const healthPercentage = this.getHealthPercentage();
    
    for (const [phase, threshold] of Object.entries(this.phaseHealthThresholds)) {
      if (this.currentPhase !== phase && 
          healthPercentage <= threshold && 
          healthPercentage > (this.phaseHealthThresholds[this.currentPhase] || 0)) {
        this.enterPhase(phase as BossPhase);
        break;
      }
    }
    
    // Boss-spezifische Angriffe basierend auf der aktuellen Phase
    if (time > this.attackCooldown && !this.isInvulnerable) {
      this.performPhaseAttack();
      this.attackCooldown = time + this.attackInterval;
    }
    
    // Aktualisiere Minions
    this.minions.forEach((minion, index) => {
      if (minion.isDestroyed) {
        this.minions.splice(index, 1);
      } else {
        minion.update(time, delta);
      }
    });
    
    // Wenn alle Minions in Phase 2 zerstört wurden, deaktiviere den Schild
    if (this.currentPhase === 'phase2' && this.minions.length === 0 && this.shieldActive) {
      this.deactivateShield();
    }
  }
  
  /**
   * Führt einen phasenabhängigen Spezialangriff aus
   */
  private performPhaseAttack(): void {
    switch (this.currentPhase) {
      case 'phase1':
        if (Math.random() < 0.3) {
          this.fire360Degrees(8); // 8 Projektile
        }
        break;
        
      case 'phase2':
        if (Math.random() < 0.4) {
          this.fireWave();
        }
        break;
        
      case 'phase3':
        if (Math.random() < 0.5) {
          this.fire360Degrees(12); // 12 Projektile
        }
        break;
        
      case 'rage':
        // In Rage-Modus häufiger spezielle Angriffe
        const attackType = Math.floor(Math.random() * 3);
        
        switch (attackType) {
          case 0:
            this.fire360Degrees(16); // 16 Projektile
            break;
          case 1:
            this.fireWave();
            break;
          case 2:
            // Beide Angriffe kombinieren
            this.fire360Degrees(12);
            this.scene.time.delayedCall(500, () => {
              if (!this.isDestroyed) {
                this.fireWave();
              }
            });
            break;
        }
        break;
    }
  }
  
  /**
   * Feuert Projektile in alle Richtungen
   */
  private fire360Degrees(bulletCount: number): void {
    const angleStep = 360 / bulletCount;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = i * angleStep;
      
      // Spawnposition für das Projektil
      const radians = Phaser.Math.DegToRad(angle);
      const x = this.sprite.x + Math.cos(radians) * 30;
      const y = this.sprite.y + Math.sin(radians) * 30;
      
      // Erstelle Projektil im zentralen Bullet-Pool
      const bullet = this.weaponComponent.getBullets().get(x, y) as Phaser.Physics.Arcade.Sprite;
      
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        
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
    
    // Visueller Effekt
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true
    });
  }
  
  /**
   * Feuert eine Welle von Projektilen
   */
  private fireWave(): void {
    const bulletCount = 12;
    const waveHeight = 200;
    const bulletSpeed = 150;
    
    for (let i = 0; i < bulletCount; i++) {
      const x = this.sprite.x;
      const yOffset = -waveHeight/2 + (waveHeight * i / (bulletCount - 1));
      const y = this.sprite.y + yOffset;
      
      // Erstelle Projektil im zentralen Bullet-Pool
      const bullet = this.weaponComponent.getBullets().get(x, y) as Phaser.Physics.Arcade.Sprite;
      
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        
        // Setze den Typ für Kollisionserkennung
        bullet.setData('type', 'enemyBullet');
        
        // Setze Geschwindigkeit (nach links)
        bullet.setVelocity(-bulletSpeed, 0);
        
        // Registriere das Projektil
        this.eventBus.emit('REGISTER_ENEMY_BULLET', bullet);
      }
    }
    
    // Sound-Effekt
    this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
      volume: 0.3
    });
  }
  
  /**
   * Überschriebene takeDamage-Methode für Boss-spezifisches Verhalten
   */
  public takeDamage(amount: number): boolean {
    // Wenn der Boss unverwundbar ist oder der Schild aktiv ist und Minions existieren
    if (this.isInvulnerable || (this.shieldActive && this.minions.length > 0)) {
      // Visuelles Feedback, aber kein Schaden
      if (this.shieldSprite) {
        this.scene.tweens.add({
          targets: this.shieldSprite,
          alpha: 0.7,
          duration: 100,
          yoyo: true
        });
      }
      
      return false;
    }
    
    // Normaler Schadensverlauf
    const wasDestroyed = super.takeDamage(amount);
    
    // Aktualisiere die Gesundheitsanzeige
    this.updateHealthBar();
    
    // Wenn der Boss zerstört wird, setze spezielle Ereignisse in Gang
    if (wasDestroyed) {
      this.onBossDestroyed();
    }
    
    return wasDestroyed;
  }
  
  /**
   * Wird aufgerufen, wenn der Boss zerstört wird
   */
  private onBossDestroyed(): void {
    console.log(`[BOSS] Boss wird zerstört mit ${this.health} HP`);
    
    // Event auslösen, dass der Boss zerstört wurde
    this.eventBus.emit('BOSS_DESTROYED', this);
    
    // Großen Explosionseffekt erstellen
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        const explosion = this.scene.add.sprite(
          this.sprite.x + Phaser.Math.Between(-50, 50),
          this.sprite.y + Phaser.Math.Between(-50, 50),
          Constants.ASSET_EXPLOSION_1
        );
        explosion.setScale(1.5);
        explosion.play('explode');
        
        // Sound für jede Explosion
        this.scene.sound.play(Constants.SOUND_EXPLOSION, {
          volume: 0.3,
          detune: Phaser.Math.Between(-200, 200)
        });
      });
    }
    
    // Zerstöre alle Minions
    this.minions.forEach(minion => {
      if (!minion.isDestroyed) {
        minion.takeDamage(minion.getHealth());
      }
    });
    
    // Entferne Schild
    if (this.shieldSprite) {
      this.shieldSprite.destroy();
      this.shieldSprite = null;
    }
    
    // Benachrichtige das Spiel über den Boss-Tod
    this.eventBus.emit(EventType.BOSS_DESTROYED, {
      boss: this,
      score: this.scoreValue
    });
  }
  
  /**
   * Überschriebene destroy-Methode
   */
  public destroy(): void {
    // Entferne die Gesundheitsanzeige
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.destroy();
    }
    
    // Zerstöre Minions
    this.minions.forEach(minion => {
      if (!minion.isDestroyed) {
        minion.destroy();
      }
    });
    this.minions = [];
    
    // Zerstöre Schild
    if (this.shieldSprite) {
      this.shieldSprite.destroy();
      this.shieldSprite = null;
    }
    
    // Rufe Basisklassen-Destroy auf
    super.destroy();
  }
  
  /**
   * Überschriebene onCollision-Methode für Boss-spezifisches Verhalten
   */
  protected onCollision(other: GameObject): void {
    if (other instanceof Player) {
      // Verursache schweren Schaden bei Kollision
      other.takeDamage(50);
      
      // Boss erhält keinen Schaden durch Kollision
    }
  }
  
  /**
   * Gibt den prozentualen Gesundheitswert zurück
   */
  public getHealthPercentage(): number {
    return this.health / this.maxHealth;
  }
} 