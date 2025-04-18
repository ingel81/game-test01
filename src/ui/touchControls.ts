/**
 * TouchControls-Klasse
 * Verwaltet die Touch-Steuerung für mobile Geräte
 */
export class TouchControls {
  private scene: Phaser.Scene;
  private leftZone: Phaser.GameObjects.Zone;
  private rightZone: Phaser.GameObjects.Zone;
  private isMoving: boolean = false;
  private isShooting: boolean = false;
  private touchX: number = 0;
  private touchY: number = 0;
  private pointer: Phaser.Input.Pointer | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Erstelle die Touch-Zonen
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // Linke Zone für Bewegung (größter Teil des Bildschirms)
    this.leftZone = this.scene.add.zone(0, 0, width * 0.7, height)
      .setOrigin(0, 0)
      .setInteractive();

    // Rechts unten für Schießen
    const buttonSize = Math.min(70, width * 0.14);
    const buttonX = width - buttonSize;
    const buttonY = height - buttonSize * 1.5;

    // Schießen-Zone (kleinere Zone rechts unten)
    this.rightZone = this.scene.add.zone(buttonX, buttonY, buttonSize, buttonSize)
      .setOrigin(0, 0)
      .setInteractive();

    this.setupEventListeners();
  }

  /**
   * Richtet die Event-Listener ein
   */
  private setupEventListeners(): void {
    // Bewegungs-Events
    this.leftZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isMoving = true;
      this.touchX = pointer.x;
      this.touchY = pointer.y;
      this.pointer = pointer;
    });

    this.leftZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isMoving && this.pointer && this.pointer.id === pointer.id) {
        this.touchX = pointer.x;
        this.touchY = pointer.y;
      }
    });

    this.leftZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.pointer && this.pointer.id === pointer.id) {
        this.isMoving = false;
        this.pointer = null;
      }
    });

    // Schieß-Events
    this.rightZone.on('pointerdown', () => {
      this.isShooting = true;
    });

    this.rightZone.on('pointerup', () => {
      this.isShooting = false;
    });
    
    // Zusätzlich: Schießen beenden, wenn der Pointer den Bildschirm verlässt
    this.scene.input.on('pointerup', () => {
      if (this.isShooting) {
        this.isShooting = false;
      }
    });
  }

  /**
   * Gibt zurück, ob gerade geschossen wird
   */
  public isPlayerShooting(): boolean {
    return this.isShooting;
  }

  /**
   * Gibt zurück, ob gerade bewegt wird
   */
  public isPlayerMoving(): boolean {
    return this.isMoving;
  }

  /**
   * Gibt die aktuelle Touch-Position zurück
   */
  public getTouchX(): number {
    return this.touchX;
  }

  /**
   * Gibt die aktuelle Touch-Position zurück
   */
  public getTouchY(): number {
    return this.touchY;
  }

  /**
   * Zerstört die Touch-Steuerung
   */
  public destroy(): void {
    this.leftZone.destroy();
    this.rightZone.destroy();
  }
} 