import { Bullet } from './Bullet';
import { Constants } from '../utils/constants';

/**
 * PlayerBullet-Klasse
 * Spezifische Implementierung für Spieler-Projektile
 */
export class PlayerBullet extends Bullet {
  private powerLevel: number = 1;
  
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number,
    damage: number = Constants.BULLET_DAMAGE,
    speed: number = Constants.PLAYER_BULLET_SPEED,
    powerLevel: number = 1
  ) {
    super(scene, x, y, Constants.ASSET_BULLET, damage, speed, 'player', false);
    this.powerLevel = powerLevel;
  }
  
  /**
   * Erzeugt ein Spieler-Projektil und gibt es zurück
   */
  public static createBullet(
    scene: Phaser.Scene, 
    x: number, 
    y: number,
    angle: number = 0,  // Standard: nach rechts
    powerLevel: number = 1
  ): PlayerBullet {
    const bullet = new PlayerBullet(scene, x, y, Constants.BULLET_DAMAGE, Constants.PLAYER_BULLET_SPEED, powerLevel);
    
    // Setze Richtung und Geschwindigkeit
    bullet.setDirectionAndSpeed(angle);
    
    return bullet;
  }
  
  /**
   * Erweiterte Initialisierung für Spieler-Projektile
   */
  protected init(): void {
    super.init();
    
    // Standardausrichtung: Schüsse nach rechts (Standard für Spieler)
    if (this.sprite.body && this.sprite.body.velocity.x === 0 && this.sprite.body.velocity.y === 0) {
      this.setVelocityWithRotation(this.speed, 0);
    }
    
    // Skaliere das Projektil
    this.sprite.setScale(1.5);
    
    // Tint basierend auf Power-Level
    const tintColor = this.powerLevel === 1 ? 0xff8888 : 
                      (this.powerLevel === 2 ? 0xff5555 : 0xff0000);
    this.sprite.setTint(tintColor);
  }
} 