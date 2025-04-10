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
  public createEnemyBullet(x: number, y: number, angle: number, damage: number = Constants.ENEMY_BULLET_DAMAGE): EnemyBullet {
    const bullet = EnemyBullet.createBullet(this.scene, x, y, angle, damage);
    
    // Überprüfe, ob das Projektil korrekt erstellt wurde
    const bulletSprite = bullet.getSprite();
    if (bulletSprite && bulletSprite.body) {
      // Sicherstellen, dass das Projektil eine tatsächliche Geschwindigkeit hat
      if (Math.abs(bulletSprite.body.velocity.x) < 10 && Math.abs(bulletSprite.body.velocity.y) < 10) {
        //console.log(`[BULLET_FACTORY] Bullet hat zu geringe Geschwindigkeit, korrigiere zu Basis-Richtung (links)`);
        bulletSprite.body.velocity.x = -300; // Erzwinge Bewegung nach links
        
        // Setze die Rotation entsprechend (nach links = Math.PI)
        bulletSprite.setRotation(Math.PI);
      } else {
        // Ansonsten sicherstellen, dass die Rotation der Bewegungsrichtung entspricht
        const vx = bulletSprite.body.velocity.x;
        const vy = bulletSprite.body.velocity.y;
        if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
          bulletSprite.setRotation(Math.atan2(vy, vx));
        }
      }
    }
    
    return bullet;
  }
  
  /**
   * Erstellt ein Turret-Projektil an einer bestimmten Position mit Richtung
   */
  public createTurretBullet(x: number, y: number, angle: number, damage: number = Constants.DAMAGE.ENEMY_BULLET): EnemyBullet {
    console.log(`[BULLET_FACTORY] Erstelle Turret-Bullet: Position=(${x}, ${y}), Winkel=${angle} rad (${Math.round(angle * 180 / Math.PI)}°)`);
    const bullet = EnemyBullet.createBullet(this.scene, x, y, angle, damage, "turret");
    
    // Überprüfe, ob das Projektil korrekt erstellt wurde und sichtbar ist
    const bulletSprite = bullet.getSprite();
    if (bulletSprite) {
      // Sicherstellen, dass das Projektil sichtbar ist
      bulletSprite.setVisible(true);
      
      // Stellen wir sicher, dass eine Textur angewendet ist
      if (!bulletSprite.texture || bulletSprite.texture.key === '__MISSING') {
        console.warn(`[BULLET_FACTORY] Turret-Bullet hat keine gültige Textur, verwende Ersatztextur`);
        bulletSprite.setTexture(Constants.ASSET_ENEMY_BULLET);
      }
      
      // Debug-Log für Sichtbarkeit
      console.log(`[BULLET_FACTORY] Turret-Bullet erstellt: Sichtbar=${bulletSprite.visible}, Textur=${bulletSprite.texture.key}, Alpha=${bulletSprite.alpha}`);
      
      // Setze eine höhere Sichtbarkeit falls notwendig
      if (bulletSprite.alpha < 1) {
        bulletSprite.setAlpha(1);
      }
      
      // Überprüfe und korrigiere die Geschwindigkeit
      if (bulletSprite.body) {
        const vx = bulletSprite.body.velocity.x;
        const vy = bulletSprite.body.velocity.y;
        
        if (Math.abs(vx) < 10 && Math.abs(vy) < 10) {
          // Bullet hat zu geringe Geschwindigkeit, korrigiere basierend auf dem Winkel
          const speed = Constants.ENEMY_BULLET_SPEED || 350;
          bulletSprite.body.velocity.x = Math.cos(angle) * speed;
          bulletSprite.body.velocity.y = Math.sin(angle) * speed;
          
          console.log(`[BULLET_FACTORY] Korrigierte Turret-Bullet Geschwindigkeit: (${bulletSprite.body.velocity.x}, ${bulletSprite.body.velocity.y})`);
        }
      }
    } else {
      console.error(`[BULLET_FACTORY] Konnte kein gültiges Sprite für Turret-Bullet erstellen!`);
    }
    
    return bullet;
  }
  
  /**
   * Erstellt eine 360-Grad-Salve von Projektilen (für Boss oder Elite-Gegner)
   */
  public create360Bullets(x: number, y: number, count: number, damage: number = Constants.DAMAGE.ENEMY_BULLET): EnemyBullet[] {
    const bullets: EnemyBullet[] = [];
    const angleStep = (Math.PI * 2) / count;
    
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      bullets.push(EnemyBullet.createBullet(this.scene, x, y, angle, damage));
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
