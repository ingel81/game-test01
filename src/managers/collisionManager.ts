import { Scene, GameObjects, Physics } from 'phaser';
import { Player } from '../entities/player/player';
import { NewEnemyManager } from './newEnemyManager';
import { SpawnManager } from './spawnManager';
import { Constants } from '../utils/constants';
import { EventBus, EventType } from '../utils/eventBus';

/**
 * CollisionManager-Klasse
 * Verwaltet die Kollisionen zwischen Spielobjekten
 */
export class CollisionManager {
  private scene: Scene;
  private player: Player;
  private enemyManager: NewEnemyManager | null = null;
  private spawnManager: SpawnManager | null = null;
  private eventBus: EventBus;

  constructor(scene: Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Setzt die Manager für Kollisionen
   */
  public setManagers(enemyManager: NewEnemyManager, spawnManager: SpawnManager): void {
    this.enemyManager = enemyManager;
    this.spawnManager = spawnManager;
    this.setupCollisions();
  }

  /**
   * Richtet die Kollisionen ein
   */
  private setupCollisions(): void {
    if (!this.enemyManager || !this.spawnManager) return;

    // Dynamische Kollisionserkennung wird in der update-Methode durchgeführt
  }

  /**
   * Aktualisiert die Kollisionen
   */
  public update(time: number, delta: number): void {
    if (!this.enemyManager || !this.spawnManager) return;

    // Aktualisieren der Kollisionen für alle aktiven Feinde
    const enemies = this.enemyManager.getAllEnemies();
    const playerBullets = this.player.getBullets();
    const playerSprite = this.player.getSprite();
    
    // Überprüfe Kollisionen mit jedem Feind einzeln
    enemies.forEach(enemy => {
      const enemySprite = enemy.getSprite();
      if (enemySprite && enemySprite.active) {
        // Kollision zwischen Spieler und diesem Feind
        this.scene.physics.overlap(
          playerSprite,
          enemySprite,
          this.handlePlayerEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );
        
        // Kollision zwischen Spieler-Bullets und diesem Feind
        // Durchlaufe jede Spieler-Bullet einzeln für zuverlässigere Erkennung
        playerBullets.children.each((bullet: Phaser.GameObjects.GameObject) => {
          const b = bullet as Phaser.Physics.Arcade.Sprite;
          
          // Überprüfe, ob Bullet steht und aktualisiere ggf. die Geschwindigkeit
          if (b.active && b.body && b.body.velocity.x === 0 && b.body.velocity.y === 0) {
            b.setVelocity(Constants.BULLET_SPEED, 0);
          }
          
          // Einzelne Kollisionserkennung für jedes Projektil
          if (b.active) {
            this.scene.physics.overlap(
              b,
              enemySprite,
              this.handleBulletEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
              undefined,
              this
            );
          }
          
          return true;
        });
      }
    });

    // Aktualisieren der Kollisionen für alle aktiven Asteroiden
    const asteroids = this.spawnManager.getAllAsteroids();
    asteroids.forEach(asteroid => {
      const asteroidSprite = asteroid.getSprite();
      if (asteroidSprite && asteroidSprite.active) {
        // Kollision zwischen Spieler und Asteroiden
        this.scene.physics.overlap(
          playerSprite,
          asteroidSprite,
          this.handlePlayerAsteroidCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );
        
        // Kollision zwischen Spieler-Bullets und Asteroiden
        playerBullets.children.each((bullet: Phaser.GameObjects.GameObject) => {
          const b = bullet as Phaser.Physics.Arcade.Sprite;
          
          if (b.active) {
            this.scene.physics.overlap(
              b,
              asteroidSprite,
              this.handleBulletAsteroidCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
              undefined,
              this
            );
          }
          
          return true;
        });
      }
    });

    // Kollision zwischen Feind-Bullets und Spieler
    const enemyBullets = this.enemyManager.getBullets();
    
    // Durchlaufe jede feindliche Bullet einzeln, um Probleme mit der Gruppe zu vermeiden
    enemyBullets.children.each((bullet: Phaser.GameObjects.GameObject) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      
      // Überprüfe, ob Bullet steht und aktualisiere ggf. die Geschwindigkeit
      if (b.active && b.body && b.body.velocity.x === 0 && b.body.velocity.y === 0) {
        b.setVelocity(-Constants.BULLET_SPEED, 0);
      }
      
      // Einzelne Kollisionserkennung für jedes Projektil
      // Wichtig: Die Projektile verursachen auch dann Schaden, wenn der erzeugende Gegner bereits tot ist
      if (b.active) {
        this.scene.physics.overlap(
          b,
          playerSprite,
          this.handleEnemyBulletPlayerCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );
      }
      
      return true;
    });

    // Aktualisieren der Kollisionen für alle aktiven Pickups
    if (this.spawnManager) {
      const pickups = this.spawnManager.getAllPickups();
      pickups.forEach(pickup => {
        const pickupSprite = pickup.getSprite();
        if (pickupSprite && pickupSprite.active) {
          this.scene.physics.overlap(
            playerSprite,
            pickupSprite,
            this.handlePlayerPickupCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
          );
        }
      });
    }
  }

