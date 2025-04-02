import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType } from '../utils/eventBus';
import { MusicManager } from '../managers/musicManager';

/**
 * Pause-Szene
 */
export class PauseScene extends BaseScene {
  private musicManager: MusicManager;

  constructor() {
    super(Constants.SCENE_PAUSE);
    this.musicManager = MusicManager.getInstance();
  }

  /**
   * Erstellt die Pause-Szene
   */
  create(): void {
    // Halbdurchsichtiger schwarzer Hintergrund
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0, 0);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Initialisiere den MusicManager
    this.musicManager.init(this);

    // Pause-Text
    this.add.text(centerX, centerY - 100, 'Paused', {
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Fortsetzen-Button
    this.createButton(centerX, centerY, 'Resume', () => {
      this.eventBus.emit(EventType.RESUME_GAME);
      this.scene.stop();
    });

    // Hauptmenü-Button
    this.createButton(centerX, centerY + 60, 'Main Menu', () => {
      this.musicManager.stopCurrentMusic();
      this.scene.stop(Constants.SCENE_GAME);
      this.scene.start(Constants.SCENE_MAIN_MENU);
    });

    // ESC-Taste zum Fortsetzen
    this.input.keyboard.on('keydown-ESC', () => {
      this.eventBus.emit(EventType.RESUME_GAME);
      this.scene.stop();
    });
  }

  /**
   * Aktualisiert die Pause-Szene
   */
  update(time: number, delta: number): void {
    // Rufe die BaseScene-Update-Methode auf, um die Sterne zu aktualisieren
    super.update(time, delta);
  }
} 