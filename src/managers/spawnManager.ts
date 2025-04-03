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
  private minAsteroids: number = 2; // Minimale Anzahl an Asteroiden
  private maxAsteroids: number = 5; // Maximale Anzahl an Asteroiden
  private maxPickups: number = 3; // Maximale Anzahl an Pickups
  private maxPowerPickups: number = 1; // Maximale Anzahl an Power-Pickups
  private asteroidSpawnRate: number = Constants.SPAWN_RATE_ASTEROID;

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
      delay: this.asteroidSpawnRate,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true
    });

    // Timer für Pickups (längere Verzögerung als Asteroiden)
    this.pickupSpawnTimer = this.scene.time.addEvent({
      delay: this.asteroidSpawnRate * 3, // Dreimal seltener als Asteroiden
      callback: this.spawnPickup,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Stoppt und startet den Asteroiden-Timer neu mit der angegebenen Rate
   */
  public setAsteroidSpawnRate(rate: number): void {
    this.asteroidSpawnRate = rate;
    
    // Stoppe den aktuellen Timer
    if (this.asteroidSpawnTimer) {
      this.asteroidSpawnTimer.remove();
    }
    
    // Starte einen neuen Timer mit der aktualisierten Rate
    this.asteroidSpawnTimer = this.scene.time.addEvent({
      delay: this.asteroidSpawnRate,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true
    });
    
    console.log(`[SPAWN_MANAGER] Asteroid-Spawn-Rate auf ${rate}ms gesetzt`);
  }

  /**
   * Setzt die minimale Anzahl an Asteroiden
   */
  public setMinAsteroids(count: number): void {
    this.minAsteroids = count;
    console.log(`[SPAWN_MANAGER] Minimale Asteroidenanzahl auf ${count} gesetzt`);
  }

  /**
   * Setzt die maximale Anzahl an Asteroiden
   */
  public setMaxAsteroids(count: number): void {
    this.maxAsteroids = count;
    console.log(`[SPAWN_MANAGER] Maximale Asteroidenanzahl auf ${count} gesetzt`);
  }

  /**
   * Spawnt einen Asteroiden
   */
  private spawnAsteroid = (): void => {
    if (this.isPaused) return;
    
    // Prüfe, ob minimale Anzahl erreicht ist
    if (this.asteroids.length < this.minAsteroids) {
      const asteroid = this.createAsteroid();
      if (!asteroid) {
        console.warn('[SPAWN_MANAGER] Asteroid konnte nicht erstellt werden.');
      }
      return;
    }
    
    // Begrenze die Anzahl der Asteroiden für bessere Performance
    if (this.asteroids.length >= this.maxAsteroids) return;
    
    // Zufällig entscheiden, ob ein Asteroid erstellt wird
    if (Math.random() < 0.5) {
      const asteroid = this.createAsteroid();
      if (!asteroid) {
        console.warn('[SPAWN_MANAGER] Asteroid konnte nicht erstellt werden.');
      }
    }
  }

  /**
   * Erstellt einen neuen Asteroiden
   */
  private createAsteroid(data?: {x?: number, y?: number, size?: 'small' | 'large'}): Asteroid | null {
    if (!this.scene) {
      console.error('[SPAWN_MANAGER] Szene ist nicht verfügbar. Asteroid kann nicht erstellt werden.');
      return null;
    }
    
    try {
      const x = data?.x ?? this.scene.scale.width + 50;
      const y = data?.y ?? Phaser.Math.Between(100, this.scene.scale.height - 100);
      const size = data?.size ?? (Math.random() > 0.7 ? 'small' : 'large');
      
      const texture = size === 'large' ? Constants.ASSET_ASTEROID : Constants.ASSET_ASTEROID_SMALL;
      
      // Prüfe, ob die Textur verfügbar ist
      if (!this.scene.textures.exists(texture)) {
        console.error(`[SPAWN_MANAGER] Textur '${texture}' ist nicht verfügbar!`);
        return null;
      }
      
      const asteroid = new Asteroid(
        this.scene, 
        x, 
        y, 
        size
      );
      
      this.asteroids.push(asteroid);
      return asteroid;
    } catch (error) {
      console.error('[SPAWN_MANAGER] Fehler beim Erstellen eines Asteroiden:', error);
      return null;
    }
  }

  /**
   * Spawnt ein Pickup
   */
  private spawnPickup = (): void => {
    if (this.isPaused) return;
    
    // Spawne seltener und begrenzt für bessere Performance
    if (Math.random() > Constants.ENERGY_PICKUP_SPAWN_CHANCE || this.pickups.length >= this.maxPickups) return;
    
    this.spawnEnergyPickup(this.scene.scale.width + 50, Phaser.Math.Between(100, this.scene.scale.height - 100));
  }

  /**
   * Spawnt ein EnergyPickup an den angegebenen Koordinaten
   */
  public spawnEnergyPickup(x: number, y: number): EnergyPickup {
    if (this.isPaused) {
      console.log('[SPAWN_MANAGER] Spawning ist pausiert, kein Pickup erzeugt');
      return null;
    }
    
    // Begrenze die Anzahl der Pickups für bessere Performance
    if (this.pickups.length >= this.maxPickups) {
      console.log('[SPAWN_MANAGER] Maximale Anzahl an Pickups erreicht:', this.pickups.length);
      return null;
    }
    
    console.log('[SPAWN_MANAGER] Erzeuge neues EnergyPickup');
    const pickup = new EnergyPickup(this.scene, x, y);
    this.pickups.push(pickup);
    return pickup;
  }

  /**
   * Spawnt ein PowerPickup an den angegebenen Koordinaten
   */
  public spawnPowerPickup(x: number, y: number): PowerPickup {
    if (this.isPaused) {
      console.log('[SPAWN_MANAGER] Spawning ist pausiert, kein Power-Pickup erzeugt');
      return null;
    }
    
    // Begrenze die Anzahl der Power-Pickups für bessere Performance
    if (this.powerPickups.length >= this.maxPowerPickups) {
      console.log('[SPAWN_MANAGER] Maximale Anzahl an Power-Pickups erreicht:', this.powerPickups.length);
      return null;
    }
    
    console.log('[SPAWN_MANAGER] Erzeuge neues PowerPickup');
    const pickup = new PowerPickup(this.scene, x, y);
    this.powerPickups.push(pickup);
    return pickup;
  }

  /**
   * Erstellt einen kleinen Asteroid an der angegebenen Position
   */
  private spawnSmallAsteroid = (data: {x: number, y: number}): void => {
    if (this.isPaused) return;
    
    try {
      // Sicherheitsüberprüfung für null/undefined Werte
      if (!data || typeof data !== 'object') {
        console.warn('[SPAWN_MANAGER] Ungültige Daten für kleinen Asteroiden:', data);
        return;
      }
      
      if (data.x === undefined || data.y === undefined || isNaN(data.x) || isNaN(data.y)) {
        console.warn('[SPAWN_MANAGER] Ungültige Koordinaten für kleinen Asteroiden:', data);
        return;
      }
      
      // Begrenze die Anzahl der Asteroiden für bessere Performance
      if (this.asteroids.length >= this.maxAsteroids + 3) return;
      
      // Verwende einen sicheren Bereich auf dem Bildschirm
      const safeX = Math.max(50, Math.min(data.x, this.scene.scale.width - 50));
      const safeY = Math.max(50, Math.min(data.y, this.scene.scale.height - 50));
      
      const asteroid = this.createAsteroid({
        x: safeX,
        y: safeY,
        size: 'small'
      });
      
      if (!asteroid) {
        console.warn('[SPAWN_MANAGER] Kleiner Asteroid konnte nicht erstellt werden.');
      }
    } catch (error) {
      console.error('[SPAWN_MANAGER] Fehler beim Erstellen des kleinen Asteroiden:', error);
    }
  }

  /**
   * Reagiert auf Erhöhung des Schwierigkeitsgrads
   */
  private onDifficultyIncrease = (data: any): void => {
    const newDifficulty = typeof data === 'object' ? data.difficulty : data;
    this.difficulty = newDifficulty;
    
    // Erhöhe die maximale Anzahl der Asteroiden abhängig vom Schwierigkeitsgrad, aber weniger als vorher
    this.maxAsteroids = 4 + newDifficulty;
    
    // Erhöhe die Spawn-Rate für Asteroiden
    const newAsteroidRate = Constants.SPAWN_RATE_ASTEROID * Math.pow(0.7, newDifficulty - 1);
    this.setAsteroidSpawnRate(newAsteroidRate);
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
   * Erstellt ein EnergyPickup an der angegebenen Position
   */
  private spawnEnergyPickupAtPosition = (data: {x: number, y: number}): void => {
    console.log('SpawnManager: spawnEnergyPickupAtPosition aufgerufen mit Position:', data);
    this.spawnEnergyPickup(data.x, data.y);
  }

  /**
   * Erstellt ein PowerPickup an der angegebenen Position
   */
  private spawnPowerPickupAtPosition = (data: {x: number, y: number}): void => {
    console.log('SpawnManager: spawnPowerPickupAtPosition aufgerufen mit Position:', data);
    this.spawnPowerPickup(data.x, data.y);
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
    
    // Zerstöre alle Power-Pickups
    this.powerPickups.forEach(pickup => {
      pickup.destroy();
    });
    this.powerPickups = [];
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
   * Fügt einem Asteroiden Schaden zu und zerstört ihn, wenn seine Gesundheit 0 erreicht
   * @param asteroid Der Asteroid, dem Schaden zugefügt werden soll
   * @returns True, wenn der Asteroid zerstört wurde, andernfalls false
   */
  public damageAsteroid(asteroid: Phaser.Physics.Arcade.Sprite): boolean {
    if (!asteroid || !asteroid.active || !asteroid.data) {
      console.warn('[SPAWN_MANAGER] Versuch, einem ungültigen Asteroiden Schaden zuzufügen');
      return false;
    }
    
    try {
      // Hole die aktuelle Gesundheit und den Schaden aus dem Sprite-Data
      let currentHealth = asteroid.data.get('health');
      
      // Wenn keine Gesundheit gesetzt ist, verwende Standardwert
      if (currentHealth === undefined) {
        const size = asteroid.data.get('size') || 'large';
        currentHealth = size === 'large' ? Constants.ASTEROID_HEALTH : Constants.ASTEROID_HEALTH / 2;
        asteroid.setData('health', currentHealth);
      }
      
      // Standard-Bullet-Schaden verwenden, wenn nicht anders angegeben
      const bulletDamage = Constants.BULLET_DAMAGE;
      
      // Berechne neue Gesundheit
      const newHealth = currentHealth - bulletDamage;
      asteroid.setData('health', newHealth);
      
      // Wenn die Gesundheit unter 0 fällt, Asteroid zerstören
      if (newHealth <= 0) {
        console.log('[SPAWN_MANAGER] Asteroid hat keine Gesundheit mehr, wird zerstört');
        
        // Sicherstellen, dass asteroid.data vollständig initialisiert ist
        if (!asteroid.data.get('type')) {
          asteroid.setData('type', 'asteroid');
        }
        
        // Wir verwenden hier ein Event anstatt direkten Aufruf, da die Asteroid-Instanz
        // möglicherweise nicht direkt verfügbar ist (nur der Physics-Sprite)
        this.eventBus.emit('DESTROY_ASTEROID', asteroid);
        
        // Als Backup direkt destroyAsteroid aufrufen, um sicherzustellen, dass der Asteroid entfernt wird
        setTimeout(() => {
          if (asteroid && asteroid.active) {
            this.destroyAsteroid(asteroid);
          }
        }, 100);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[SPAWN_MANAGER] Fehler beim Beschädigen des Asteroiden:', error);
      return false;
    }
  }

  /**
   * Zerstört einen Asteroiden direkt
   * @param asteroid Der zu zerstörende Asteroid
   */
  public destroyAsteroid(asteroid: Phaser.Physics.Arcade.Sprite): void {
    if (!asteroid || !asteroid.active) {
      console.log('[SPAWN_MANAGER] Asteroid ist bereits inaktiv');
      return;
    }
    
    try {
      // Finde den Asteroiden in unserem Array
      const asteroidIndex = this.asteroids.findIndex(a => a.getSprite() === asteroid);
      
      if (asteroidIndex !== -1) {
        console.log('[SPAWN_MANAGER] Asteroid in Array gefunden, zerstöre über Instanz');
        // Zerstöre den Asteroiden direkt über seine Instanz
        this.asteroids[asteroidIndex].destroy();
        // Entferne ihn aus dem Array
        this.asteroids.splice(asteroidIndex, 1);
      } else {
        console.log('[SPAWN_MANAGER] Asteroid nicht in Array gefunden, zerstöre über Event');
        
        // Sicherstellen, dass das sprite.data-Objekt existiert, bevor wir das Event auslösen
        if (!asteroid.data) {
          asteroid.setData('type', 'asteroid');
        }
        
        // Löse das DESTROY_ASTEROID Event aus, um die Logik in der Asteroid-Klasse auszuführen
        this.eventBus.emit('DESTROY_ASTEROID', asteroid);
        
        // Als Fallback das Sprite direkt zerstören, falls das Event nicht verarbeitet wird
        setTimeout(() => {
          if (asteroid && asteroid.active) {
            console.log('[SPAWN_MANAGER] Fallback: Zerstöre Asteroid-Sprite direkt');
            asteroid.destroy();
          }
        }, 100);
      }
      
      console.log('[SPAWN_MANAGER] Asteroid wurde durch Kollision zerstört');
    } catch (error) {
      console.error('[SPAWN_MANAGER] Fehler beim Zerstören des Asteroiden:', error);
      
      // Letzer Versuch, das Sprite zu zerstören
      if (asteroid && asteroid.active) {
        asteroid.destroy();
      }
    }
  }
} 