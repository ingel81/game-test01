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
    
    // Direkter Debug-Log bei Erstellung
    //console.log(`[ENEMY_BULLET] Erstellt an Position (${x}, ${y})`);
  }
  
  /**
   * Erzeugt ein feindliches Projektil und gibt es zurück
   */
  public static createBullet(
    scene: Phaser.Scene, 
    x: number, 
    y: number,
    angle: number,
    damage: number = Constants.ENEMY_BULLET_DAMAGE
  ): EnemyBullet {
    const bullet = new EnemyBullet(scene, x, y, damage);
    
    // Setze Richtung und Geschwindigkeit
    bullet.setDirectionAndSpeed(angle);
    
    // Doppelprüfung für Geschwindigkeit - bei Problemen erzwinge Bewegung nach links
    const sprite = bullet.getSprite();
    if (sprite && sprite.body) {
      if (Math.abs(sprite.body.velocity.x) < 20 && Math.abs(sprite.body.velocity.y) < 20) {
        sprite.body.velocity.x = -Constants.ENEMY_BULLET_SPEED;
        sprite.setRotation(Math.PI);
      }
    }
    
    // Registriere das Projektil für Kollisionserkennung
    bullet.register();
    
    return bullet;
  }
  
  /**
   * Registriere das Projektil für die Kollisionserkennung
   */
  public register(): void {
    // Setze die Erstellungszeit
    this.sprite.setData('creationTime', this.scene.time.now);
    this.sprite.setData('bulletId', Date.now() + Math.random());
    
    // Registriere für Kollisionserkennung
    this.eventBus.emit('REGISTER_ENEMY_BULLET', this.sprite);
  }
  
  /**
   * Erweiterte Initialisierung für feindliche Projektile
   */
  protected init(): void {
    super.init();
    
    // Standardausrichtung: Schüsse nach links (Standard für Feinde)
    if (this.getSprite().body && this.getSprite().body.velocity.x === 0 && this.getSprite().body.velocity.y === 0) {
      this.setVelocityWithRotation(-this.speed, 0);

    }
  }
} 