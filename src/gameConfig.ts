import { GameScene } from './scenes/gameScene';
import { GameOverScene } from './scenes/gameOverScene';
import { MainMenuScene as MenuScene } from './scenes/mainMenuScene';

// Da LoadingScene nicht gefunden wurde, benutzen wir die verfügbaren Szenen
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [MenuScene, GameScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      // Optimierte Physik-Einstellungen für genauere Kollisionen
      debug: false,
      fps: 60, // Konstante Physik-Rate für Stabilität
      timeScale: 1, // Normale Zeitskala
      // maxSubSteps entfernt, da nicht in ArcadeWorldConfig
      useTree: true // Optimierte Breite-zuerst-Baum-Kollisionsprüfung
    }
  },
  render: {
    // Rendering-Optimierungen
    antialias: false, // Pixelart-Rendering bevorzugen
    pixelArt: true,   // Pixelart-Modus aktivieren
    roundPixels: true, // Für scharfe Pixel-Grenzen
    
    // Batchgröße für effizientes Rendering optimieren
    batchSize: 2048,
    
    // Transparenzeinstellungen
    clearBeforeRender: true,
    premultipliedAlpha: false,
    
    // V-Sync aktivieren
    powerPreference: 'high-performance',
  },
  // Verbesserte Eingabeeinstellungen
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false,
    smoothFactor: 0, // Keine Eingabeglättung für sofortige Reaktion
  },
  // Bildschirmeinstellungen
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'game-container',
  },
  // Richtlinie für Auto-Pause bei Fokusverlust ändern
  autoFocus: true,
  disableContextMenu: true,
};

export default gameConfig; 