  /**
   * Behandelt die Kollision zwischen Spieler und Feinden
   */
  private handlePlayerEnemyCollision(player: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject): void {
    if (!this.enemyManager || !player || !enemy) return;
    if (!player.active || !enemy.active) return;
    
    console.log('Kollision: Spieler trifft Feind');
    
    // Spieler nimmt Schaden
    this.player.takeDamage(Constants.DAMAGE.ENEMY_COLLISION);
    
    // Feind wird zerstört
    this.enemyManager.destroyEnemy(enemy);
    
    // Emit event für Punktzahl und UI-Updates
    this.eventBus.emit(EventType.ENEMY_DESTROYED);
    
    // Explosionseffekt an der Kollisionsstelle
    const playerSprite = player as Phaser.Physics.Arcade.Sprite;
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
    const x = (playerSprite.x + enemySprite.x) / 2;
    const y = (playerSprite.y + enemySprite.y) / 2;
    this.createExplosion(x, y);
  }

  /**
   * Behandelt die Kollision zwischen Spieler-Bullets und Feinden
   */
  private handleBulletEnemyCollision(bullet: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject): void {
    if (!this.enemyManager || !bullet || !enemy) return;
    if (!bullet.active || !enemy.active) return;
    
    // Hole den Schaden des Projektils (Standard ist Constants.BULLET_DAMAGE)
    const damage = bullet.getData('damage') || Constants.BULLET_DAMAGE;
    
    // Entferne das Projektil
    bullet.destroy();
    
    // Feind nimmt Schaden (anstatt direkt zu zerstören)
    const enemyInstance = (enemy as Phaser.Physics.Arcade.Sprite).getData('instance');
    if (enemyInstance && typeof enemyInstance.takeDamage === 'function') {
      // Der Rückgabewert von takeDamage ist true, wenn der Feind zerstört wurde
      const wasDestroyed = enemyInstance.takeDamage(damage);
      
      // Nur ein Event auslösen, wenn der Feind zerstört wurde
      if (wasDestroyed) {
        // Emit event für Punktzahl
        this.eventBus.emit(EventType.ENEMY_DESTROYED);
        
        // Explosionseffekt
        const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
        this.createExplosion(enemySprite.x, enemySprite.y);
      } else {
        // Kleiner Treffereffekt, wenn der Feind nur Schaden nimmt
        const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
        this.createExplosion(enemySprite.x, enemySprite.y, 0.3);
      }
    } else {
      // Fallback für den Fall, dass der Feind keine takeDamage-Methode hat
      this.enemyManager.destroyEnemy(enemy);
      this.eventBus.emit(EventType.ENEMY_DESTROYED);
      
      // Explosionseffekt
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
      this.createExplosion(enemySprite.x, enemySprite.y);
    }
  }

  /**
   * Behandelt die Kollision zwischen Feind-Bullets und Spieler
   */
  private handleEnemyBulletPlayerCollision(bullet: Phaser.GameObjects.GameObject, player: Phaser.GameObjects.GameObject): void {
    if (!bullet || !player) return;
    if (!bullet.active || !player.active) return;
    
    console.log('Kollision: Feindlicher Schuss trifft Spieler');
    
    // Entferne das Projektil
    bullet.destroy();
    
    // Spieler nimmt Schaden
    this.player.takeDamage(Constants.DAMAGE.ENEMY_BULLET);
    
    // Visuelles Feedback durch kleine Explosion
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    this.createExplosion(bulletSprite.x, bulletSprite.y, 0.5);
  }
  
