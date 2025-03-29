import { Constants } from '../utils/constants';
import { EventBus, EventType } from '../utils/eventBus';
import { Asteroid } from '../entities/environment/asteroidEntity';
import { EnergyPickup } from '../entities/pickups/energyPickup';
import { PowerPickup } from '../entities/pickups/powerPickup';

/**
 * SpawnManager-Klasse
 * Verwaltet die Generierung von Spielelementen wie Asteroiden und Pickups
 */
export class SpawnManager {
  private scene: Phaser.Scene;
  private asteroidSpawnTimer: Phaser.Time.TimerEvent;
  private pickupSpawnTimer: Phaser.Time.TimerEvent;
  private asteroids: Asteroid[] = [];
  private pickups: EnergyPickup[] = [];
  private powerPickups: PowerPickup[] = [];
  private difficulty: number = 1;
  private eventBus: EventBus;
  private isPaused: boolean = false;
  private lastUpdateTime: number = 0;
  private maxAsteroids: number = 5; // Maximale Anzahl an Asteroiden von 10 auf 5 reduziert
  private maxPickups: number = 3; // Maximale Anzahl an Pickups
  private maxPowerPickups: number = 1; // Maximale Anzahl an Power-Pickups

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();

    // Event-Listener registrieren
    this.eventBus.on(EventType.DIFFICULTY_CHANGED, this.onDifficultyIncrease);
    this.eventBus.on(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.on(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.on(EventType.GAME_OVER, this.stopSpawning);
    this.eventBus.on('CREATE_SMALL_ASTEROID', this.spawnSmallAsteroid);
    this.eventBus.on('CREATE_ENERGY_PICKUP', this.spawnEnergyPickupAtPosition);
    this.eventBus.on('CREATE_POWER_PICKUP', this.spawnPowerPickupAtPosition);

    // Starte Spawn-Timer
    this.startSpawnTimers();
  }

  /**
   * Startet die Spawn-Timer
   */
  private startSpawnTimers(): void {
    // Timer für Asteroiden
    this.asteroidSpawnTimer = this.scene.time.addEvent({
      delay: Constants.SPAWN_RATE_ASTEROID,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true
    });

    // Timer für Pickups (längere Verzögerung als Asteroiden)
    this.pickupSpawnTimer = this.scene.time.addEvent({
      delay: Constants.SPAWN_RATE_ASTEROID * 3, // Dreimal seltener als Asteroiden
      callback: this.spawnPickup,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Spawnt einen Asteroiden
   */
  private spawnAsteroid = (): void => {
    if (this.isPaused) return;
    
    // Begrenze die Anzahl der Asteroiden für bessere Performance
    if (this.asteroids.length >= this.maxAsteroids) return;
    
    const x = this.scene.scale.width + 50;
    const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
    
    // Bevorzuge große Asteroiden statt kleine (Umgekehrt)
    const size = Math.random() > 0.7 ? 'small' : 'large';
    
    const asteroid = new Asteroid(
      this.scene, 
      x, 
      y, 
      size
    );
    
    this.asteroids.push(asteroid);
  }

  /**
   * Spawnt ein Pickup
   */
  private spawnPickup = (): void => {
    if (this.isPaused) return;
    
    // Spawne seltener und begrenzt für bessere Performance
    if (Math.random() > Constants.ENERGY_PICKUP_SPAWN_CHANCE || this.pickups.length >= this.maxPickups) return;
    
    const x = this.scene.scale.width + 50;
    const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
    
    const pickup = new EnergyPickup(this.scene, x, y);
    this.pickups.push(pickup);
  }

  /**
   * Erstellt einen kleinen Asteroid an der angegebenen Position
   */
  private spawnSmallAsteroid = (data: {x: number, y: number}): void => {
    if (this.isPaused) return;
    
    // Begrenze die Anzahl der Asteroiden für bessere Performance
    if (this.asteroids.length >= this.maxAsteroids + 3) return;
    
    const asteroid = new Asteroid(
      this.scene, 
      data.x, 
      data.y, 
      'small'
    );
    
    this.asteroids.push(asteroid);
  }

  /**
   * Aktualisiert alle gespawnten Objekte
   */
  public update(time: number, delta: number): void {
    if (this.isPaused) return;
    
    // Performance-Optimierung: Überspringe Frames bei Bedarf
    const updateInterval = 1000 / 30; // Ziel: 30 Updates pro Sekunde
    if (time - this.lastUpdateTime < updateInterval && this.lastUpdateTime > 0) {
      return;
    }
    this.lastUpdateTime = time;
    
    // Aktualisiere Asteroiden
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      
      if (asteroid.getSprite().active) {
        asteroid.update(time, delta);
        
        // Entferne Asteroiden, die den Bildschirm verlassen haben
        if (asteroid.getSprite().x < -100) {
          asteroid.destroy();
          this.asteroids.splice(i, 1);
        }
      } else {
        // Entferne zerstörte Asteroiden aus dem Array
        this.asteroids.splice(i, 1);
      }
    }
    
    // Aktualisiere Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      
      if (pickup.getSprite().active) {
        pickup.update(time, delta);
        
        // Entferne Pickups, die den Bildschirm verlassen haben
        if (pickup.getSprite().x < -50) {
          pickup.destroy();
          this.pickups.splice(i, 1);
        }
      } else {
        // Entferne aufgesammelte Pickups aus dem Array
        this.pickups.splice(i, 1);
      }
    }

    // Aktualisiere alle Power-Pickups
    this.powerPickups = this.powerPickups.filter(pickup => {
      if (pickup.getSprite().active) {
        pickup.update(time, delta);
        return true;
      }
      return false;
    });
  }

  /**
   * Reagiert auf Erhöhung des Schwierigkeitsgrads
   */
  private onDifficultyIncrease = (newDifficulty: number): void => {
    this.difficulty = newDifficulty;
    
    // Erhöhe die maximale Anzahl der Asteroiden abhängig vom Schwierigkeitsgrad, aber weniger als vorher
    this.maxAsteroids = 4 + newDifficulty;
    
    // Erhöhe die Spawn-Rate für Asteroiden
    const newAsteroidRate = Constants.SPAWN_RATE_ASTEROID * Math.pow(0.7, newDifficulty - 1);
    this.asteroidSpawnTimer.reset({
      delay: newAsteroidRate,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Pausiert das Spawnen
   */
  private pauseSpawning = (): void => {
    this.isPaused = true;
    this.asteroidSpawnTimer.paused = true;
    this.pickupSpawnTimer.paused = true;
  }

  /**
   * Setzt das Spawnen fort
   */
  private resumeSpawning = (): void => {
    this.isPaused = false;
    this.asteroidSpawnTimer.paused = false;
    this.pickupSpawnTimer.paused = false;
  }

  /**
   * Stoppt das Spawnen
   */
  private stopSpawning = (): void => {
    this.isPaused = true;
    this.asteroidSpawnTimer.remove();
    this.pickupSpawnTimer.remove();
  }

  /**
   * Zerstört alle Objekte
   */
  public destroyAllObjects(): void {
    // Zerstöre alle Asteroiden
    for (const asteroid of this.asteroids) {
      asteroid.destroy();
    }
    this.asteroids = [];
    
    // Zerstöre alle Pickups
    for (const pickup of this.pickups) {
      pickup.destroy();
    }
    this.pickups = [];
  }

  /**
   * Gibt alle Asteroiden zurück
   */
  public getAllAsteroids(): Asteroid[] {
    return this.asteroids;
  }

  /**
   * Gibt alle aktiven Pickups zurück
   */
  public getAllPickups(): (EnergyPickup | PowerPickup)[] {
    return [...this.pickups, ...this.powerPickups];
  }

  /**
   * Zerstört ein bestimmtes Pickup
   */
  public destroyPickup(pickup: Phaser.GameObjects.GameObject): void {
    const pickupIndex = this.pickups.findIndex(p => p.getSprite() === pickup);
    if (pickupIndex !== -1) {
      const pickupToDestroy = this.pickups[pickupIndex];
      pickupToDestroy.destroy();
      this.pickups.splice(pickupIndex, 1);
    }
  }

  /**
   * Gibt den EnemyManager zurück
   */
  public getEnemyManager(): any {
    return this.scene.registry.get('enemyManager');
  }

  /**
   * Bereinigt Ressourcen
   */
  public destroy(): void {
    console.log('SpawnManager wird zerstört');
    
    // Timer entfernen
    if (this.asteroidSpawnTimer) {
      this.asteroidSpawnTimer.remove();
    }
    
    if (this.pickupSpawnTimer) {
      this.pickupSpawnTimer.remove();
    }
    
    this.destroyAllObjects();
    
    // Zerstöre alle Power-Pickups
    this.powerPickups.forEach(pickup => {
      pickup.destroy();
    });
    this.powerPickups = [];
    
    // Entferne Event-Listener
    this.eventBus.off(EventType.DIFFICULTY_CHANGED, this.onDifficultyIncrease);
    this.eventBus.off(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.off(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.off(EventType.GAME_OVER, this.stopSpawning);
    this.eventBus.off('CREATE_SMALL_ASTEROID', this.spawnSmallAsteroid);
    this.eventBus.off('CREATE_ENERGY_PICKUP', this.spawnEnergyPickupAtPosition);
    this.eventBus.off('CREATE_POWER_PICKUP', this.spawnPowerPickupAtPosition);
  }

  /**
   * Zerstört einen bestimmten Asteroiden
   */
  public destroyAsteroid(asteroidSprite: Phaser.GameObjects.GameObject): void {
    if (!asteroidSprite || !asteroidSprite.active) return;
    
    const asteroidIndex = this.asteroids.findIndex(a => a.getSprite() === asteroidSprite);
    if (asteroidIndex !== -1) {
      const asteroid = this.asteroids[asteroidIndex];
      
      // Entferne zuerst aus dem Array, um doppelte Entfernung zu vermeiden
      this.asteroids.splice(asteroidIndex, 1);
      
      // Dann zerstöre das Objekt (löst onDestroy aus)
      asteroid.destroy();
    }
  }

  /**
   * Fügt einem Asteroiden Schaden zu
   * @returns true wenn der Asteroid zerstört wurde, false sonst
   */
  public damageAsteroid(asteroidSprite: Phaser.GameObjects.GameObject): boolean {
    if (!asteroidSprite || !asteroidSprite.active) return false;
    
    const asteroidIndex = this.asteroids.findIndex(a => a.getSprite() === asteroidSprite);
    if (asteroidIndex !== -1) {
      const asteroid = this.asteroids[asteroidIndex];
      
      // Reduziere die Gesundheit des Asteroiden
      const isDestroyed = asteroid.takeDamage(Constants.BULLET_DAMAGE);
      
      if (isDestroyed) {
        // Bei Zerstörung aus dem Array entfernen
        this.asteroids.splice(asteroidIndex, 1);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Erstellt ein EnergyPickup an der angegebenen Position
   */
  private spawnEnergyPickupAtPosition = (data: {x: number, y: number}): void => {
    console.log('SpawnManager: spawnEnergyPickupAtPosition aufgerufen mit Position:', data);
    
    if (this.isPaused) {
      console.log('SpawnManager: Spawning ist pausiert, kein Pickup erzeugt');
      return;
    }
    
    // Begrenze die Anzahl der Pickups für bessere Performance
    if (this.pickups.length >= this.maxPickups) {
      console.log('SpawnManager: Maximale Anzahl an Pickups erreicht:', this.pickups.length);
      return;
    }
    
    console.log('SpawnManager: Erzeuge neues EnergyPickup');
    const pickup = new EnergyPickup(this.scene, data.x, data.y);
    this.pickups.push(pickup);
  }

  /**
   * Erstellt ein PowerPickup an der angegebenen Position
   */
  private spawnPowerPickupAtPosition = (data: {x: number, y: number}): void => {
    console.log('SpawnManager: spawnPowerPickupAtPosition aufgerufen mit Position:', data);
    
    if (this.isPaused) {
      console.log('SpawnManager: Spawning ist pausiert, kein Power-Pickup erzeugt');
      return;
    }
    
    // Begrenze die Anzahl der Power-Pickups für bessere Performance
    if (this.powerPickups.length >= this.maxPowerPickups) {
      console.log('SpawnManager: Maximale Anzahl an Power-Pickups erreicht:', this.powerPickups.length);
      return;
    }
    
    console.log('SpawnManager: Erzeuge neues PowerPickup');
    const pickup = new PowerPickup(this.scene, data.x, data.y);
    this.powerPickups.push(pickup);
  }
} 