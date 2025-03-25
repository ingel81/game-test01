/**
 * FpsDisplay-Klasse
 * Zeigt die aktuelle Bildrate (FPS) in einer dezenten Ecke des Bildschirms an
 */
export class FpsDisplay {
  private scene: Phaser.Scene;
  private fpsText: Phaser.GameObjects.Text;
  private updateInterval: number = 500; // Update-Intervall in Millisekunden
  private lastUpdate: number = 0;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Erstelle den FPS-Text in der unteren rechten Ecke
    this.fpsText = this.scene.add.text(
      this.scene.scale.width - 5, 
      this.scene.scale.height - 5, 
      '', 
      {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2
      }
    )
    .setOrigin(1, 1) // Rechtsbündig und unten ausrichten
    .setAlpha(0.5)   // Halbtransparent für dezentere Darstellung
    .setDepth(1000); // Immer im Vordergrund
  }
  
  /**
   * Aktualisiert die FPS-Anzeige
   */
  public update(time: number): void {
    // Nur in bestimmten Intervallen aktualisieren, um Performance zu sparen
    if (time - this.lastUpdate < this.updateInterval) {
      return;
    }
    
    // Aktualisiere den Zeitstempel
    this.lastUpdate = time;
    
    // Hole die aktuelle FPS-Rate
    const fps = Math.round(this.scene.game.loop.actualFps);
    
    // Aktualisiere den Text mit aktueller FPS
    this.fpsText.setText(`${fps} FPS`);
    
    // Passe die Farbe basierend auf der FPS-Rate an
    if (fps >= 55) {
      this.fpsText.setColor('#00ff00'); // Grün für gute FPS
    } else if (fps >= 30) {
      this.fpsText.setColor('#ffff00'); // Gelb für mittlere FPS
    } else {
      this.fpsText.setColor('#ff0000'); // Rot für niedrige FPS
    }
  }
} 