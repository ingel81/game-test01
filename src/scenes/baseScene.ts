import { Constants } from '../utils/constants';
import { EventBus, EventType } from '../utils/eventBus';
import { GameObjects } from 'phaser';

/**
 * BaseScene-Klasse
 * Basisklasse für alle Spielszenen
 */
export abstract class BaseScene extends Phaser.Scene {
  protected eventBus: EventBus;
  protected stars!: GameObjects.Group;

  constructor(key: string) {
    super(key);
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Lädt die grundlegenden Assets
   */
  preload(): void {
    // Lade die UI-Assets - Verwende temporär einen farbigen Rechteck statt Button
    
    // Lade die Hintergrund-Assets
    this.load.image('background', 'assets/background/bg-preview-big.png');
    
    // Lade die Sound-Assets
    this.load.audio('click', 'assets/sounds/laser1.wav');
    this.load.audio(Constants.SOUND_BACKGROUND, 'assets/music/01.mp3');
    this.load.audio(Constants.SOUND_SHOOT, 'assets/Sound FX/shot 1.wav');
    this.load.audio(Constants.SOUND_ENEMY_SHOOT, 'assets/Sound FX/shot 2.wav');
    this.load.audio(Constants.SOUND_EXPLOSION, 'assets/Sound FX/explosion.wav');
  }

  /**
   * Erstellt die grundlegenden UI-Elemente
   */
  create(): void {
    // Die Basisklasse erstellt keinen Hintergrund mehr, sodass jede Szene
    // ihren eigenen Hintergrund nach Bedarf erstellen kann
    
    // Erstelle Sternenfeld-Hintergrund für alle Szenen
    this.createStars();
  }
  
  /**
   * Standardmethode für das Update aller Szenen
   */
  update(time: number, delta: number): void {
    // Aktualisiere die Sterne in jeder Szene
    this.updateStars(delta);
  }

  /**
   * Erstellt einen Button
   */
  protected createButton(x: number, y: number, text: string, onClick: () => void): void {
    // Erstelle einen Rechteck-Button statt Bild
    const buttonWidth = 200;
    const buttonHeight = 50;
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
      fontSize: '24px'
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
  }

  /**
   * Erzeugt eine einfache Schaltfläche mit Text
   */
  protected createTextButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#00ffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
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
        button.setStyle({ color: '#00ffff' });
      })
      .on('pointerdown', () => {
        button.setStyle({ color: '#0088ff' });
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
    graphics.lineStyle(2, 0x00ffff, 0.8);
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
} 