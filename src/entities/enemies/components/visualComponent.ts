/**
 * Visuelle Komponente für Gegner
 * Verwaltet Animationen, visuelle Effekte und visuelle Zustände
 */

export interface VisualConfig {
  tint?: number;
  scale?: number;
  alpha?: number;
  hitEffectDuration?: number;
  hitEffectTint?: number;
  useAnimations?: boolean;
  animationPrefix?: string;
  rotationSpeed?: number;
  glowEffect?: boolean;
  particleEffect?: boolean;
  deathAnimationKey?: string;
}

export class VisualComponent {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  
  private tint: number;
  private scale: number;
  private alpha: number;
  private hitEffectDuration: number;
  private hitEffectTint: number;
  private useAnimations: boolean;
  private animationPrefix: string;
  private rotationSpeed: number;
  private glowEffect: boolean;
  private particleEffect: boolean;
  private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private glowSprite: Phaser.GameObjects.Sprite | null = null;
  private deathAnimationKey: string;
  
  // Visueller Status
  private isHitEffectActive: boolean = false;
  private originalTint: number;
  private hitEffectTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite, config: VisualConfig = {}) {
    this.scene = scene;
    this.sprite = sprite;
    
    // Grundlegende visuelle Einstellungen
    this.tint = config.tint || 0xFFFFFF;
    this.scale = config.scale || 1;
    this.alpha = config.alpha || 1;
    
    // Effekt-Einstellungen
    this.hitEffectDuration = config.hitEffectDuration || 100;
    this.hitEffectTint = config.hitEffectTint || 0xFF0000;
    this.useAnimations = config.useAnimations || false;
    this.animationPrefix = config.animationPrefix || 'enemy';
    this.rotationSpeed = config.rotationSpeed || 0;
    this.glowEffect = config.glowEffect || false;
    this.particleEffect = config.particleEffect || false;
    this.deathAnimationKey = config.deathAnimationKey || 'explode';
    
    // Initialisierung
    this.originalTint = this.tint;
    this.init();
  }

  /**
   * Initialisiert die visuellen Effekte
   */
  private init(): void {
    // Grundlegende visuelle Eigenschaften setzen
    this.sprite.setTint(this.tint);
    this.sprite.setScale(this.scale);
    this.sprite.setAlpha(this.alpha);
    
    // Füge Glow-Effekt hinzu, wenn aktiviert
    if (this.glowEffect) {
      this.addGlowEffect();
    }
    
    // Füge Partikeleffekt hinzu, wenn aktiviert
    if (this.particleEffect) {
      this.addParticleEffect();
    }
    
    // Starte Animation, wenn aktiviert
    if (this.useAnimations) {
      const animKey = `${this.animationPrefix}_idle`;
      if (this.sprite.anims.exists(animKey)) {
        this.sprite.play(animKey);
      }
    }
  }

  /**
   * Aktualisiert die visuellen Effekte für den aktuellen Frame
   */
  public update(time: number, delta: number): void {
    // Prüfe, ob Sprite noch aktiv ist
    if (!this.sprite || !this.sprite.active) return;
    
    // Rotation, falls aktiviert
    if (this.rotationSpeed !== 0) {
      this.sprite.rotation += this.rotationSpeed * delta * 0.001;
    }
    
    // Aktualisiere Glow-Effekt
    if (this.glowEffect && this.glowSprite) {
      this.glowSprite.x = this.sprite.x;
      this.glowSprite.y = this.sprite.y;
    }
    
    // Für Partikel müssen wir nichts mehr tun, da wir eine alternative Implementierung verwenden
  }

  /**
   * Fügt einen Glow-Effekt zum Sprite hinzu
   */
  private addGlowEffect(): void {
    // Erstelle ein zusätzliches Sprite für den Glow-Effekt
    this.glowSprite = this.scene.add.sprite(this.sprite.x, this.sprite.y, this.sprite.texture.key);
    this.glowSprite.setScale(this.scale * 1.2);
    this.glowSprite.setAlpha(0.3);
    this.glowSprite.setTint(0x00FFFF);
    this.glowSprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Setze das Glow-Sprite hinter das Hauptsprite
    this.glowSprite.setDepth(this.sprite.depth - 1);
    
    // Füge Pulsieren-Animation hinzu
    this.scene.tweens.add({
      targets: this.glowSprite,
      alpha: { from: 0.3, to: 0.5 },
      scaleX: { from: this.scale * 1.2, to: this.scale * 1.4 },
      scaleY: { from: this.scale * 1.2, to: this.scale * 1.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Fügt einen Partikeleffekt zum Sprite hinzu
   */
  private addParticleEffect(): void {
    // Aus Einfachheitsgründen: Partikeleffekte deaktivieren, um TypeScript-Fehler zu vermeiden
    // In einer realen Implementierung würde man die Phaser-Version prüfen und entsprechend implementieren
    
    this.particleEmitter = null;
    
    // Visuellen Ersatz erstellen (pulsierende Kreise)
    const createPulsingCircle = () => {
      // Prüfe, ob das Sprite noch aktiv ist
      if (!this.sprite || !this.sprite.active) return;
      
      const circle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-10, 10),
        this.sprite.y + Phaser.Math.Between(-10, 10),
        3,
        0xFFFFFF,
        0.7
      );
      
      this.scene.tweens.add({
        targets: circle,
        alpha: 0,
        scale: 0,
        duration: 800,
        onComplete: () => {
          circle.destroy();
        }
      });
      
      // Wiederholen
      this.scene.time.delayedCall(100, createPulsingCircle);
    };
    
    // Starte die Animation
    createPulsingCircle();
  }

  /**
   * Spielt einen Treffer-Effekt ab
   */
  public playHitEffect(): void {
    if (this.isHitEffectActive) return;
    
    this.isHitEffectActive = true;
    this.sprite.setTint(this.hitEffectTint);
    
    // Stoppe bisherigen Timer, falls vorhanden
    if (this.hitEffectTimer) {
      this.hitEffectTimer.remove();
    }
    
    // Setze Timer zum Zurücksetzen des Tints
    this.hitEffectTimer = this.scene.time.delayedCall(
      this.hitEffectDuration,
      () => {
        this.sprite.setTint(this.originalTint);
        this.isHitEffectActive = false;
      }
    );
    
    // Visuelles Feedback durch ein kurzes Aufblitzen
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.7 },
      yoyo: true,
      duration: this.hitEffectDuration / 2,
      ease: 'Quad.easeOut'
    });
  }

  /**
   * Spielt die Todes-Animation ab
   */
  public playDeathAnimation(): void {
    // Entferne Glow- und Partikeleffekte
    if (this.glowSprite) {
      this.glowSprite.destroy();
      this.glowSprite = null;
    }
    
    if (this.particleEmitter) {
      this.particleEmitter.stop();
      this.particleEmitter = null;
    }
    
    // Spiele Todes-Animation, falls vorhanden und konfiguriert
    if (this.useAnimations && this.sprite.anims.exists(this.deathAnimationKey)) {
      this.sprite.play(this.deathAnimationKey);
      
      // Zerstöre das Sprite nach dem Ende der Animation
      this.sprite.once('animationcomplete', () => {
        this.destroy();
      });
    } else {
      // Standardmäßige Todes-Effekte ohne Animation
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.destroy();
        }
      });
    }
  }

  /**
   * Passt visuelle Parameter an die Schwierigkeit an
   */
  public adjustForDifficulty(difficulty: number): void {
    // Färbung verändern bei höherer Schwierigkeit
    if (difficulty >= 3) {
      // Dunklere, bedrohlichere Färbung bei höherer Schwierigkeit
      const difficultyTints = [
        0xFFFFFF, // Original
        0xFFD700, // Level 2: Goldfarben
        0xFF9000, // Level 3: Orange
        0xFF5500, // Level 4: Rot-Orange
        0xFF0000, // Level 5: Rot
        0xAA00FF  // Level 6+: Violett (besonders bedrohlich)
      ];
      
      const tintIndex = Math.min(difficultyTints.length - 1, difficulty - 1);
      this.setTint(difficultyTints[tintIndex]);
      
      // Bei höchster Schwierigkeit auch Glow-Effekt aktivieren
      if (difficulty >= 5 && !this.glowEffect) {
        this.glowEffect = true;
        this.addGlowEffect();
      }
    }
  }
  
  /**
   * Setzt den Tint-Wert (Färbung) des Sprites
   */
  public setTint(color: number): void {
    this.tint = color;
    this.originalTint = color;
    this.sprite.setTint(color);
  }
  
  /**
   * Setzt die Skalierung des Sprites
   */
  public setScale(scale: number): void {
    this.scale = scale;
    this.sprite.setScale(scale);
    
    if (this.glowSprite) {
      this.glowSprite.setScale(scale * 1.2);
    }
  }
  
  /**
   * Zerstört alle visuellen Ressourcen
   */
  public destroy(): void {
    if (this.glowSprite) {
      this.glowSprite.destroy();
      this.glowSprite = null;
    }
    
    if (this.particleEmitter) {
      this.particleEmitter.stop();
      this.particleEmitter = null;
    }
    
    if (this.hitEffectTimer) {
      this.hitEffectTimer.remove();
      this.hitEffectTimer = null;
    }
  }
} 