  /**
   * Erzeugt eine Explosion an der angegebenen Position
   */
  private createExplosion(x: number, y: number, scale: number = 1.0): void {
    // Hauptexplosion
    const explosion = this.scene.add.sprite(x, y, Constants.ASSET_EXPLOSION_1);
    explosion.setScale(scale);
    explosion.play('explode');
    explosion.once('animationcomplete', () => {
      explosion.destroy();
    });
    
    // Bei größeren Explosionen zusätzliche Explosionseffekte hinzufügen
    if (scale >= 1.0) {
      // Erstelle mehrere zusätzliche Explosionen für einen mächtigeren Effekt
      const extraExplosionsCount = scale >= 2.0 ? 4 : 2;
      
      for (let i = 0; i < extraExplosionsCount; i++) {
        const offsetX = Phaser.Math.Between(-30 * scale, 30 * scale);
        const offsetY = Phaser.Math.Between(-30 * scale, 30 * scale);
        const extraScale = Phaser.Math.FloatBetween(0.5, 0.8) * scale;
        
        const extraExplosion = this.scene.add.sprite(
          x + offsetX,
          y + offsetY,
          Constants.ASSET_EXPLOSION_1
        );
        extraExplosion.setScale(extraScale);
        extraExplosion.play('explode');
        extraExplosion.once('animationcomplete', () => {
          extraExplosion.destroy();
        });
      }
      
      // Bildschirmflash bei großen Explosionen
      if (scale >= 2.0) {
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xff0000, 0.3);
        flash.setScrollFactor(0);
        flash.setDepth(1000);
        flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        
        this.scene.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 100,
          ease: 'Power2',
          onComplete: () => flash.destroy()
        });
      }
    }
    
    // Sound mit angepasster Lautstärke und Rate basierend auf Explosionsgrößee
    this.scene.sound.play(Constants.SOUND_EXPLOSION, {
      volume: 0.3 * Math.min(scale, 2.0),
      rate: 1.0 / (scale * 0.5 + 0.5)  // Größere Explosionen haben tieferen Ton
    });
  }

  /**
   * Behandelt die Kollision zwischen Spieler und Pickups (Energie und Power)
   */
  private handlePlayerPickupCollision(player: Phaser.GameObjects.GameObject, pickup: Phaser.GameObjects.GameObject): void {
    if (!player || !pickup || !this.spawnManager) return;
    if (!player.active || !pickup.active) return;
    
    // Finde das entsprechende GameObject aus dem SpawnManager
    const allPickups = this.spawnManager.getAllPickups();
    const pickupObject = allPickups.find(p => p.getSprite() === pickup);
    
    if (pickupObject) {
      // Rufe die collect-Methode des Pickups auf
      pickupObject.collect();
    }
  }

  /**
   * Behandelt die Kollision zwischen Spieler und Asteroiden
   */
  private handlePlayerAsteroidCollision(player: Phaser.GameObjects.GameObject, asteroid: Phaser.GameObjects.GameObject): void {
    if (!this.spawnManager || !player || !asteroid) return;
    if (!player.active || !asteroid.active) return;
    
    console.log('Kollision: Spieler trifft Asteroid');
    
    // Spieler nimmt Schaden (mehr als bei normalen Feinden)
    this.player.takeDamage(15);
    
    // Asteroid wird zerstört - Explosionseffekt wird in der Asteroid-Klasse erstellt
    this.spawnManager.destroyAsteroid(asteroid);
    
    // Bildschirmflash bei Kollision
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xff0000, 0.3);
    flash.setScrollFactor(0);
    flash.setDepth(1000);
    flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  /**
   * Behandelt die Kollision zwischen Spieler-Bullets und Asteroiden
   */
  private handleBulletAsteroidCollision(bullet: Phaser.GameObjects.GameObject, asteroid: Phaser.GameObjects.GameObject): void {
    if (!this.spawnManager || !bullet || !asteroid) return;
    if (!bullet.active || !asteroid.active) return;
    
    console.log('Kollision: Spielerschuss trifft Asteroid');
    
    // Entferne das Projektil
    bullet.destroy();
    
    // Asteroid nimmt Schaden
    const handled = this.spawnManager.damageAsteroid(asteroid);
    
    // Hinweis: Die Explosion wird automatisch in der Asteroid.onDestroy() Methode erstellt,
    // wenn der Asteroid zerstört wird. Wir brauchen hier keine zusätzliche Explosion.
    if (!handled) {
      // Nur wenn der Asteroid nicht zerstört wurde, zeigen wir einen kleinen Treffer-Effekt
      const asteroidSprite = asteroid as Phaser.Physics.Arcade.Sprite;
      const size = asteroidSprite.getData('size') || 'large';
      const scale = (size === 'large') ? 0.5 : 0.3;
      
      // Kleine Trefferexplosion
      const hit = this.scene.add.sprite(asteroidSprite.x, asteroidSprite.y, Constants.ASSET_EXPLOSION_1);
      hit.setScale(scale);
      hit.play('explode');
      hit.once('animationcomplete', () => {
        hit.destroy();
      });
    }
  }
} 