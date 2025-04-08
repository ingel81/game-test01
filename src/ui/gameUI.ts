import { Constants } from '../utils/constants';
import { EventBus, EventType } from '../utils/eventBus';
import { HealthBar } from './healthBar';
import { TouchControls } from './touchControls';
import { ScoreDisplay } from './scoreDisplay';
import { Player } from '../entities/player/player';

/**
 * GameUI-Klasse
 * Verwaltet alle UI-Komponenten des Spiels
 */
export class GameUI {
  private scene: Phaser.Scene;
  private player: Player;
  private healthBar: HealthBar;
  private scoreDisplay: ScoreDisplay;
  private touchControls: TouchControls | null = null;
  private toolbar: Phaser.GameObjects.Graphics;
  private levelDisplay: Phaser.GameObjects.Text;
  private eventBus: EventBus;
  private isMobile: boolean;
  private toolbarHeight: number;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.eventBus = EventBus.getInstance();
    this.isMobile = this.scene.sys.game.device.input.touch;
    this.toolbarHeight = Constants.getToolbarHeight(this.isMobile);
    
    // Erstelle die Toolbar
    this.createToolbar();
    
    // Berechne die Positionen basierend auf der Bildschirmbreite
    const screenWidth = this.scene.scale.width;
    
    // Einheitlicher Abstand vom Rand für alle Elemente
    const margin = 15;
    
    // Erstelle die Punkteanzeige (links)
    this.scoreDisplay = new ScoreDisplay(
      this.scene,
      margin,
      this.toolbarHeight / 2,
      'P1 >> '
    );
    
    // Erstelle die Level-Anzeige (exakt in der Mitte)
    this.levelDisplay = this.scene.add.text(
      screenWidth / 2,
      this.toolbarHeight / 2,
      '',
      {
        fontSize: this.isMobile ? '16px' : '20px',
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
      screenWidth - margin,
      this.toolbarHeight / 2,
      this.isMobile ? 90 : 110,
      this.isMobile ? 16 : 20
    );
    
    // Initialisiere die Gesundheitsanzeige mit der Spielergesundheit
    this.updateHealth(this.player.getHealth());
    
    // Erstelle Touch-Steuerung, wenn auf einem Touch-Gerät
    if (this.isMobile) {
      this.touchControls = new TouchControls(this.scene);
    }
    
    // Registriere Event-Listener für Level-Änderungen
    this.eventBus.on(EventType.LEVEL_STARTED, this.onLevelStarted);
    this.eventBus.on(EventType.PLAYER_DAMAGED, this.onPlayerDamaged);
    this.eventBus.on(EventType.PLAYER_HEALED, this.onPlayerHealed);
  }
  
  /**
   * Update-Methode, die jeden Frame aufgerufen wird
   */
  public update(time: number, delta: number): void {
    // Aktualisiere die Touch-Steuerung, wenn vorhanden
    if (this.touchControls) {
      this.touchControls.update();
    }
  }

  /**
   * Handler für Level-Start
   */
  private onLevelStarted = (data: any): void => {
    // Hole den Levelnamen aus dem Event
    const levelName = typeof data === 'object' && data.levelName ? data.levelName : `LEVEL ${data.index + 1}`;
    
    // Aktualisiere die Level-Anzeige mit dem Namen
    this.updateLevel(levelName);
  }
  
  /**
   * Handler für Spielerschaden
   */
  private onPlayerDamaged = (health: number): void => {
    this.updateHealth(health);
  }
  
  /**
   * Handler für Spielerheilung
   */
  private onPlayerHealed = (health: number): void => {
    this.updateHealth(health);
  }

  /**
   * Erstellt die Toolbar
   */
  private createToolbar(): void {
    // Erstelle die Grafik für die Toolbar
    this.toolbar = this.scene.add.graphics();
    
    // Zeichne den Hintergrund
    this.toolbar.fillStyle(0x000000, 0.8);
    this.toolbar.fillRect(0, 0, this.scene.scale.width, this.toolbarHeight);
    
    // Zeichne den Rahmen
    this.toolbar.lineStyle(2, 0x00ffff, 0.8);
    this.toolbar.strokeRect(0, 0, this.scene.scale.width, this.toolbarHeight);
    
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
   * Gibt den aktuellen Score zurück
   */
  public getScore(): number {
    return this.scoreDisplay.getScore();
  }
  
  /**
   * Aktualisiert die Level-Anzeige
   */
  public updateLevel(levelText: string): void {
    this.levelDisplay.setText(levelText);
    
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
    this.eventBus.off(EventType.LEVEL_STARTED, this.onLevelStarted);
    this.eventBus.off(EventType.PLAYER_DAMAGED, this.onPlayerDamaged);
    this.eventBus.off(EventType.PLAYER_HEALED, this.onPlayerHealed);
    // HealthBar und ScoreDisplay haben keine destroy-Methode
    if (this.touchControls) {
      this.touchControls.destroy();
    }
  }
} 