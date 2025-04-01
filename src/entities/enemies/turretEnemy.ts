/**
 * TurretEnemy-Klasse
 * Ein stationärer Geschützturm mit drehbarem Aufsatz und gezieltem Schussverhalten
 */

import { BaseEnemy, EnemyConfig } from "./baseEnemy";
import { Player } from "../player/player";
import { Constants } from "../../utils/constants";
import { MovementPattern } from "./components/movementComponent";
import { ShootingPattern } from "./components/weaponComponent";

export class TurretEnemy extends BaseEnemy {
  // Statischer Klassenname, der im Build erhalten bleibt
  public static enemyType = "TurretEnemy";

  // Spezifische Eigenschaften für den Turm
  private turretBase: Phaser.Physics.Arcade.Sprite;
  private turretTop: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Konfiguration für den Geschützturm
    const config: EnemyConfig = {
      texture: Constants.ASSET_TURRET_BASE,
      health: 150,
      speed: 30, // Sehr langsame Bewegung (nur in X-Richtung)
      scoreValue: 150,
      fireRate: 1500, // Etwas langsamere Feuerrate

      // Bewegungseinstellungen - sehr langsame lineare Bewegung
      movement: {
        pattern: "linear",
        speed: 30,
        baseVelocityX: -30, // Langsamer als normale Gegner
        changePatternRandomly: false,
      },

      // Waffeneinstellungen - gezieltes Schießen
      weapon: {
        pattern: "single",
        fireRate: 1500,
        changePatternRandomly: false,
        targetPlayer: true, // Auf Spieler zielen
        predictiveAim: true, // Mit Vorhersage
      },

      // Visuelle Einstellungen
      visual: {
        tint: 0xffffff,
        scale: 0.2,
        hitEffectDuration: 150,
        rotationSpeed: 0, // Basis soll sich nicht drehen
      },
    };

    super(scene, x, y, player, config);

    // Referenz auf die Basis speichern
    this.turretBase = this.sprite;

    // Erstelle den oberen Teil des Turms
    this.turretTop = scene.add.sprite(x, y, Constants.ASSET_TURRET_TOP);
    this.turretTop.setOrigin(0.7, 0.5); // Drehpunkt weiter rechts setzen (anstatt 0.5, 0.5)
    this.turretTop.setScale(0.2);
    this.turretTop.setDepth(this.sprite.depth + 1); // Über der Basis anzeigen
  }

  /**
   * Aktualisiert den Zustand des Geschützturms
   */
  update(time: number, delta: number): void {
    // Basisaktualisierung von BaseEnemy aufrufen
    super.update(time, delta);

    if (
      this.turretTop &&
      this.turretTop.active &&
      this.sprite &&
      this.sprite.active
    ) {
      this.turretTop.x = this.sprite.x - 7;
      this.turretTop.y = this.sprite.y - 3;

      // Berechne den Winkel zum Spieler für das obere Teil
      if (
        this.player &&
        this.player.getSprite() &&
        this.player.getSprite().active
      ) {
        const playerSprite = this.player.getSprite();
        const angle = Phaser.Math.Angle.Between(
          this.turretTop.x,
          this.turretTop.y,
          playerSprite.x,
          playerSprite.y
        );

        // Setze die Rotation des oberen Teils (plus 180°, da das Sprite nach rechts zeigt)
        this.turretTop.rotation = angle + Math.PI; // Füge 180 Grad (π) hinzu
      }
    }
  }

  /**
   * Wird aufgerufen, wenn der Gegner zerstört wird
   * Überschreibt die Methode aus BaseEnemy
   */
  protected onDestroy(): void {
    // Zerstöre den oberen Teil des Turms
    if (this.turretTop) {
      console.log(
        `[TURRET] Zerstöre turretTop in onDestroy an Position (${this.turretTop.x}, ${this.turretTop.y})`
      );
      this.turretTop.destroy();
      this.turretTop = null;
    }

    // Rufe die Basisimplementierung für die Zerstörung auf
    super.onDestroy();
  }

  /**
   * Lässt den Turm Schaden nehmen
   */
  takeDamage(amount: number): boolean {
    const result = super.takeDamage(amount);

    // Visuelles Feedback bei Schaden auch auf dem oberen Teil
    if (this.turretTop && this.turretTop.active && this.visualComponent) {
      // Kurzen Tint-Effekt auf dem oberen Teil anwenden
      this.scene.tweens.add({
        targets: this.turretTop,
        alpha: 0.7,
        duration: 100,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }

    return result;
  }
}
