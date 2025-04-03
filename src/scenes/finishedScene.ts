import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType, EventBus } from '../utils/eventBus';
import { MusicManager } from '../managers/musicManager';

/**
 * Spiel-Abschluss-Szene
 */
export class FinishedScene extends BaseScene {
  private score: number = 0;
  private musicManager: MusicManager;

  constructor() {
    super(Constants.SCENE_FINISHED);
    this.musicManager = MusicManager.getInstance();
  }

  /**
   * Initialisiert die Szene
   */
  init(data: { score: number }): void {
    this.score = data.score;
  }

  /**
   * Erstellt die Finished-Szene
   */
  create(): void {
    super.create();

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Initialisiere den MusicManager
    this.musicManager.init(this);
    
    // Stelle sicher, dass der Cursor sichtbar ist
    document.body.style.cursor = 'default';

    // Erfolgs-Text
    this.add.text(centerX, centerY - 100, 'Spiel abgeschlossen!', {
      fontSize: '64px',
      color: '#00ff00'
    }).setOrigin(0.5);

    // Punktestand
    this.add.text(centerX, centerY, `Dein Score: ${this.score}`, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Gratulations-Text
    this.add.text(centerX, centerY + 50, 'Herzlichen Glückwunsch!', {
      fontSize: '28px',
      color: '#ffff00'
    }).setOrigin(0.5);

    // Neustart-Button
    this.createButton(centerX, centerY + 120, 'Erneut spielen', () => {
      // Vollständiger Reset vor dem Neustart
      // Zurücksetzen des EventBus
      EventBus.resetInstance();
      
      // Stoppe alle Sounds
      this.sound.stopAll();
      
      // Stoppe alle aktiven Szenen
      this.scene.stop(Constants.SCENE_FINISHED);
      
      // Kleine Pause für Ressourcenfreigabe
      setTimeout(() => {
        // Starte die Spielszene neu
        this.scene.start(Constants.SCENE_GAME);
      }, 50);
    });

    // Hauptmenü-Button
    this.createButton(centerX, centerY + 180, 'Hauptmenü', () => {
      // Zurücksetzen des EventBus
      EventBus.resetInstance();
      
      // Stoppe alle Sounds
      this.sound.stopAll();
      
      // Starte direkt das Hauptmenü
      this.scene.start(Constants.SCENE_MAIN_MENU);
    });
  }

  /**
   * Aktualisiert die Finished-Szene
   */
  update(time: number, delta: number): void {
    // Rufe die BaseScene-Update-Methode auf, um die Sterne zu aktualisieren
    super.update(time, delta);
  }
} 