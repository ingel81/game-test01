import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType } from '../utils/eventBus';
import { MusicManager } from '../managers/musicManager';

/**
 * Hauptmenü-Szene
 */
export class MainMenuScene extends BaseScene {
  private musicManager: MusicManager;

  constructor() {
    super(Constants.SCENE_MAIN_MENU);
    this.musicManager = MusicManager.getInstance();
  }

  /**
   * Lädt Assets für die Menü-Szene
   */
  preload(): void {
    super.preload();
    
    // Lade die Musik-Assets
    this.load.audio('title', 'music/title.mp3');
    this.load.audio('00', 'music/00.mp3');
    this.load.audio('01', 'music/01.mp3');
    this.load.audio('02', 'music/02.mp3');
    
    // Lade das Titel-Logo
    this.load.image('logo', Constants.getAssetPath('logo/title4.png'));
  }

  /**
   * Erstellt die Menü-Szene
   */
  create(): void {
    super.create();

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Stelle sicher, dass der Cursor im Hauptmenü immer sichtbar ist
    document.body.style.cursor = 'default';

    // Initialisiere den MusicManager
    this.musicManager.init(this);
    this.musicManager.playMenuMusic();

    // Füge das Logo anstelle des Texttitels ein
    const logo = this.add.image(centerX, centerY - 120, 'logo');
    
    // Skaliere das Logo um weitere 25% kleiner
    const maxWidth = this.scale.width * 0.3;
    const scaleRatio = maxWidth / logo.width;
    logo.setScale(Math.min(scaleRatio, 0.375));
    
    // Füge einen leichten Glow-Effekt hinzu
    this.tweens.add({
      targets: logo,
      alpha: 0.5,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Start-Button
    this.createButton(centerX, centerY + 150, 'Start Game', () => {
      this.musicManager.stopCurrentMusic();
      this.scene.start(Constants.SCENE_GAME);
    });

    // Steuerungshinweise
    const controls = [
      'Controls:',
      'Arrow Keys / WASD - Move',
      'Space - Shoot',
      'ESC - Pause',
      'F9 - Toggle Debug Modes (Off/Light/Full)'
    ];

    controls.forEach((text, index) => {
      this.add.text(centerX, centerY + 200 + index * 30, text, {
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
    });

    // Touch-Steuerungshinweise
    if (this.sys.game.device.input.touch) {
      const touchControls = [
        'Touch Controls:',
        'Left Side - Move',
        'Right Side - Shoot'
      ];

      touchControls.forEach((text, index) => {
        this.add.text(centerX, centerY + 350 + index * 30, text, {
          fontSize: '20px',
          color: '#ffffff'
        }).setOrigin(0.5);
      });
    }
    
    // Versionsnummer
    this.add.text(this.scale.width - 20, this.scale.height - 20, 'Version 1.0', {
      fontSize: '16px',
      color: '#00ffff',
      fontFamily: 'monospace'
    }).setOrigin(1, 1);
  }

  /**
   * Aktualisiert die Menü-Szene
   */
  update(time: number, delta: number): void {
    super.update(time, delta);
  }
} 