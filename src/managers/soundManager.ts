import { Constants } from '../utils/constants';

/**
 * SoundManager-Klasse
 * Verwaltet Sounds und Musik im Spiel
 */
export class SoundManager {
  private scene: Phaser.Scene;
  private backgroundMusic: Phaser.Sound.BaseSound | null = null;
  private muted: boolean = false;
  private volume: number = 1.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Startet die Hintergrundmusik
   */
  public playBackgroundMusic(): void {
    // DEBUG: Wenn Sound deaktiviert ist, führe keine Sound-Aktionen aus
    if (Constants.DEBUG_DISABLE_SOUNDS) {
      return;
    }
    
    try {
      console.log('Versuche Hintergrundmusik zu laden...');
      this.backgroundMusic = this.scene.sound.add(Constants.SOUND_BACKGROUND, {
        volume: 0.5 * this.volume,
        loop: true,
        delay: 0
      });
      
      console.log('Starte Musik...');
      this.backgroundMusic.play();
    } catch (error) {
      console.error('Fehler beim Laden der Hintergrundmusik:', error);
    }
  }

  /**
   * Stoppt die Hintergrundmusik
   */
  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
  }

  /**
   * Pausiert die Hintergrundmusik
   */
  public pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  /**
   * Setzt die Hintergrundmusik fort
   */
  public resumeBackgroundMusic(): void {
    if (this.backgroundMusic && this.backgroundMusic.isPaused) {
      this.backgroundMusic.resume();
    }
  }

  /**
   * Spielt einen Sound
   */
  public playSound(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
    // DEBUG: Wenn Sound deaktiviert ist, führe keine Sound-Aktionen aus
    if (Constants.DEBUG_DISABLE_SOUNDS) {
      return;
    }
    
    if (this.muted) return;
    
    try {
      // Überprüfe, ob der Sound existiert
      if (!this.scene.sound.get(key)) {
        console.warn(`Sound "${key}" nicht gefunden. Überspringe Wiedergabe.`);
        return;
      }
      
      const finalConfig = {
        ...config,
        volume: (config.volume || 1.0) * this.volume
      };
      
      this.scene.sound.play(key, finalConfig);
    } catch (error) {
      console.error(`Fehler beim Abspielen des Sounds "${key}":`, error);
      // Führe das Spiel trotz Sound-Fehler fort
    }
  }

  /**
   * Setzt die Lautstärke
   */
  public setVolume(volume: number): void {
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
    
    if (this.backgroundMusic) {
      // Ändere die Lautstärke, wenn die Musik bereits wiedergegeben wird
      if ('setVolume' in this.backgroundMusic) {
        (this.backgroundMusic as any).setVolume(0.5 * this.volume);
      } else {
        // Stoppe und starte die Musik mit der neuen Lautstärke neu
        this.backgroundMusic.stop();
        this.backgroundMusic = this.scene.sound.add(Constants.SOUND_BACKGROUND, {
          volume: 0.5 * this.volume,
          loop: true
        });
        this.backgroundMusic.play();
      }
    }
  }

  /**
   * Schaltet den Sound stumm oder aktiviert ihn wieder
   */
  public toggleMute(): boolean {
    this.muted = !this.muted;
    
    if (this.muted) {
      this.scene.sound.pauseAll();
    } else {
      this.scene.sound.resumeAll();
    }
    
    return this.muted;
  }

  /**
   * Zerstört den Sound-Manager
   */
  public destroy(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic.destroy();
    }
  }
} 