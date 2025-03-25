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
  private isMobile: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.borderWidth = 2;
    this.value = 100;
    this.maxValue = 100;
    this.isMobile = this.scene.sys.game.device.input.touch;
    
    // Erstelle die Grafiken
    this.graphics = this.scene.add.graphics();
    
    const labelFontSize = this.isMobile ? '12px' : '14px';
    const valueFontSize = this.isMobile ? '14px' : '16px';
    
    // Label direkt über der HealthBar platzieren
    this.label = this.scene.add.text(
      x,
      y - height,
      'ENERGY', 
      {
        fontSize: labelFontSize,
        color: '#00ffff',
        fontFamily: 'monospace',
        stroke: '#000',
        strokeThickness: 3
      }
    ).setOrigin(1, 0.5); // Rechtsbündig ausrichten
    
    // Wert-Text rechts neben der HealthBar (nicht mehr nötig)
    // Wir zeigen den Wert jetzt in der Mitte der HealthBar an
    this.text = this.scene.add.text(
      x - width / 2,
      y,
      this.value.toString(), 
      {
        fontSize: valueFontSize,
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000',
        strokeThickness: 3
      }
    ).setOrigin(0.5, 0.5); // Zentriert in der HealthBar
    
    // Setze die Tiefe, damit die HealthBar über der Toolbar liegt
    this.graphics.setDepth(91);
    this.label.setDepth(91);
    this.text.setDepth(92); // Höher als die Bar, damit der Text über der Füllfarbe liegt
    
    // Render initial
    this.render();
  }

  /**
   * Stellt die HealthBar mit dem aktuellen Wert dar
   */
  private render(): void {
    this.graphics.clear();
    
    // Berechne die Position basierend auf der rechten Ausrichtung
    const barX = this.x - this.width;
    
    // Zeichne den Hintergrund der Leiste
    this.graphics.fillStyle(0x000000, 0.8);
    this.graphics.fillRect(
      barX, 
      this.y - this.height / 2, 
      this.width, 
      this.height
    );
    
    // Zeichne den Rahmen der Leiste
    this.graphics.lineStyle(this.borderWidth, 0x00ffff, 0.8);
    this.graphics.strokeRect(
      barX, 
      this.y - this.height / 2, 
      this.width,
      this.height
    );
    
    // Zeichne den Wert-Balken
    const fillWidth = Math.floor(this.width * (this.value / this.maxValue));
    
    // Farbe basierend auf der Gesundheit
    let fillColor = 0x00ff00; // Grün
    if (this.value < this.maxValue * 0.6) fillColor = 0xffff00; // Gelb
    if (this.value < this.maxValue * 0.3) fillColor = 0xff0000; // Rot
    
    this.graphics.fillStyle(fillColor, 1);
    this.graphics.fillRect(
      barX + this.borderWidth, 
      this.y - this.height / 2 + this.borderWidth, 
      fillWidth - this.borderWidth * 2,
      this.height - this.borderWidth * 2
    );
    
    // Aktualisiere den Text
    this.text.setText(this.value.toString());
    // Position des Textes aktualisieren
    this.text.setPosition(barX + this.width / 2, this.y);
  }

  /**
   * Setzt den Wert der Gesundheitsleiste
   */
  public setValue(value: number): void {
    this.value = Math.max(0, Math.min(value, this.maxValue));
    this.render();
  }
  
  /**
   * Gibt den aktuellen Wert zurück
   */
  public getValue(): number {
    return this.value;
  }
} 