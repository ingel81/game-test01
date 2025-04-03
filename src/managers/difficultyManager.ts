import { Constants } from '../utils/constants';
import { EventBus, EventType } from '../utils/eventBus';

/**
 * DifficultyManager-Klasse
 * Verwaltet die Schwierigkeit des Spiels
 */
export class DifficultyManager {
  private difficulty: number = 1;
  private timeElapsed: number = 0;
  private lastUpdateTime: number = 0;
  private difficultyIncreaseInterval: number = Constants.DIFFICULTY_INCREASE_INTERVAL;
  private readonly MAX_DIFFICULTY: number = Constants.MAX_DIFFICULTY;
  private eventBus: EventBus;
  private difficultyFactor: number = 1.0;
  private levelUpText: Phaser.GameObjects.Text | null = null;
  private scene: Phaser.Scene;
  private autoIncrease: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.eventBus = EventBus.getInstance();
    this.scene = scene;
  }

  /**
   * Aktiviert die automatische Schwierigkeitssteigerung über Zeit
   */
  public enableAutoIncrease(): void {
    this.autoIncrease = true;
  }

  /**
   * Deaktiviert die automatische Schwierigkeitssteigerung über Zeit
   */
  public disableAutoIncrease(): void {
    this.autoIncrease = false;
  }

  /**
   * Aktualisiert die Schwierigkeit
   */
  public update(time: number, delta: number = 0): void {
    if (!this.autoIncrease) return;
    
    // Sammle Zeiten zwischen Updates (in Millisekunden)
    this.timeElapsed += delta;
    
    // Prüfe, ob das Intervall für die Schwierigkeitssteigerung erreicht wurde
    if (this.timeElapsed >= this.difficultyIncreaseInterval) {
      this.increaseDifficulty();
      // Reduziere timeElapsed um das Intervall, anstatt es auf 0 zu setzen
      // So gehen keine überschüssigen Millisekunden verloren
      this.timeElapsed -= this.difficultyIncreaseInterval;
    }
  }

  /**
   * Setzt die Schwierigkeit direkt auf den angegebenen Wert
   */
  public setDifficulty(newDifficulty: number): void {
    if (newDifficulty < 1) {
      console.warn(`[DIFFICULTY_MANAGER] Ungültiger Schwierigkeitsgrad: ${newDifficulty}, setze auf 1`);
      newDifficulty = 1;
    }
    
    if (newDifficulty > this.MAX_DIFFICULTY) {
      console.warn(`[DIFFICULTY_MANAGER] Schwierigkeitsgrad ${newDifficulty} überschreitet Maximum von ${this.MAX_DIFFICULTY}, setze auf Maximum`);
      newDifficulty = this.MAX_DIFFICULTY;
    }
    
    const previousDifficulty = this.difficulty;
    this.difficulty = newDifficulty;
    console.log(`[DIFFICULTY_MANAGER] Schwierigkeitsgrad geändert von ${previousDifficulty} auf ${this.difficulty}`);
    
    // Berechne den Schwierigkeitsfaktor
    this.difficultyFactor = 1.0 + 
      (this.difficulty - 1) * 0.1 + 
      Math.pow(this.difficulty - 1, 1.5) * 0.01;
    
    // Event auslösen für andere Komponenten mit Objekt-Parameter
    this.eventBus.emit(EventType.DIFFICULTY_CHANGED, {
      difficulty: this.difficulty,
      factor: this.difficultyFactor
    });
    
    // Zeige Level-Up-Nachricht an, wenn die Schwierigkeit erhöht wurde
    if (newDifficulty > previousDifficulty) {
      this.showLevelUpMessage();
    }
  }

  /**
   * Erhöht die Schwierigkeit
   */
  private increaseDifficulty(): void {
    if (this.difficulty < this.MAX_DIFFICULTY) {
      this.setDifficulty(this.difficulty + 1);
    }
  }

  /**
   * Gibt die aktuelle Schwierigkeit zurück
   */
  public getDifficulty(): number {
    return this.difficulty;
  }

  /**
   * Gibt den Schwierigkeitsfaktor zurück
   */
  public getDifficultyFactor(): number {
    return this.difficultyFactor;
  }

  /**
   * Zeigt eine Level-Up-Nachricht an
   */
  private showLevelUpMessage(): void {
    // Entferne alte Nachricht, falls vorhanden
    if (this.levelUpText) {
      this.levelUpText.destroy();
      this.levelUpText = null;
    }
    
    // Erstelle dramatische Level-Up-Nachricht
    this.levelUpText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      `LEVEL ${this.difficulty}`,
      {
        fontSize: '64px',
        fontFamily: 'Arial',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        padding: {
          x: 20,
          y: 10
        }
      }
    );
    
    this.levelUpText.setOrigin(0.5);
    this.levelUpText.setDepth(1000); // Über allem anderen
    
    // Skalierungs-Animation
    this.scene.tweens.add({
      targets: this.levelUpText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });
    
    // Alpha-Animation
    this.scene.tweens.add({
      targets: this.levelUpText,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Nach Einblenden eine Weile anzeigen, dann ausblenden
        this.scene.time.delayedCall(1000, () => {
          if (this.levelUpText) {
            this.scene.tweens.add({
              targets: this.levelUpText,
              alpha: 0,
              y: this.levelUpText.y - 50,
              duration: 500,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                if (this.levelUpText) {
                  this.levelUpText.destroy();
                  this.levelUpText = null;
                }
              }
            });
          }
        });
      }
    });
  }
} 