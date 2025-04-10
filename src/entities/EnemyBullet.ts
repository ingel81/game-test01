import { Bullet } from "./Bullet";
import { Constants } from "../utils/constants";

/**
 * EnemyBullet-Klasse
 * Spezifische Implementierung für feindliche Projektile
 */
export class EnemyBullet extends Bullet {
  protected bulletType: string = "enemy"; // Standardtyp ist "enemy"

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number = Constants.ENEMY_BULLET_DAMAGE,
    speed: number = Constants.ENEMY_BULLET_SPEED,
    bulletType: string = "enemy"
  ) {
    super(
      scene,
      x,
      y,
      Constants.ASSET_ENEMY_BULLET,
      damage,
      speed,
      "enemy", // owner ist immer "enemy"
      true
    );

    // Speichere den spezifischen Bullet-Typ
    this.bulletType = bulletType;

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
    damage: number = Constants.ENEMY_BULLET_DAMAGE,
    bulletType: string = "enemy"
  ): EnemyBullet {
    const bullet = new EnemyBullet(scene, x, y, damage, Constants.ENEMY_BULLET_SPEED, bulletType);


    // Setze Richtung und Geschwindigkeit
    bullet.setDirectionAndSpeed(angle);

    // Doppelprüfung für Geschwindigkeit - bei Problemen erzwinge Bewegung nach links
    const sprite = bullet.getSprite();
    if (sprite && sprite.body) {
      if (
        Math.abs(sprite.body.velocity.x) < 20 &&
        Math.abs(sprite.body.velocity.y) < 20
      ) {
        console.warn(
          `[ENEMY_BULLET DEBUG] Fallback wird angewendet! Erzwinge Bewegung nach links.`
        );
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
    this.sprite.setData("creationTime", this.scene.time.now);
    this.sprite.setData("bulletId", Date.now() + Math.random());
    
    // Speichere den spezifischen Bullet-Typ im Sprite für die Kollisionserkennung
    this.sprite.setData("bulletType", this.bulletType);

    // Größe anpassen für Turret-Bullets, um sie besser sichtbar zu machen
    if (this.bulletType === "turret") {
      this.sprite.setScale(1.2);
      
      // Optional: Andere Farbe für bessere Sichtbarkeit
      this.sprite.setTint(0xff9999);
    }

    // Registriere für Kollisionserkennung
    this.eventBus.emit("REGISTER_ENEMY_BULLET", this.sprite);
  }

  /**
   * Erweiterte Initialisierung für feindliche Projektile
   */
  protected init(): void {
    super.init();

    // Standardausrichtung: Schüsse nach links (Standard für Feinde)
    if (
      this.getSprite().body &&
      this.getSprite().body.velocity.x === 0 &&
      this.getSprite().body.velocity.y === 0
    ) {
      this.setVelocityWithRotation(-this.speed, 0);
    }
  }
}
