import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType } from '../utils/eventBus';
import { SoundManager } from '../managers/soundManager';

/**
 * Game Over-Szene
 */
export class GameOverScene extends BaseScene {
  private score: number = 0;
  private soundManager!: SoundManager;

  constructor() {
    super(Constants.SCENE_GAME_OVER);
  }

  /**
   * Initialisiert die Szene
   */
  init(data: { score: number }): void {
    this.score = data.score;
  }

  /**
   * Erstellt die Game Over-Szene
   */
  create(): void {
    super.create();

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Stelle sicher, dass keine Musik läuft
    this.soundManager = new SoundManager(this);

    // Game Over-Text
    this.add.text(centerX, centerY - 100, 'Game Over', {
      fontSize: '64px',
      color: '#ff0000'
    }).setOrigin(0.5);

    // Punktestand
    this.add.text(centerX, centerY, `Score: ${this.score}`, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Neustart-Button
    this.createButton(centerX, centerY + 100, 'Restart', () => {
      this.scene.start(Constants.SCENE_GAME);
    });

    // Hauptmenü-Button
    this.createButton(centerX, centerY + 160, 'Main Menu', () => {
      this.scene.start(Constants.SCENE_MAIN_MENU);
    });
  }

  /**
   * Aktualisiert die Game Over-Szene
   */
  update(time: number, delta: number): void {
    // Rufe die BaseScene-Update-Methode auf, um die Sterne zu aktualisieren
    super.update(time, delta);
  }
} 