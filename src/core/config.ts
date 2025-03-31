import { Constants } from '../utils/constants';
import { GameScene } from '../scenes/gameScene';
import { MainMenuScene } from '../scenes/mainMenuScene';
import { GameOverScene } from '../scenes/gameOverScene';
import { PauseScene } from '../scenes/pauseScene';

/**
 * Spielkonfiguration
 * Enthält die Phaser-Konfiguration für das Spiel
 */
export class GameConfig {
  /**
   * Gibt die Phaser-Konfiguration zurück
   */
  public static getConfig(): Phaser.Types.Core.GameConfig {
    return {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: true
        }
      },
      scene: [
        MainMenuScene,
        GameScene,
        GameOverScene,
        PauseScene
      ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game',
        width: '100%',
        height: '100%',
        min: {
          width: 800,
          height: 600
        },
        max: {
          width: 4096,
          height: 2160
        },
        autoRound: true,
        expandParent: true
      },
      dom: {
        createContainer: true
      },
      backgroundColor: '#000000'
    };
  }

  /**
   * Fügt CSS-Styles für das Game-Container hinzu
   */
  public static addGameStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #game {
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        background: #000 !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #000 !important;
        width: 100vw !important;
        height: 100vh !important;
      }
      canvas {
        margin: auto !important;
        object-fit: contain !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Fügt Event-Listener für Orientierungsänderungen und Resize hinzu
   */
  public static addResizeListener(): void {
    window.addEventListener('resize', () => {
      const game = document.querySelector('canvas');
      if (game) {
        game.style.width = window.innerWidth + 'px';
        game.style.height = window.innerHeight + 'px';
      }
    });
  }
} 