/**
 * TurretEnemy-Klasse
 * Ein stationärer Geschützturm mit drehbarem Aufsatz und gezieltem Schussverhalten
 */

import { BaseEnemy, EnemyConfig } from "./baseEnemy";
import { Player } from "../player/player";
import { Constants } from "../../utils/constants";
import { MovementPattern, MovementConfig } from "./components/movementComponent";
import { ShootingPattern, WeaponComponent, WeaponConfig } from "./components/weaponComponent";
import { VisualConfig } from "./components/visualComponent";
import { EventBus } from "../../utils/eventBus";
import { BulletFactory } from "../../factories/BulletFactory";
import { AssetManager, AssetKey } from "../../utils/assetManager";
import { MovementComponent } from "./components/movementComponent";
import { VisualComponent } from "./components/visualComponent";

export class TurretEnemy extends BaseEnemy {
  // Statischer Klassenname, der im Build erhalten bleibt
  public static enemyType = "TurretEnemy";

  // Spezifische Eigenschaften für den Turm
  private turretBase: Phaser.Physics.Arcade.Sprite;
  private turretTop: Phaser.GameObjects.Sprite;
  private lastFireTime: number = 0;
  private fireRate: number = 1500; // Standard-Feuerrate
  private activeBarrel: number = 0; // Welcher Lauf als nächstes feuert (0 oder 1)
  private barrelOffsetX: number = 15; // Horizontaler Abstand zwischen den Läufen
  private barrelOffsetY: number = 7; // Vertikaler Abstand zwischen den Läufen

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Asset-Manager holen
    const assetManager = AssetManager.getInstance();

    // Konfiguration für den Geschützturm
    const config: EnemyConfig = {
      texture: assetManager.getKey(AssetKey.TURRET_BASE),
      health: 100,
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

    // Feuerrate speichern
    this.fireRate = config.fireRate;

    // Erstelle den oberen Teil des Turms
    this.turretTop = scene.add.sprite(
      x,
      y,
      assetManager.getKey(AssetKey.TURRET_TOP)
    );
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
        // und der Turm zum Spieler zeigen soll, nicht von ihm weg
        this.turretTop.rotation = angle + Math.PI; // Füge 180 Grad (π) hinzu

        // Eigenes Schussverhalten basierend auf der Rotation
        this.fireTurret(time);
      }
    }
  }

  /**
   * Überschreibt das Standard-Schussverhalten mit turretspezifischem Verhalten
   */
  private fireTurret(time: number): void {
    // Überprüfe die Feuerrate
    if (time > this.lastFireTime + this.fireRate) {


      this.lastFireTime = time;

      // Die Richtung zum Spieler
      const firingAngle = this.turretTop.rotation - Math.PI;


      // Bestimme, welcher Lauf als nächstes feuern soll
      this.activeBarrel = this.activeBarrel === 0 ? 1 : 0;

      // Berechne Offset für den aktuellen Lauf
      // Die Läufe sind horizontal nebeneinander, daher rotieren wir den Offset
      const barrelOffsetX =
        this.activeBarrel === 0 ? this.barrelOffsetX : -this.barrelOffsetX;
      const barrelOffsetY =
        this.activeBarrel === 0 ? this.barrelOffsetY : -this.barrelOffsetY;

      // Rotiere den Lauf-Offset entsprechend der Turm-Rotation
      const rotatedOffsetX =
        barrelOffsetX * Math.cos(firingAngle) -
        barrelOffsetY * Math.sin(firingAngle);
      const rotatedOffsetY =
        barrelOffsetX * Math.sin(firingAngle) +
        barrelOffsetY * Math.cos(firingAngle);

      // Berechne die Position, von der aus geschossen wird (relativ zum Turm)
      const barrelLength = 40; // Länge der Läufe vom Drehpunkt aus
      const startX =
        this.turretTop.x +
        Math.cos(firingAngle) * barrelLength +
        rotatedOffsetX;
      const startY =
        this.turretTop.y +
        Math.sin(firingAngle) * barrelLength +
        rotatedOffsetY;

      // Erstelle einen Schuss mit der BulletFactory
      const bulletFactory = BulletFactory.getInstance(this.scene);
      bulletFactory.createTurretBullet(startX, startY, firingAngle);

      // Sound-Effekt
      this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
        volume: 0.2,
      });

      // Visuelles Feedback: kurzes Aufleuchten beim Schießen
      this.scene.tweens.add({
        targets: this.turretTop,
        alpha: 0.8,
        duration: 50,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
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

  protected initComponents(config: EnemyConfig): void {
    // Erstelle Bewegungskomponente wie gewohnt
    const movementConfig: MovementConfig = config.movement || {
      pattern: this.getRandomMovementPattern(),
      speed: this.speed,
      baseVelocityX: -100 - Math.random() * 50,
      changePatternRandomly: true,
      patternChangeInterval: 4000 + Math.random() * 2000
    };
    
    this.movementComponent = new MovementComponent(
      this.scene, 
      this.sprite, 
      this.player, 
      movementConfig
    );
    
    // Erstelle eine Dummy-Waffen-Komponente, die nichts tut
    // Dies verhindert, dass die Standard-Waffenkomponente mit unserer eigenen Schusslogik in Konflikt gerät
    const dummyWeaponConfig: WeaponConfig = {
      pattern: 'single',
      fireRate: 99999999, // Extrem hohe Feuerrate, sodass sie praktisch nie feuert
      targetPlayer: false
    };
    
    // Echte Komponente erstellen, aber mit einer Override-Methode für update
    this.weaponComponent = new WeaponComponent(
      this.scene,
      this.sprite,
      this.player,
      dummyWeaponConfig
    );
    
    // Override der update-Methode, um sicherzustellen, dass sie nichts tut
    const originalUpdate = this.weaponComponent.update;
    this.weaponComponent.update = () => {
      // Tue nichts - wir verwenden unsere eigene fireTurret-Methode
      console.log("[TURRET] Überspringe WeaponComponent-Update, verwende eigene Schusslogik");
    };
    
    // Erstelle visuelle Komponente wie gewohnt
    const visualConfig: VisualConfig = config.visual || {
      tint: 0xFFFFFF,
      scale: 1,
      hitEffectDuration: 150
    };
    
    this.visualComponent = new VisualComponent(
      this.scene, 
      this.sprite, 
      visualConfig
    );
  }
}
