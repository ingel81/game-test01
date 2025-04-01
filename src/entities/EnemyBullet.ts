import { Bullet } from './Bullet';
import { Constants } from '../utils/constants';

/**
 * EnemyBullet-Klasse
 * Spezifische Implementierung für feindliche Projektile
 */
export class EnemyBullet extends Bullet {
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number,
    damage: number = Constants.ENEMY_BULLET_DAMAGE,
    speed: number = Constants.ENEMY_BULLET_SPEED
  ) {
    super(scene, x, y, Constants.ASSET_ENEMY_BULLET, damage, speed, 'enemy', true);
  }
  
  /**
   * Erzeugt ein feindliches Projektil und gibt es zurück
   */
  public static createBullet(
    scene: Phaser.Scene, 
    x: number, 
    y: number,
    angle: number
  ): EnemyBullet {
    const bullet = new EnemyBullet(scene, x, y);
    
    // Setze Richtung und Geschwindigkeit
    bullet.setDirectionAndSpeed(angle);
    
    // Registriere das Projektil für Kollisionserkennung
    bullet.register();
    
    return bullet;
  }
  
  /**
   * Registriere das Projektil für die Kollisionserkennung
   */
  public register(): void {
    this.eventBus.emit('REGISTER_ENEMY_BULLET', this.sprite);
  }
  
  /**
   * Erweiterte Initialisierung für feindliche Projektile
   */
  protected init(): void {
    super.init();
    
    // Standardausrichtung: Schüsse nach links (Standard für Feinde)
    if (this.sprite.body && this.sprite.body.velocity.x === 0 && this.sprite.body.velocity.y === 0) {
      this.setVelocityWithRotation(-this.speed, 0);
    }
    
    // Visuelles Feedback für Feindprojektile - auf weiß setzen
    this.sprite.setTint(0xffffff);
  }
} 