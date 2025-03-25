import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType } from '../utils/eventBus';
import { SoundManager } from '../managers/soundManager';

/**
 * Hauptmenü-Szene
 */
export class MainMenuScene extends BaseScene {
  private soundManager!: SoundManager;

  constructor() {
    super(Constants.SCENE_MAIN_MENU);
  }

  /**
   * Lädt Assets für die Menü-Szene
   */
  preload(): void {
    super.preload();
    
    // Lade die Sound-Assets
    this.load.audio(Constants.SOUND_BACKGROUND, 'assets/music/01.mp3');
    
    // Lade das Titel-Logo
    this.load.image('logo', 'assets/logo/title.png');
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

    // Füge das Logo anstelle des Texttitels ein
    const logo = this.add.image(centerX, centerY - 120, 'logo');
    
    // Skaliere das Logo um weitere 25% kleiner
    // Wir verwenden ein responsives Scaling, um es auf verschiedenen Bildschirmgrößen gut aussehen zu lassen
    const maxWidth = this.scale.width * 0.3; // Reduziert von 0.4 auf 0.3 (25% kleiner)
    const scaleRatio = maxWidth / logo.width;
    logo.setScale(Math.min(scaleRatio, 0.375)); // Reduziert von 0.5 auf 0.375 (25% kleiner)
    
    // Füge einen leichten Glow-Effekt hinzu
    this.tweens.add({
      targets: logo,
      alpha: 0.9,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Start-Button - nach unten verschoben
    this.createButton(centerX, centerY + 150, 'Start Game', () => {
      this.soundManager.stopBackgroundMusic();
      this.scene.start(Constants.SCENE_GAME);
    });

    // Steuerungshinweise - nach unten verschoben
    const controls = [
      'Controls:',
      'Arrow Keys - Move',
      'Space - Shoot',
      'ESC - Pause'
    ];

    controls.forEach((text, index) => {
      this.add.text(centerX, centerY + 200 + index * 30, text, {
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
    });

    // Touch-Steuerungshinweise - nach unten verschoben
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
    
    // Versionsnummer am unteren Bildschirmrand
    this.add.text(this.scale.width - 20, this.scale.height - 20, 'Version 1.0', {
      fontSize: '16px',
      color: '#00ffff',
      fontFamily: 'monospace'
    }).setOrigin(1, 1);

    // Erstelle den SoundManager und starte die Hintergrundmusik
    this.soundManager = new SoundManager(this);
    this.soundManager.playBackgroundMusic();
  }

  /**
   * Aktualisiert die Menü-Szene
   */
  update(time: number, delta: number): void {
    // Rufe die BaseScene-Update-Methode auf, um die Sterne zu aktualisieren
    super.update(time, delta);
  }
} 