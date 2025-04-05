import { Constants } from '../utils/constants';
import { EventBus, EventType } from '../utils/eventBus';
import { GameObjects } from 'phaser';
import { PlanetsBackground } from '../ui/planetsBackground';
import { FpsDisplay } from '../ui/fpsDisplay';
import { AssetLoader } from '../utils/assetLoader';
import { AssetManager, AssetCategory } from '../utils/assetManager';

/**
 * Debug-Modus Enum
 */
export enum DebugMode {
  OFF = 'off',      // Kein Debug
  LIGHT = 'light',  // Nur Gegner-Beschriftungen
  FULL = 'full'     // Voller Debug-Modus mit Hitboxen
}

/**
 * BaseScene-Klasse
 * Basisklasse für alle Spielszenen
 */
export abstract class BaseScene extends Phaser.Scene {
  // Statische Variable für den globalen Debug-Status
  protected static globalDebugMode: DebugMode = DebugMode.OFF;

  protected eventBus: EventBus;
  protected stars!: GameObjects.Group;
  protected planetsBackground!: PlanetsBackground;
  protected fpsDisplay!: FpsDisplay;
  protected debugMode: DebugMode = DebugMode.OFF;
  protected debugKey!: Phaser.Input.Keyboard.Key;
  protected debugInfoText!: Phaser.GameObjects.Text;

  constructor(key: string) {
    super(key);
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Lädt die grundlegenden Assets
   */
  preload(): void {
    // Verwende den AssetManager für grundlegende Assets
    const assetManager = AssetManager.getInstance();
    
    assetManager.loadAssetsByCategory(this, [
      AssetCategory.BACKGROUND, 
      AssetCategory.SOUND,
      AssetCategory.PLANET
    ]);
  }

  /**
   * Erstellt die grundlegenden UI-Elemente
   */
  create(): void {
    // Die Basisklasse erstellt keinen Hintergrund mehr, sodass jede Szene
    // ihren eigenen Hintergrund nach Bedarf erstellen kann
    
    // Erstelle Sternenfeld-Hintergrund für alle Szenen
    this.createStars();
    
    // Erstelle den Planeten-Hintergrund für alle Szenen
    this.createPlanetsBackground();
    
    // Erstelle die FPS-Anzeige
    this.createFpsDisplay();
    
    // Initialisiere den Debug-Modus
    this.setupDebugMode();
  }
  
  /**
   * Standardmethode für das Update aller Szenen
   */
  update(time: number, delta: number): void {
    // Aktualisiere die Sterne in jeder Szene
    this.updateStars(delta);
    
    // Aktualisiere die Planeten im Hintergrund
    if (this.planetsBackground) {
      this.planetsBackground.update(time, delta);
    }
    
    // Aktualisiere die FPS-Anzeige
    if (this.fpsDisplay) {
      this.fpsDisplay.update(time);
    }
    
    // Überprüfe Debug-Taste
    this.checkDebugToggle();
  }

  /**
   * Erstellt einen Button
   */
  protected createButton(x: number, y: number, text: string, onClick: () => void): void {
    // Erstelle einen Rechteck-Button statt Bild
    const buttonWidth = 220;
    const buttonHeight = 60;
    const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x333333, 0.8)
      .setInteractive()
      .on('pointerdown', () => {
        this.sound.play('click');
        onClick();
      })
      .on('pointerover', () => button.setFillStyle(0x555555, 0.8))
      .on('pointerout', () => button.setFillStyle(0x333333, 0.8));

    this.add.text(x, y, text, {
      color: '#ffffff',
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    }).setOrigin(0.5);
  }

  /**
   * Wird aufgerufen, wenn die Szene initialisiert wird
   */
  init(data?: any): void {
    console.log(`Szene ${this.scene.key} initialisiert`);
  }

  /**
   * Wird aufgerufen, wenn die Szene gestoppt wird
   */
  shutdown(): void {
    console.log(`Szene ${this.scene.key} heruntergefahren`);
    
    // Bereinige die Sterne
    if (this.stars) {
      this.stars.clear(true, true);
    }
    
    // Bereinige Debug-Ressourcen
    if (this.debugInfoText && this.debugInfoText.active) {
      this.debugInfoText.destroy();
    }
    
    // Bereinige Physik-Debug-Grafik, falls vorhanden
    if (this.physics && this.physics.world) {
      const world = this.physics.world as Phaser.Physics.Arcade.World;
      if (world.debugGraphic) {
        world.debugGraphic.clear();
      }
    }
  }

