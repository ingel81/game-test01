import { Constants } from '../utils/constants';
import { EventBus, EventType } from '../utils/eventBus';
import { HealthBar } from './healthBar';
import { TouchControls } from './touchControls';
import { ScoreDisplay } from './scoreDisplay';

/**
 * GameUI-Klasse
 * Verwaltet alle UI-Komponenten des Spiels
 */
export class GameUI {
  private scene: Phaser.Scene;
  private healthBar: HealthBar;
  private scoreDisplay: ScoreDisplay;
  private touchControls: TouchControls | null = null;
  private toolbar: Phaser.GameObjects.Graphics;
  private levelDisplay: Phaser.GameObjects.Text;
  private eventBus: EventBus;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    
    // Erstelle die Toolbar
    this.createToolbar();
    
    // Berechne die Positionen basierend auf der Bildschirmbreite
    const screenWidth = this.scene.scale.width;
    
    // Erstelle die Punkteanzeige (links)
    this.scoreDisplay = new ScoreDisplay(
      this.scene,
      100,
      Constants.TOOLBAR_HEIGHT / 2,
      'P1 >> '
    );
    
    // Erstelle die Level-Anzeige (mitte)
    this.levelDisplay = this.scene.add.text(
      screenWidth / 2,
      Constants.TOOLBAR_HEIGHT / 2,
      'LEVEL 1',
      {
        fontSize: '20px',
        color: '#00ffff',
        fontFamily: 'monospace',
        stroke: '#000',
        strokeThickness: 4
      }
    ).setOrigin(0.5, 0.5);
    this.levelDisplay.setDepth(91);
    
    // Erstelle die Gesundheitsanzeige (rechts)
    this.healthBar = new HealthBar(
      this.scene,
      screenWidth - 200,
      Constants.TOOLBAR_HEIGHT / 2,
      150,
      20
    );
    
    // Erstelle Touch-Steuerung, wenn auf einem Touch-Gerät
    if (this.scene.sys.game.device.input.touch) {
      this.touchControls = new TouchControls(this.scene);
    }
    
    // Registriere Event-Listener für Level-Änderungen
    this.eventBus.on(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);
  }

  /**
   * Handler für Schwierigkeitsgradänderungen
   */
  private onDifficultyChanged = (data: any): void => {
    const newDifficulty = typeof data === 'object' ? data.difficulty : data;
    // Aktualisiere die Level-Anzeige
    this.updateLevel(newDifficulty);
  }

  /**
   * Erstellt die Toolbar
   */
  private createToolbar(): void {
    // Erstelle die Grafik für die Toolbar
    this.toolbar = this.scene.add.graphics();
    
    // Zeichne den Hintergrund
    this.toolbar.fillStyle(0x000000, 0.8);
    this.toolbar.fillRect(0, 0, this.scene.scale.width, Constants.TOOLBAR_HEIGHT);
    
    // Zeichne den Rahmen
    this.toolbar.lineStyle(2, 0x00ffff, 0.8);
    this.toolbar.strokeRect(0, 0, this.scene.scale.width, Constants.TOOLBAR_HEIGHT);
    
    // Zeichne vertikale Trennlinien
    const leftThirdX = this.scene.scale.width / 3;
    const rightThirdX = this.scene.scale.width * 2 / 3;
    this.toolbar.lineStyle(1, 0x00ffff, 0.4);
    this.toolbar.lineBetween(leftThirdX, 5, leftThirdX, Constants.TOOLBAR_HEIGHT - 5);
    this.toolbar.lineBetween(rightThirdX, 5, rightThirdX, Constants.TOOLBAR_HEIGHT - 5);
    
    // Setze die Tiefe, damit die Toolbar hinter den UI-Elementen gezeichnet wird
    this.toolbar.setDepth(90);
  }

  /**
   * Aktualisiert die Gesundheitsanzeige
   */
  public updateHealth(health: number): void {
    this.healthBar.setValue(health);
  }

  /**
   * Aktualisiert die Punkteanzeige
   */
  public updateScore(score: number): void {
    this.scoreDisplay.updateScore(score);
  }
  
  /**
   * Aktualisiert die Level-Anzeige
   */
  public updateLevel(level: number): void {
    this.levelDisplay.setText(`LEVEL ${level}`);
    
    // Kurze Pulsier-Animation für die Level-Anzeige
    this.scene.tweens.add({
      targets: this.levelDisplay,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
      repeat: 1
    });
  }

  /**
   * Gibt zurück, ob der Spieler sich über Touch bewegt
   */
  public isTouchMoving(): boolean {
    return this.touchControls ? this.touchControls.isPlayerMoving() : false;
  }

  /**
   * Gibt zurück, ob der Spieler über Touch schießt
   */
  public isTouchShooting(): boolean {
    return this.touchControls ? this.touchControls.isPlayerShooting() : false;
  }

  /**
   * Gibt die X-Koordinate des Touch-Punkts zurück
   */
  public getTouchX(): number {
    return this.touchControls ? this.touchControls.getTouchX() : 0;
  }

  /**
   * Gibt die Y-Koordinate des Touch-Punkts zurück
   */
  public getTouchY(): number {
    return this.touchControls ? this.touchControls.getTouchY() : 0;
  }

  /**
   * Zerstört alle UI-Elemente
   */
  public destroy(): void {
    this.toolbar.destroy();
    this.levelDisplay.destroy();
    this.eventBus.off(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);
    // HealthBar und ScoreDisplay haben keine destroy-Methode
    if (this.touchControls) {
      this.touchControls.destroy();
    }
  }
} 