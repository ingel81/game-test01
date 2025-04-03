import { Constants } from './constants';

/**
 * Utility-Klasse für allgemeine Hilfsfunktionen
 */
export class Helpers {
  /**
   * Erstellt eine Explosion an der angegebenen Position
   * 
   * @param scene Die aktuelle Szene
   * @param x X-Position der Explosion
   * @param y Y-Position der Explosion
   * @param scale Skalierungsfaktor der Explosion (Standard: 1.0)
   * @param options Zusätzliche Optionen für die Explosion
   */
  public static createExplosion(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    scale: number = 1.0,
    options: {
      offsetX?: number,
      offsetY?: number,
      volume?: number,
      detune?: number
    } = {}
  ): void {
    try {
      // Prüfen, ob die Animation existiert
      if (!scene || !scene.anims || !scene.anims.exists('explode')) {
        console.warn('[HELPER] Explosions-Animation nicht gefunden. Explosion wird übersprungen.');
        return;
      }

      // Füge zufällige Verschiebung hinzu, falls angegeben
      const finalX = x + (options.offsetX || 0);
      const finalY = y + (options.offsetY || 0);
      
      // Erstelle die Explosion
      const explosion = scene.add.sprite(finalX, finalY, Constants.ASSET_EXPLOSION_1);
      explosion.setScale(scale);
      explosion.play('explode');
      
      // Wichtig: Entferne die Explosion, nachdem die Animation abgespielt wurde
      explosion.once('animationcomplete', () => {
        explosion.destroy();
      });
      
      // Spiele den Sound ab
      scene.sound.play(Constants.SOUND_EXPLOSION, {
        volume: options.volume !== undefined ? options.volume : 0.3,
        detune: options.detune !== undefined ? options.detune : 0
      });
    } catch (error) {
      console.error('[HELPER] Fehler beim Erstellen der Explosion:', error);
    }
  }
} 