import 'phaser';
import { GameConfig } from './core/config';

// Füge Type-Declaration für window.game hinzu
declare global {
    interface Window {
        game: Phaser.Game;
    }
}

// CSS-Styles für das Spiel hinzufügen
GameConfig.addGameStyles();

// Event-Listener für Größenänderung hinzufügen
GameConfig.addResizeListener();

// Spiel-Instanz erstellen
const game = new Phaser.Game(GameConfig.getConfig());

// Speichere die Spiel-Instanz in einer globalen Variable für den Zugriff
// @ts-ignore - Diese Zuweisung ist für den Zugriff bei Resize erforderlich
window.game = game; 