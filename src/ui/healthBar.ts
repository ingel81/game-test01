import { Constants } from '../utils/constants';

/**
 * HealthBar-Klasse
 * Zeigt die Gesundheit des Spielers an
 */
export class HealthBar {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private borderWidth: number;
  private value: number;
  private maxValue: number;
  private text: Phaser.GameObjects.Text;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.borderWidth = 2;
    this.value = 100;
    this.maxValue = 100;
    
    // Erstelle die Grafiken
    this.graphics = this.scene.add.graphics();
    
    // Erstelle den Beschriftungstext
    this.label = this.scene.add.text(x - width / 2 - 80, y, 'ENERGY', {
      fontSize: '18px',
      color: '#00ffff',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    
    // Erstelle den Wert-Text
    this.text = this.scene.add.text(x + width / 2 + 10, y, '100', {
      fontSize: '18px',
      color: '#00ffff',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    
    // Setze die Tiefe, damit die HealthBar über der Toolbar liegt
    this.graphics.setDepth(91);
    this.label.setDepth(91);
    this.text.setDepth(91);
    
    // Render initial
    this.render();
  }

  /**
   * Aktualisiert den Wert der Healthbar
   */
  public setValue(value: number): void {
    this.value = Phaser.Math.Clamp(value, 0, this.maxValue);
    this.text.setText(Math.floor(this.value).toString());
    this.render();
  }

  /**
   * Aktualisiert den Maximalwert der Healthbar
   */
  public setMaxValue(maxValue: number): void {
    this.maxValue = maxValue;
    this.value = Phaser.Math.Clamp(this.value, 0, this.maxValue);
    this.render();
  }

  /**
   * Gibt den aktuellen Wert zurück
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Gibt den Maximalwert zurück
   */
  public getMaxValue(): number {
    return this.maxValue;
  }

  /**
   * Rendert die Healthbar
   */
  private render(): void {
    this.graphics.clear();
    
    // Berechne die Prozentzahl
    const percent = this.value / this.maxValue;
    
    // Zeichne den Hintergrund
    this.graphics.fillStyle(0x000000, 0.8);
    this.graphics.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Zeichne den Rahmen
    this.graphics.lineStyle(this.borderWidth, 0x00ffff, 1.0);
    this.graphics.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Zeichne den Füllstand
    if (percent > 0) {
      // Farbe basierend auf der Gesundheit
      let fillColor: number;
      if (percent > 0.6) {
        fillColor = 0x00ff00; // Grün
      } else if (percent > 0.3) {
        fillColor = 0xffff00; // Gelb
      } else {
        fillColor = 0xff0000; // Rot
      }
      
      this.graphics.fillStyle(fillColor, 1.0);
      this.graphics.fillRect(
        this.x - this.width / 2 + this.borderWidth,
        this.y - this.height / 2 + this.borderWidth,
        (this.width - this.borderWidth * 2) * percent,
        this.height - this.borderWidth * 2
      );
    }
  }
} 