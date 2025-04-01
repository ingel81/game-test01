import { PlayerBullet } from '../entities/PlayerBullet';
import { EnemyBullet } from '../entities/EnemyBullet';
import { Constants } from '../utils/constants';

/**
 * BulletFactory-Klasse
 * Eine zentrale Stelle zur Erzeugung verschiedener Projektiltypen
 */
export class BulletFactory {
  private static instance: BulletFactory;
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Singleton-Pattern: Hole oder erstelle eine Instanz
   */
  public static getInstance(scene: Phaser.Scene): BulletFactory {
    if (!BulletFactory.instance) {
      BulletFactory.instance = new BulletFactory(scene);
    }
    return BulletFactory.instance;
  }
  
  /**
   * Erstellt ein Standard-Spielerprojektil
   */
  public createPlayerBullet(x: number, y: number, angle: number = 0, powerLevel: number = 1): PlayerBullet {
    return PlayerBullet.createBullet(this.scene, x, y, angle, powerLevel);
  }
  
  /**
   * Erstellt ein Standard-Feindprojektil
   */
  public createEnemyBullet(x: number, y: number, angle: number): EnemyBullet {
    return EnemyBullet.createBullet(this.scene, x, y, angle);
  }
  
  /**
   * Erstellt ein Turret-Projektil an einer bestimmten Position mit Richtung
   */
  public createTurretBullet(x: number, y: number, angle: number): EnemyBullet {
    return EnemyBullet.createBullet(this.scene, x, y, angle);
  }
  
  /**
   * Erstellt eine 360-Grad-Salve von Projektilen (für Boss oder Elite-Gegner)
   */
  public create360Bullets(x: number, y: number, count: number): EnemyBullet[] {
    const bullets: EnemyBullet[] = [];
    const angleStep = (Math.PI * 2) / count;
    
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      bullets.push(EnemyBullet.createBullet(this.scene, x, y, angle));
    }
    
    return bullets;
  }
  
  /**
   * Setze die Scene (für den Fall, dass sich die aktive Szene ändert)
   */
  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }
  
  /**
   * Bereinige die Instanz (für Scene-Wechsel)
   */
  public static resetInstance(): void {
    BulletFactory.instance = null;
  }
} 