  /**
   * Erzeugt eine einfache Schaltfläche mit Text
   */
  protected createTextButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#cccccc',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
      padding: {
        left: 20,
        right: 20,
        top: 10,
        bottom: 10
      }
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        button.setStyle({ color: '#ffffff' });
      })
      .on('pointerout', () => {
        button.setStyle({ color: '#cccccc' });
      })
      .on('pointerdown', () => {
        button.setStyle({ color: '#aaaaaa' });
      })
      .on('pointerup', () => {
        button.setStyle({ color: '#ffffff' });
        callback();
      });

    return button;
  }

  /**
   * Erzeugt einen futuristischen Rahmen
   */
  protected createFuturisticFrame(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x888888, 0.8);
    graphics.strokeRect(x, y, width, height);

    return graphics;
  }
  
  /**
   * Erstellt die Sterne im Hintergrund
   */
  protected createStars(): void {
    try {
      this.stars = this.add.group();
      for (let i = 0; i < 150; i++) {
        const x = Phaser.Math.Between(0, this.scale.width);
        const y = Phaser.Math.Between(0, this.scale.height);
        const size = Phaser.Math.Between(1, 3);
        const star = this.add.circle(x, y, size, 0xffffff, 0.3) as Phaser.GameObjects.Arc;
        star.setData('speed', size * 20);
        star.setDepth(-10); // Stelle sicher, dass Sterne im Hintergrund sind
        this.stars.add(star);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Sterne:', error);
    }
  }

  /**
   * Aktualisiert die Sterne
   */
  protected updateStars(delta: number): void {
    if (!this.stars) return;

    try {
      this.stars.children.each((star: GameObjects.GameObject) => {
        const starCircle = star as Phaser.GameObjects.Arc;
        const speed = starCircle.getData('speed');
        
        // Bewege den Stern horizontal nach links
        starCircle.x -= speed * (delta / 1000) * 5;
        
        // Wenn der Stern den linken Rand verlässt, setze ihn rechts wieder ein
        if (starCircle.x < -10) {
          starCircle.x = this.scale.width + 10;
          starCircle.y = Phaser.Math.Between(0, this.scale.height);
          const size = Phaser.Math.Between(1, 3);
          starCircle.radius = size;
          starCircle.setData('speed', size * 20);
        }
        return true;
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Sterne:', error);
    }
  }

  /**
   * Erstellt die Planeten im Hintergrund
   */
  protected createPlanetsBackground(): void {
    try {
      this.planetsBackground = new PlanetsBackground(this);
    } catch (error) {
      console.error('Fehler beim Erstellen der Planeten:', error);
    }
  }
  
  /**
   * Erstellt die FPS-Anzeige
   */
  protected createFpsDisplay(): void {
    try {
      this.fpsDisplay = new FpsDisplay(this);
    } catch (error) {
      console.error('Fehler beim Erstellen der FPS-Anzeige:', error);
    }
  }

  /**
   * Richtet den Debug-Modus ein
   */
  protected setupDebugMode(): void {
    try {
      // Registriere die F9-Taste zum Umschalten des Debug-Modus
      this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F9);
      
      // Übernehme den globalen Debug-Status
      this.debugMode = BaseScene.globalDebugMode;
      
      // Erstelle Debug-Info-Text (anfangs unsichtbar, es sei denn, Debug ist aktiviert)
      this.debugInfoText = this.add.text(12, 2, this.getDebugStatusText(), {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: this.getDebugStatusColor(),
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      }).setDepth(1000).setScrollFactor(0).setVisible(this.debugMode !== DebugMode.OFF);
      
      // Wenn der Debug-Modus bereits aktiviert ist, stelle sicher, dass die Physik-Debug-Anzeige aktiviert wird
      if (this.debugMode === DebugMode.FULL && this.physics && this.physics.world) {
        const world = this.physics.world as Phaser.Physics.Arcade.World;
        world.drawDebug = true;
        world.createDebugGraphic();
      }
    } catch (error) {
      console.error('Fehler beim Einrichten des Debug-Modus:', error);
    }
  }
  
  /**
   * Hilfsmethode, um den Text für den aktuellen Debug-Status zu erhalten
   */
  private getDebugStatusText(): string {
    switch (this.debugMode) {
      case DebugMode.LIGHT:
        return 'Debug: LIGHT';
      case DebugMode.FULL:
        return 'Debug: FULL';
      default:
        return 'Debug: AUS';
    }
  }
  
  /**
   * Hilfsmethode, um die Farbe für den aktuellen Debug-Status zu erhalten
   */
  private getDebugStatusColor(): string {
    switch (this.debugMode) {
      case DebugMode.LIGHT:
        return '#00ffff'; // Türkis für LIGHT-Modus
      case DebugMode.FULL:
        return '#00ff00'; // Grün für FULL-Modus
      default:
        return '#ff0000'; // Rot für AUS
    }
  }
  
  /**
   * Prüft, ob die Debug-Taste gedrückt wurde und schaltet den Debug-Modus um
   */
  protected checkDebugToggle(): void {
    try {
      // Prüfe, ob debugKey korrekt initialisiert ist
      if (this.debugKey && this.debugKey.isDown !== undefined) {
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
          this.toggleDebugMode();
        }
      }
    } catch (error) {
      console.error('Fehler beim Überprüfen der Debug-Taste:', error);
    }
  }
  
  /**
   * Schaltet zwischen den Debug-Modi um (OFF -> LIGHT -> FULL -> OFF)
   */
  protected toggleDebugMode(): void {
    try {
      // State Machine: wechsle zum nächsten Zustand
      switch (this.debugMode) {
        case DebugMode.OFF:
          this.debugMode = DebugMode.LIGHT;
          break;
        case DebugMode.LIGHT:
          this.debugMode = DebugMode.FULL;
          break;
        case DebugMode.FULL:
          this.debugMode = DebugMode.OFF;
          break;
      }
      
      // Aktualisiere den globalen Debug-Status
      BaseScene.globalDebugMode = this.debugMode;
      
      // Aktualisiere die Physik-Debug-Anzeige
      if (this.physics && this.physics.world) {
        const world = this.physics.world as Phaser.Physics.Arcade.World;
        
        // Sicherheitscheck, ob debugGraphic existiert
        if (world.debugGraphic) {
          world.debugGraphic.clear();
        }
        
        // Setze Debug-Status nur im FULL-Modus
        world.drawDebug = (this.debugMode === DebugMode.FULL);
        
        // Erstelle Debug-Grafik neu, wenn FULL-Modus aktiviert
        if (this.debugMode === DebugMode.FULL) {
          world.createDebugGraphic();
        }
      }
      
      // Stelle sicher, dass debugInfoText existiert
      if (!this.debugInfoText || !this.debugInfoText.active) {
        // Falls debugInfoText nicht existiert, neu erstellen
        this.debugInfoText = this.add.text(10, 10, this.getDebugStatusText(), {
          fontSize: '16px',
          fontFamily: 'monospace',
          color: this.getDebugStatusColor(),
          backgroundColor: '#000000',
          padding: { x: 5, y: 2 }
        }).setDepth(1000).setScrollFactor(0);
      } else {
        // Zeige oder verstecke Debug-Info-Text
        this.debugInfoText.setText(this.getDebugStatusText());
        this.debugInfoText.setVisible(this.debugMode !== DebugMode.OFF);
        
        // Farbe des Debug-Texts aktualisieren
        this.debugInfoText.setStyle({ 
          backgroundColor: '#000000',
          color: this.getDebugStatusColor(),
          fontFamily: 'monospace',
          padding: { x: 5, y: 2 }
        });
        
        // Blende die Debug-Info nach 3 Sekunden aus, wenn Debug ausgeschaltet wird
        if (this.debugMode === DebugMode.OFF) {
          this.time.delayedCall(3000, () => {
            if (this.debugInfoText && this.debugInfoText.active) {
              this.debugInfoText.setVisible(false);
            }
          });
        }
      }
      
      console.log(`Debug-Modus gewechselt zu: ${this.debugMode}`);
      
      // Emit ein Ereignis, damit andere Komponenten darauf reagieren können
      this.eventBus.emit(EventType.DEBUG_TOGGLED, this.debugMode);
    } catch (error) {
      console.error('Fehler beim Umschalten des Debug-Modus:', error);
    }
  }
} 