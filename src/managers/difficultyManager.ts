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

  constructor(scene: Phaser.Scene) {
    this.eventBus = EventBus.getInstance();
    this.scene = scene;
  }

  /**
   * Aktualisiert die Schwierigkeit
   */
  public update(time: number, delta: number = 0): void {
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
   * Erhöht die Schwierigkeit
   */
  private increaseDifficulty(): void {
    if (this.difficulty < this.MAX_DIFFICULTY) {
      this.difficulty++;
      console.log(`Difficulty increased to: ${this.difficulty}`);
      
      // Berechne den Schwierigkeitsfaktor, der exponentiell ansteigt
      // Formel: 1.0 + (level-1) * 0.1 + (level-1)^1.5 * 0.01
      this.difficultyFactor = 1.0 + 
        (this.difficulty - 1) * 0.1 + 
        Math.pow(this.difficulty - 1, 1.5) * 0.01;
      
      // Event auslösen für andere Komponenten mit Objekt-Parameter
      this.eventBus.emit(EventType.DIFFICULTY_CHANGED, {
        difficulty: this.difficulty,
        factor: this.difficultyFactor
      });
      
      // Zeige Level-Up-Nachricht an
      this.showLevelUpMessage();
    }
  }

  /**
   * Gibt die aktuelle Schwierigkeit zurück
   */
  public getDifficulty(): number {
    return this.difficulty;
  }

  /**
   * Zeigt eine Level-Up-Nachricht an
   */
  private showLevelUpMessage(): void {
    // Lösche vorhandenen Text, falls er noch existiert
    if (this.levelUpText) {
      this.levelUpText.destroy();
    }
    
    // Erstelle dramatische Level-Up-Nachricht
    this.levelUpText = this.scene.add.text(
      this.scene.scale.width / 2, 
      this.scene.scale.height / 2,
      `LEVEL ${this.difficulty}`,
      {
        fontSize: '64px',
        fontFamily: 'monospace',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000',
          blur: 5,
          stroke: true,
          fill: true
        }
      }
    ).setOrigin(0.5);
    
    // Setze die Tiefe, damit die Nachricht über allen Objekten liegt
    this.levelUpText.setDepth(1000);
    
    // Kurze Beschreibung der Änderungen
    let difficultyDescription = '';
    if (this.difficulty === 2) {
      difficultyDescription = 'Enemies are getting faster!';
    } else if (this.difficulty === 3) {
      difficultyDescription = 'Enemies are getting more aggressive!';
    } else if (this.difficulty === 4) {
      difficultyDescription = 'New movement patterns unlocked!';
    } else if (this.difficulty === 5) {
      difficultyDescription = 'Enemy AI improved!';
    } else if (this.difficulty % 5 === 0) {
      difficultyDescription = 'Boss wave!';
    } else if (this.difficulty > 5 && this.difficulty < 10) {
      difficultyDescription = 'Danger increases!';
    } else if (this.difficulty >= 10 && this.difficulty < 15) {
      difficultyDescription = 'Extreme difficulty!';
    } else if (this.difficulty >= 15) {
      difficultyDescription = 'Fight for survival!';
    }
    
    // Füge die Beschreibung hinzu, wenn vorhanden
    if (difficultyDescription) {
      const subText = this.scene.add.text(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2 + 70,
        difficultyDescription,
        {
          fontSize: '32px',
          fontFamily: 'monospace',
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 4
        }
      ).setOrigin(0.5);
      
      subText.setDepth(1000);
      
      // Animation für den Untertitel
      this.scene.tweens.add({
        targets: subText,
        alpha: 0,
        y: this.scene.scale.height / 2 + 120,
        duration: 1500,
        ease: 'Power2',
        delay: 1500,
        onComplete: () => subText.destroy()
      });
    }
    
    // Spiele Sound für Level-Up
    this.scene.sound.play(Constants.SOUND_EXPLOSION, {
      volume: 0.3,
      rate: 1.5
    });
    
    // Animation für den Text
    this.scene.tweens.add({
      targets: this.levelUpText,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        if (this.levelUpText) {
          this.levelUpText.destroy();
          this.levelUpText = null;
        }
      }
    });
    
    // Erzeuge einen Kamera-Shake für dramatischen Effekt
    this.scene.cameras.main.shake(500, 0.005);
  }
} 