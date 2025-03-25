/**
 * ScoreDisplay-Klasse
 * Zeigt die Punktzahl des Spielers an
 */
export class ScoreDisplay {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private score: number = 0;
  private prefix: string;

  constructor(scene: Phaser.Scene, x: number, y: number, prefix: string = '') {
    this.scene = scene;
    this.prefix = prefix;
    
    // Erstelle den Punktetext
    this.scoreText = this.scene.add.text(x, y, this.formatScore(), {
      fontSize: '24px',
      color: '#00ffff',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    
    // Setze die Tiefe, damit die Punkteanzeige über der Toolbar liegt
    this.scoreText.setDepth(91);
  }

  /**
   * Aktualisiert die angezeigte Punktzahl
   */
  public updateScore(score: number): void {
    this.score = score;
    this.scoreText.setText(this.formatScore());
  }

  /**
   * Erhöht die Punktzahl um den angegebenen Wert
   */
  public addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(this.formatScore());
  }

  /**
   * Gibt die aktuelle Punktzahl zurück
   */
  public getScore(): number {
    return this.score;
  }

  /**
   * Formatiert die Punktzahl zur Anzeige
   */
  private formatScore(): string {
    // Füge führende Nullen hinzu, um eine 6-stellige Zahl zu erhalten
    const formattedScore = this.score.toString().padStart(6, '0');
    return `${this.prefix}${formattedScore}`;
  }

  /**
   * Setzt die Position des Textes
   */
  public setPosition(x: number, y: number): void {
    this.scoreText.setPosition(x, y);
  }

  /**
   * Zerstört die Punkteanzeige
   */
  public destroy(): void {
    this.scoreText.destroy();
  }
} 