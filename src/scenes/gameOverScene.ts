import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType, EventBus } from '../utils/eventBus';
import { MusicManager } from '../managers/musicManager';

/**
 * Game Over-Szene
 */
export class GameOverScene extends BaseScene {
  private score: number = 0;
  private musicManager: MusicManager;

  constructor() {
    super(Constants.SCENE_GAME_OVER);
    this.musicManager = MusicManager.getInstance();
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

    // Initialisiere den MusicManager
    this.musicManager.init(this);

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
      // Vollständiger Reset vor dem Neustart
      // Zurücksetzen des EventBus
      EventBus.resetInstance();
      
      // Stoppe alle Sounds
      this.sound.stopAll();
      
      // Stoppe alle aktiven Szenen
      this.scene.stop(Constants.SCENE_GAME_OVER);
      
      // Kleine Pause für Ressourcenfreigabe
      setTimeout(() => {
        // Starte die Spielszene neu
        this.scene.start(Constants.SCENE_GAME);
      }, 50);
    });

    // Hauptmenü-Button
    this.createButton(centerX, centerY + 160, 'Main Menu', () => {
      // Zurücksetzen des EventBus
      EventBus.resetInstance();
      
      // Stoppe alle Sounds
      this.sound.stopAll();
      
      // Starte direkt das Hauptmenü
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