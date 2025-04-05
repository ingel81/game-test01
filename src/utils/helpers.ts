import { Constants } from './constants';
import { AssetManager, AssetKey } from './assetManager';

/**
 * Utility-Klasse für allgemeine Hilfsfunktionen
 */
export class Helpers {
  /**
   * Erstellt eine Explosion an den angegebenen Koordinaten
   * @param scene Die aktuelle Szene
   * @param spriteOrX Das zerstörte Sprite oder die X-Koordinate
   * @param yOrCallback Die Y-Koordinate oder ein Callback nach Abschluss
   * @param scaleOrCallback Optional: Die Skalierung oder ein Callback nach Abschluss
   * @param callback Optional: Callback nach Abschluss der Animation
   */
  public static createExplosion(
    scene: Phaser.Scene, 
    spriteOrX: Phaser.GameObjects.Sprite | number, 
    yOrCallback?: number | (() => void),
    scaleOrCallback?: number | (() => void),
    callback?: () => void
  ): void {
    try {
      let x: number;
      let y: number;
      let scale: number = 1.0;
      let completionCallback: (() => void) | undefined;
      
      // Prüfe, ob es sich um Sprite oder Koordinaten handelt
      if (typeof spriteOrX === 'number') {
        // Fall 1: (scene, x, y, scale?, callback?)
        x = spriteOrX;
        y = yOrCallback as number;
        
        if (typeof scaleOrCallback === 'number') {
          scale = scaleOrCallback;
          completionCallback = callback;
        } else if (typeof scaleOrCallback === 'function') {
          completionCallback = scaleOrCallback;
        }
      } else {
        // Fall 2: (scene, sprite, callback?)
        x = spriteOrX.x || 0;
        y = spriteOrX.y || 0;
        scale = spriteOrX.displayWidth > 50 ? 2 : 1;
        
        completionCallback = typeof yOrCallback === 'function' ? yOrCallback : undefined;
      }
      
      // Verwende den AssetManager, um den Explosions-Asset-Key zu erhalten
      const assetManager = AssetManager.getInstance();
      const explosionKey = assetManager.getKey(AssetKey.EXPLOSION1);
      
      // Erstelle die Explosion
      const explosion = scene.add.sprite(x, y, explosionKey);
      
      // Skaliere die Explosion
      explosion.setScale(scale);
      
      // Füge einen Sound-Effekt hinzu
      scene.sound.play(assetManager.getKey(AssetKey.SOUND_EXPLOSION), { volume: 0.4 });
      
      // Spiele die Explosions-Animation ab oder simuliere sie, wenn keine Animation vorhanden
      if (scene.anims.exists('explode')) {
        explosion.play('explode').on('animationcomplete', () => {
          // Entferne die Explosion nach Abschluss der Animation
          explosion.destroy();
          
          // Rufe den Callback auf, falls vorhanden
          if (completionCallback) {
            completionCallback();
          }
        });
      } else {
        // Keine Animation vorhanden, simuliere mit Tween
        scene.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: scale * 1.5,
          duration: 300,
          onComplete: () => {
            explosion.destroy();
            
            // Rufe den Callback auf, falls vorhanden
            if (completionCallback) {
              completionCallback();
            }
          }
        });
      }
    } catch (error) {
      console.error('[UTILS] Fehler beim Erstellen der Explosion:', error);
      
      // Rufe den Callback auch im Fehlerfall auf, wenn möglich
      if (typeof yOrCallback === 'function') {
        yOrCallback();
      } else if (typeof scaleOrCallback === 'function') {
        scaleOrCallback();
      } else if (callback) {
        callback();
      }
    }
  }
} 