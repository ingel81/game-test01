/**
 * LevelManager
 * Verwaltet die Level, deren Progression und Konfiguration
 */

import { EventBus, EventType } from '../utils/eventBus';
import { LevelConfig, Wave, PickupType, FormationType } from '../config/levelConfig';
import { GameLevels } from '../config/gameLevels';
import { GameScene } from '../scenes/gameScene';
import { MusicManager } from './musicManager';
import { SpawnManager } from './spawnManager';
import { NewEnemyManager } from './enemyManager';
import { BaseEnemy } from '../entities/enemies/baseEnemy';

/**
 * Enum für die möglichen Zustände des LevelManagers
 */
export enum LevelState {
  INACTIVE = 'inactive',      // Level noch nicht gestartet
  RUNNING = 'running',        // Level läuft normal
  PAUSED = 'paused',          // Level ist pausiert
  ENDING = 'ending',          // Level-Ende wurde eingeleitet
  COMPLETED = 'completed'     // Level ist vollständig abgeschlossen
}

export class LevelManager {
  private scene: GameScene;
  private eventBus: EventBus;
  private enemyManager: NewEnemyManager;
  private spawnManager: SpawnManager;
  private musicManager: MusicManager;
  
  private currentLevel: LevelConfig | null = null;
  private currentLevelIndex: number = 0;
  private waveTimers: Phaser.Time.TimerEvent[] = [];
  private timedSpawnTimers: Phaser.Time.TimerEvent[] = [];
  private timedPickupTimers: Phaser.Time.TimerEvent[] = [];
  private bossTimer: Phaser.Time.TimerEvent | null = null;
  private endCheckTimer: Phaser.Time.TimerEvent | null = null;
  
  // Der aktuelle Zustand des Levels
  private currentState: LevelState = LevelState.INACTIVE;
  
  // Für Rückwärtskompatibilität behalten wir diese Flags bei, 
  // nutzen aber intern den neuen State für bessere Zustandsverwaltung
  private isPaused: boolean = false;
  private levelCompleted: boolean = false;
  private levelEndingInProgress: boolean = false;
  
  private levelIntroShown: boolean = false;
  private pendingWaves: Wave[] = [];
  private currentWaveIndex: number = 0;
  private allWavesSpawned: boolean = false;
  
  constructor(scene: GameScene, enemyManager: NewEnemyManager, spawnManager: SpawnManager) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    this.enemyManager = enemyManager;
    this.spawnManager = spawnManager;
    this.musicManager = MusicManager.getInstance();
    
    // Event-Listener registrieren
    this.eventBus.on(EventType.PAUSE_GAME, this.pauseLevel);
    this.eventBus.on(EventType.RESUME_GAME, this.resumeLevel);
    this.eventBus.on(EventType.GAME_OVER, this.stopLevel);
    this.eventBus.on(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
  }
  
  /**
   * Setzt den Zustand des Level-Managers
   * @param newState Der neue Zustand
   */
  private setState(newState: LevelState): void {
    // Keine Änderung, wenn gleicher Zustand
    if (this.currentState === newState) return;
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    console.log(`[LEVEL_MANAGER] Status wechselt von ${oldState} zu ${newState}`);
    
    // Aktualisiere auch die alten Flags für Rückwärtskompatibilität
    switch (newState) {
      case LevelState.PAUSED:
        this.isPaused = true;
        break;
      case LevelState.RUNNING:
        this.isPaused = false;
        this.levelCompleted = false;
        this.levelEndingInProgress = false;
        break;
      case LevelState.ENDING:
        this.levelEndingInProgress = true;
        break;
      case LevelState.COMPLETED:
        this.levelCompleted = true;
        break;
      case LevelState.INACTIVE:
        this.isPaused = false;
        this.levelCompleted = false;
        this.levelEndingInProgress = false;
        break;
    }
    
    // Spezifische Event-Auslösung je nach Zustandsübergang
    if (oldState !== newState) {
      switch (newState) {
        case LevelState.RUNNING:
          if (oldState === LevelState.INACTIVE) {
            this.eventBus.emit(EventType.LEVEL_STARTED, { 
              level: this.currentLevel, 
              index: this.currentLevelIndex,
              levelName: this.currentLevel?.name
            });
          }
          break;
        case LevelState.ENDING:
          this.eventBus.emit(EventType.LEVEL_ENDING, { 
            level: this.currentLevel, 
            index: this.currentLevelIndex 
          });
          break;
        case LevelState.COMPLETED:
          this.eventBus.emit(EventType.LEVEL_COMPLETED, { 
            level: this.currentLevel, 
            index: this.currentLevelIndex 
          });
          break;
      }
    }
  }
  
  /**
   * Prüft, ob der Level-Manager sich im angegebenen Zustand befindet
   * @param state Der zu prüfende Zustand
   * @returns true, wenn der aktuelle Zustand dem angegebenen entspricht
   */
  public isInState(state: LevelState): boolean {
    return this.currentState === state;
  }
  
  /**
   * Startet das Level mit dem angegebenen Index
   */
  public startLevel(levelIndex: number): void {
    // Setze den Manager zurück und in den Ausgangszustand
    this.reset();
    
    // Prüfe, ob Level existiert
    if (levelIndex < 0 || levelIndex >= GameLevels.length) {
      console.error(`[LEVEL_MANAGER] Level ${levelIndex} existiert nicht!`);
      return;
    }
    
    // Setze aktuelle Level-Daten
    this.currentLevelIndex = levelIndex;
    this.currentLevel = GameLevels[levelIndex];
    this.currentWaveIndex = 0;
    this.allWavesSpawned = false;
    
    console.log(`[LEVEL_MANAGER] Debug - GameLevels.length: ${GameLevels.length}, aktives Level: ${levelIndex}`);
    console.log(`[LEVEL_MANAGER] Debug - Wellen im Level: ${this.currentLevel.waves?.length || 0}`);
    if (this.currentLevel.waves && this.currentLevel.waves.length > 0) {
      console.log(`[LEVEL_MANAGER] Debug - Erste Welle: Typ=${this.currentLevel.waves[0].enemyType}, Anzahl=${this.currentLevel.waves[0].count}`);
    }
    
    console.log(`[LEVEL_MANAGER] Level gesetzt auf: ${this.currentLevel?.name || 'undefined'}`);
    
    // Konfiguriere SpawnManager mit Level-Einstellungen
    if (this.currentLevel.minAsteroids !== undefined) {
      this.spawnManager.setMinAsteroids(this.currentLevel.minAsteroids);
    }
    
    if (this.currentLevel.maxAsteroids !== undefined) {
      this.spawnManager.setMaxAsteroids(this.currentLevel.maxAsteroids);
    }
    
    if (this.currentLevel.asteroidSpawnRate !== undefined) {
      this.spawnManager.setAsteroidSpawnRate(this.currentLevel.asteroidSpawnRate);
    }
    
    // Level-Intro anzeigen, falls vorhanden
    if (this.currentLevel.introText && !this.levelIntroShown) {
      console.log(`[LEVEL_MANAGER] Zeige Level-Intro an: "${this.currentLevel.introText.substring(0, 30)}..."`);
      this.showLevelIntro(this.currentLevel.introText, () => {
        // Wechsle zum RUNNING-Zustand erst nach dem Intro
        this.setState(LevelState.RUNNING);
        this.levelIntroShown = true;
        console.log(`[LEVEL_MANAGER] Level-Intro beendet, starte erste Welle`);
        this.startNextWave();
      });
    } else {
      // Kein Intro, Level läuft direkt
      console.log(`[LEVEL_MANAGER] Kein Level-Intro, starte Level direkt`);
      this.setState(LevelState.RUNNING);
      this.startNextWave();
    }
    
    // Level-spezifische Musik starten
    if (this.currentLevel.music) {
      try {
        // Prüfe, ob die Musik im Cache existiert
        if (this.scene.cache.audio.exists(this.currentLevel.music)) {
          this.musicManager.playTrack(this.currentLevel.music);
        } else {
          this.musicManager.playRandomGameplayTrack();
        }
      } catch (error) {
        console.error(`[LEVEL_MANAGER] Fehler beim Abspielen der Musik: ${error}`);
        // Fallback: Zufällige Musik
        this.musicManager.playRandomGameplayTrack();
      }
    } else {
      this.musicManager.playRandomGameplayTrack();
    }
    
    // Timed Spawns und Pickups initialisieren
    this.setupTimedSpawns();
    this.setupTimedPickups();
    
    console.log(`[LEVEL_MANAGER] Level ${this.currentLevel.name} initialisiert`);
  }
  
  /**
   * Startet das nächste Level oder beendet das Spiel bei Erreichen des letzten Levels
   */
  private startNextLevel(): void {
    // Erst ein Event emittieren, dass wir zum nächsten Level übergehen
    this.eventBus.emit(EventType.NEXT_LEVEL_STARTING);
    
    // Prüfen, ob wir das letzte Level erreicht haben
    if (this.currentLevelIndex >= GameLevels.length - 1) {
      console.log('[LEVEL_MANAGER] Letztes Level abgeschlossen, Spiel beendet!');
      
      // Setze das Flag in der Registry, dass das Spiel beendet wird
      // Dies verhindert das Abspielen von Explosionen beim Entfernen von Objekten
      this.scene.registry.set('isGameEnding', true);
      
      this.scene.time.delayedCall(
        1000,
        () => {
          this.eventBus.emit(EventType.GAME_WON);
        },
        [],
        this
      );
      return;
    }
    
    // Zum nächsten Level wechseln
    const nextLevelIndex = this.currentLevelIndex + 1;
    console.log(`[LEVEL_MANAGER] Wechsle zu Level ${nextLevelIndex + 1}`);
    
    // Delay hinzufügen, bevor das nächste Level gestartet wird
    this.scene.time.delayedCall(
      2000,
      () => {
        this.startLevel(nextLevelIndex);
      },
      [],
      this
    );
  }
  
  /**
   * Stoppt das aktuelle Level
   */
  private stopLevel = (): void => {
    //console.log('[LEVEL_MANAGER] Level wird gestoppt');
    this.clearAllTimers();
    this.isPaused = true;
  }
  
  /**
   * Pausiert das aktuelle Level
   */
  private pauseLevel = (): void => {
    if (this.isPaused) return;
    
    //console.log('[LEVEL_MANAGER] Level pausiert');
    this.isPaused = true;
    
    // Alle Timer pausieren
    this.waveTimers.forEach(timer => timer.paused = true);
    this.timedSpawnTimers.forEach(timer => timer.paused = true);
    this.timedPickupTimers.forEach(timer => timer.paused = true);
    if (this.bossTimer) this.bossTimer.paused = true;
  }
  
  /**
   * Setzt das aktuelle Level fort
   */
  private resumeLevel = (): void => {
    if (!this.isPaused) return;
    
    //console.log('[LEVEL_MANAGER] Level fortgesetzt');
    this.isPaused = false;
    
    // Alle Timer fortsetzen
    this.waveTimers.forEach(timer => timer.paused = false);
    this.timedSpawnTimers.forEach(timer => timer.paused = false);
    this.timedPickupTimers.forEach(timer => timer.paused = false);
    if (this.bossTimer) this.bossTimer.paused = false;
  }
  
  /**
   * Spawnt eine Welle von Gegnern mit der angegebenen Formation
   * @param formation Die Formation, in der die Gegner gespawnt werden sollen
   * @param enemyType Der Typ der Gegner
   * @param count Die Anzahl der Gegner
   * @param delay Die Verzögerung zwischen den Spawns
   */
  private spawnWaveByFormation(formation: FormationType, enemyType: string, count: number, delay: number, healthMultiplier?: number, speedMultiplier?: number): void {
    console.log(`[LEVEL_MANAGER] spawnWaveByFormation aufgerufen: formation=${formation}, enemyType=${enemyType}, count=${count}, healthMultiplier=${healthMultiplier}, speedMultiplier=${speedMultiplier}`);
    
    // Wenn das Level pausiert oder beendet ist, keine Gegner spawnen
    if (!this.isInState(LevelState.RUNNING)) {
      console.log(`[LEVEL_MANAGER] spawnWaveByFormation: Level nicht im RUNNING-Zustand, sondern ${this.currentState}`);
      return;
    }
    
    switch (formation) {
      case FormationType.LINE:
        console.log(`[LEVEL_MANAGER] Spawne Linienformation mit ${count} Gegnern vom Typ ${enemyType}`);
        this.spawnLineFormation(enemyType, count, delay, healthMultiplier, speedMultiplier);
        break;
      case FormationType.V_FORMATION:
        console.log(`[LEVEL_MANAGER] Spawne V-Formation mit ${count} Gegnern vom Typ ${enemyType}`);
        this.spawnVFormation(enemyType, count, delay, healthMultiplier, speedMultiplier);
        break;
      case FormationType.SQUARE:
        console.log(`[LEVEL_MANAGER] Spawne Quadrat-Formation mit ${count} Gegnern vom Typ ${enemyType}`);
        this.spawnSquareFormation(enemyType, count, delay, healthMultiplier, speedMultiplier);
        break;
      case FormationType.RANDOM:
        console.log(`[LEVEL_MANAGER] Spawne Zufalls-Formation mit ${count} Gegnern vom Typ ${enemyType}`);
        this.spawnRandomFormation(enemyType, count, delay, healthMultiplier, speedMultiplier);
        break;
      case FormationType.SINGLE:
        console.log(`[LEVEL_MANAGER] Spawne einzelnen Gegner vom Typ ${enemyType}`);
        this.spawnSingleEnemy(enemyType, healthMultiplier, speedMultiplier);
        break;
      default:
        console.error(`[LEVEL_MANAGER] Unbekannte Formation: ${formation}, verwende Linienformation`);
        this.spawnLineFormation(enemyType, count, delay, healthMultiplier, speedMultiplier);
    }
    
    console.log(`[LEVEL_MANAGER] spawnWaveByFormation abgeschlossen`);
  }
  
  /**
   * Spawnt Gegner in einer Linienformation
   */
  private spawnLineFormation(enemyType: string, count: number, delay: number, healthMultiplier?: number, speedMultiplier?: number): void {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const baseX = screenWidth + 100;
    
    for (let i = 0; i < count; i++) {
      // Gleichmäßig verteilt vertikal
      const y = 150 + (screenHeight - 300) * (i / (count - 1 || 1));
      const spawnDelay = i * delay;
      
      this.spawnEnemyWithDelay(enemyType, baseX, y, spawnDelay, healthMultiplier, speedMultiplier);
    }
  }
  
  /**
   * Spawnt Gegner in einer V-Formation
   */
  private spawnVFormation(enemyType: string, count: number, delay: number, healthMultiplier?: number, speedMultiplier?: number): void {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const baseX = screenWidth + 100;
    
    for (let i = 0; i < count; i++) {
      // V-Formation
      const center = count / 2;
      const distance = Math.abs(i - center);
      const y = screenHeight / 2 + (i < center ? -1 : 1) * distance * 80;
      const x = baseX + distance * 50; // X-Versatz für V-Form
      const spawnDelay = distance * delay;
      
      this.spawnEnemyWithDelay(enemyType, x, y, spawnDelay, healthMultiplier, speedMultiplier);
    }
  }
  
  /**
   * Spawnt Gegner in einer Quadrat-Formation
   */
  private spawnSquareFormation(enemyType: string, count: number, delay: number, healthMultiplier?: number, speedMultiplier?: number): void {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const baseX = screenWidth + 100;
    
    // Quadratische Formation
    const side = Math.ceil(Math.sqrt(count));
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / side);
      const col = i % side;
      const y = 150 + (screenHeight - 300) * (row / (side - 1 || 1));
      const x = baseX + col * 50; // X-Versatz für Spalten
      const spawnDelay = (row * side + col) * (delay / 2);
      
      this.spawnEnemyWithDelay(enemyType, x, y, spawnDelay, healthMultiplier, speedMultiplier);
    }
  }
  
  /**
   * Spawnt Gegner in zufälligen Positionen
   */
  private spawnRandomFormation(enemyType: string, count: number, delay: number, healthMultiplier?: number, speedMultiplier?: number): void {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const baseX = screenWidth + 100;
    
    for (let i = 0; i < count; i++) {
      // Zufällige Positionen
      const y = Phaser.Math.Between(150, screenHeight - 150);
      const x = baseX + Phaser.Math.Between(-50, 50);
      const spawnDelay = Phaser.Math.Between(0, delay * 2);
      
      this.spawnEnemyWithDelay(enemyType, x, y, spawnDelay, healthMultiplier, speedMultiplier);
    }
  }
  
  /**
   * Spawnt einen einzelnen Gegner
   */
  private spawnSingleEnemy(enemyType: string, healthMultiplier?: number, speedMultiplier?: number): void {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const x = screenWidth + 100;
    const y = screenHeight / 2;
    
    this.spawnEnemyWithDelay(enemyType, x, y, 0, healthMultiplier, speedMultiplier);
  }
  
  /**
   * Spawnt einen Gegner mit Verzögerung
   */
  private spawnEnemyWithDelay(enemyType: string, x: number, y: number, delay: number, healthMultiplier?: number, speedMultiplier?: number): void {
    console.log(`[LEVEL_MANAGER] spawnEnemyWithDelay aufgerufen: Typ=${enemyType}, Position=(${x}, ${y}), Delay=${delay}ms, healthMultiplier=${healthMultiplier}, speedMultiplier=${speedMultiplier}`);
    
    this.scene.time.delayedCall(
      delay,
      () => {
        // Wenn das Level nicht mehr läuft, keine Gegner spawnen
        if (!this.isInState(LevelState.RUNNING)) {
          console.log(`[LEVEL_MANAGER] Gegner-Spawn abgebrochen, Level nicht im RUNNING-Zustand, sondern ${this.currentState}`);
          return;
        }
        
        // Multiplikatoren anwenden (Standard 1.0)
        const options = {
          healthMultiplier: healthMultiplier !== undefined ? healthMultiplier : 1.0,
          speedMultiplier: speedMultiplier !== undefined ? speedMultiplier : 1.0
        };
        
        console.log(`[LEVEL_MANAGER] Versuche Gegner zu spawnen: Typ=${enemyType}, Multiplikatoren: Health=${options.healthMultiplier}, Speed=${options.speedMultiplier}`);
        
        try {
          // Gegner-Instanz erstellen
          const enemy = this.enemyManager.spawnEnemyOfType(enemyType, x, y, options);
          
        } catch (error) {
          console.error(`[LEVEL_MANAGER] Fehler beim Spawnen des Gegners: ${error}`);
        }
      },
      [],
      this
    );
  }
  
  /**
   * Startet die nächste Welle von Gegnern
   */
  private startNextWave(): void {
    console.log(`[LEVEL_MANAGER] startNextWave() aufgerufen, currentWaveIndex=${this.currentWaveIndex}`);

    // Nichts tun, wenn keine Level-Daten vorhanden oder Level nicht aktiv ist
    if (!this.currentLevel || !this.isInState(LevelState.RUNNING)) {
      console.log(`[LEVEL_MANAGER] Abbruch: currentLevel=${!!this.currentLevel}, State=${this.currentState}`);
      return;
    }
    
    // Sichere Prüfung, ob Wellen definiert sind
    if (!this.currentLevel.waves || this.currentLevel.waves.length === 0) {
      console.log('[LEVEL_MANAGER] Keine Wellen für dieses Level definiert');
      return;
    }
    
    // Wenn keine weiteren Wellen vorhanden sind, Level-End-Check starten
    if (this.currentWaveIndex >= this.currentLevel.waves.length) {
      console.log('[LEVEL_MANAGER] Alle Wellen abgeschlossen');
      this.allWavesSpawned = true;
      
      // Prüfe auf verbleibende Gegner
      const remainingEnemies = this.enemyManager.getAllEnemies().length;
      console.log(`[LEVEL_MANAGER] Alle Wellen gespawnt. Verbleibende Gegner: ${remainingEnemies}`);
      
      if (remainingEnemies === 0) {
        console.log('[LEVEL_MANAGER] Keine Gegner mehr übrig. Level wird abgeschlossen.');
        this.onLevelComplete();
      } else {
        console.log(`[LEVEL_MANAGER] Es sind noch ${remainingEnemies} Gegner übrig. Warte auf deren Zerstörung.`);
        
        // Hier fügen wir einen regelmäßigen Check ein, um den Fall abzufangen, dass Gegner den Bildschirm verlassen haben
        this.createEndCheckTimer();
      }
      return;
    }
    
    // Aktuelle Welle holen
    const wave = this.currentLevel.waves[this.currentWaveIndex];
    console.log(`[LEVEL_MANAGER] Aktuelle Welle geladen: Index=${this.currentWaveIndex}, Typ=${wave.enemyType}, Anzahl=${wave.count}`);
    
    console.log(`[LEVEL_MANAGER] Starte Welle ${this.currentWaveIndex + 1} von ${this.currentLevel.waves.length}`);
    
    // Vorbereitung für die Welle
    const formation = wave.formation || FormationType.LINE;
    const enemyType = wave.enemyType ? String(wave.enemyType) : '';
    const count = wave.count || 5;
    const delay = wave.delay || 500;
    const startDelay = wave.startDelay || 0;
    const healthMultiplier = wave.healthMultiplier;
    const speedMultiplier = wave.speedMultiplier;
    
    // Debug-Ausgabe für enemyType und Multiplikatoren
    console.log(`[LEVEL_MANAGER] Verwende enemyType: ${enemyType}, Originalwert: ${wave.enemyType}, formation: ${formation}`);
    console.log(`[LEVEL_MANAGER] Multiplikatoren: Health=${healthMultiplier}, Speed=${speedMultiplier}`);
    
    // Rufe die entsprechende Spawn-Methode basierend auf dem Formations-Typ auf
    try {
      console.log(`[LEVEL_MANAGER] Rufe spawnWaveByFormation auf`);
      this.spawnWaveByFormation(formation, enemyType, count, delay, healthMultiplier, speedMultiplier);
      console.log(`[LEVEL_MANAGER] spawnWaveByFormation abgeschlossen`);
    } catch (error) {
      console.error(`[LEVEL_MANAGER] Fehler beim Spawn der Welle: ${error}`);
    }
    
    // Erhöhe den Wave-Index für die nächste Welle
    this.currentWaveIndex++;
    console.log(`[LEVEL_MANAGER] currentWaveIndex erhöht auf ${this.currentWaveIndex}`);
    
    // Prüfe, ob das die letzte Welle war
    this.checkIfLastWave();
    
    // Finde das Delay für die nächste Welle, wenn vorhanden
    let nextWaveDelay = 0;
    if (this.currentWaveIndex < this.currentLevel.waves.length) {
      const nextWave = this.currentLevel.waves[this.currentWaveIndex];
      nextWaveDelay = nextWave.startDelay || 0;
    }
    
    // Starte die nächste Welle nach einem Delay
    if (this.currentWaveIndex < this.currentLevel.waves.length) {
      console.log(`[LEVEL_MANAGER] Nächste Welle startet in ${nextWaveDelay}ms`);
      const timer = this.scene.time.delayedCall(
        nextWaveDelay,
        this.startNextWave,
        [],
        this
      );
      this.waveTimers.push(timer);
      console.log(`[LEVEL_MANAGER] Timer für nächste Welle gesetzt`);
    } else {
      console.log(`[LEVEL_MANAGER] Keine weiteren Wellen vorhanden`);
    }
  }
  
  /**
   * Richtet zeitgesteuerte Gegner-Spawns ein
   */
  private setupTimedSpawns(): void {
    if (!this.currentLevel || !this.currentLevel.timedSpawns) return;

    // Alle vorherigen Timer löschen
    this.clearAllTimedSpawnTimers();

    this.currentLevel.timedSpawns.forEach(spawn => {
      const timer = this.scene.time.delayedCall(
        spawn.time,
        () => {
          // Wenn das Level nicht mehr aktiv ist, keine Gegner spawnen
          if (!this.isInState(LevelState.RUNNING)) return;
          
          console.log(`[LEVEL_MANAGER] Zeitgesteuerter Spawn: ${spawn.count}x ${spawn.enemyType}`);
          
          // Spawn-Optionen
          const formation = spawn.formation || FormationType.LINE;
          const count = spawn.count || 1;
          const delay = 500; // Default-Verzögerung
          const healthMultiplier = spawn.healthMultiplier;
          const speedMultiplier = spawn.speedMultiplier;
          
          // EnemyType in String konvertieren
          const enemyType = String(spawn.enemyType);
          
          // Debug-Ausgabe für Multiplikatoren
          console.log(`[LEVEL_MANAGER] Timed Spawn Multiplikatoren: Health=${healthMultiplier}, Speed=${speedMultiplier}`);
          
          // Rufe die entsprechende Spawn-Methode auf
          this.spawnWaveByFormation(formation, enemyType, count, delay, healthMultiplier, speedMultiplier);
        },
        [],
        this
      );

      this.timedSpawnTimers.push(timer);
    });
  }
  
  /**
   * Löscht alle Timer für zeitgesteuerte Spawns
   */
  private clearAllTimedSpawnTimers(): void {
    this.timedSpawnTimers.forEach(timer => {
      if (timer) timer.remove();
    });
    this.timedSpawnTimers = [];
  }
  
  /**
   * Richtet die zeitgesteuerten Pickups für das Level ein
   */
  private setupTimedPickups(): void {
    if (!this.currentLevel || !this.currentLevel.timedPickups) return;

    // Alle vorherigen Timer löschen
    this.clearAllTimedPickupTimers();

    this.currentLevel.timedPickups.forEach((timedPickup) => {
      // Stelle sicher, dass der Timer nicht länger als MAX_LEVEL_DURATION läuft
      
      const timer = this.scene.time.delayedCall(
        timedPickup.time,
        () => {
          // Wenn das Level bereits beendet ist, keine weiteren Pickups spawnen
          if (this.levelCompleted) return;
         
          
          // Verwende die bestehende Logik für das Spawnen von Pickups
          for (let i = 0; i < (timedPickup.count || 1); i++) {
            // Verzögertes Spawnen der Pickups
            this.scene.time.delayedCall(
              i * 500, // 500ms Abstand zwischen Spawns
              () => {
                const x = this.scene.scale.width + 50;
                const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
                
                if (timedPickup.type === PickupType.ENERGY) {
                  this.spawnManager.spawnEnergyPickup(x, y);
                } else if (timedPickup.type === PickupType.POWER) {
                  this.spawnManager.spawnPowerPickup(x, y);
                }
              },
              [],
              this
            );
          }
        },
        [],
        this
      );

      this.timedPickupTimers.push(timer);
    });
  }
  
  /**
   * Löscht alle Timer für zeitgesteuerte Pickups
   */
  private clearAllTimedPickupTimers(): void {
    this.timedPickupTimers.forEach(timer => {
      if (timer) timer.remove();
    });
    this.timedPickupTimers = [];
  }
  
  /**
   * Handler für Level-Abschluss
   * Leitet das Ende des Levels ein und wartet, bis alle Gegner den Bildschirm verlassen haben
   */
  private async onLevelComplete(): Promise<void> {
    // Prüfe, ob wir bereits in einem der Endzustände sind
    if (this.isInState(LevelState.ENDING) || this.isInState(LevelState.COMPLETED) || 
        this.isInState(LevelState.PAUSED)) {
      console.log(`[LEVEL_MANAGER] Kein Level-Ende möglich im aktuellen Zustand: ${this.currentState}`);
      return;
    }
    
    // Wechsle in den ENDING-Zustand
    this.setState(LevelState.ENDING);
    
    console.log('[LEVEL_MANAGER] Level-Ende eingeleitet.');
    
    // Stoppe alle Timer und Spawns
    this.clearAllTimers();
    
    try {
      // Warte asynchron, bis alle Gegner den Bildschirm verlassen haben
      await this.enemyManager.prepareForLevelEnd();
      
      // Der EnemyManager hat bestätigt, dass alle Gegner weg sind
      console.log('[LEVEL_MANAGER] Alle Gegner wurden erfolgreich entfernt.');
      
      // Emittiere das Event, dass alle Gegner entfernt wurden
      this.eventBus.emit(EventType.LEVEL_ENEMIES_CLEARED);
      
      // Zeige das Level-Outro an
      this.completeLevel();
    } catch (error) {
      console.error(`[LEVEL_MANAGER] Fehler beim Abschließen des Levels: ${error}`);
    }
  }
  
  /**
   * Schließt das Level ab und zeigt das Outro an
   */
  private completeLevel(): void {
    // Wenn das Level bereits abgeschlossen ist, nichts tun
    if (this.isInState(LevelState.COMPLETED)) return;
    
    console.log('[LEVEL_MANAGER] Level wird abgeschlossen!');
    
    // Level-Outro anzeigen, falls vorhanden
    if (this.currentLevel && this.currentLevel.outroText) {
      this.showLevelOutro(this.currentLevel.outroText, () => {
        // Erst hier das Level als abgeschlossen markieren
        this.setState(LevelState.COMPLETED);
        this.startNextLevel();
      });
    } else {
      // Verzögerung hinzufügen, bevor das nächste Level gestartet wird
      this.scene.time.delayedCall(
        2000,
        () => {
          // Erst hier das Level als abgeschlossen markieren
          this.setState(LevelState.COMPLETED);
          this.startNextLevel();
        },
        [],
        this
      );
    }
  }
  
  /**
   * Zeigt die Level-Intro-Nachricht an
   */
  private showLevelIntro(text: string, callback: () => void): void {
    // Hintergrund-Rechteck erstellen
    const backgroundHeight = 100;
    const background = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height - backgroundHeight / 2 - 20, // 20px vom unteren Rand
      this.scene.scale.width - 40, // 20px Rand auf jeder Seite
      backgroundHeight,
      0x000000,
      0.7 // 70% Deckkraft
    );
    background.setDepth(999);
    
    const introText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height - backgroundHeight / 2 - 20,
      text,
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        padding: { x: 20, y: 10 },
        wordWrap: { width: this.scene.scale.width - 100 }
      }
    );
    
    introText.setOrigin(0.5);
    introText.setDepth(1000);
    
    // Text-Animation
    introText.setAlpha(0);
    background.setAlpha(0);
    
    // Einblend-Animation für Text und Hintergrund
    this.scene.tweens.add({
      targets: [introText, background],
      alpha: 1,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.scene.time.delayedCall(
          3000, // Länger anzeigen (3 Sekunden)
          () => {
            this.scene.tweens.add({
              targets: [introText, background],
              alpha: 0,
              duration: 1000,
              ease: 'Linear',
              onComplete: () => {
                introText.destroy();
                background.destroy();
                callback();
              }
            });
          },
          [],
          this
        );
      }
    });
  }
  
  /**
   * Zeigt die Level-Outro-Nachricht an
   */
  private showLevelOutro(text: string, callback: () => void): void {
    // Hintergrund-Rechteck erstellen
    const backgroundHeight = 100;
    const background = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height - backgroundHeight / 2 - 20, // 20px vom unteren Rand
      this.scene.scale.width - 40, // 20px Rand auf jeder Seite
      backgroundHeight,
      0x000000,
      0.7 // 70% Deckkraft
    );
    background.setDepth(999);
    
    const outroText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height - backgroundHeight / 2 - 20,
      text,
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        padding: { x: 20, y: 10 },
        wordWrap: { width: this.scene.scale.width - 100 }
      }
    );
    
    outroText.setOrigin(0.5);
    outroText.setDepth(1000);
    
    // Text-Animation
    outroText.setAlpha(0);
    background.setAlpha(0);
    
    // Einblend-Animation für Text und Hintergrund
    this.scene.tweens.add({
      targets: [outroText, background],
      alpha: 1,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.scene.time.delayedCall(
          3000, // Länger anzeigen (3 Sekunden)
          () => {
            this.scene.tweens.add({
              targets: [outroText, background],
              alpha: 0,
              duration: 1000,
              ease: 'Linear',
              onComplete: () => {
                outroText.destroy();
                background.destroy();
                callback();
              }
            });
          },
          [],
          this
        );
      }
    });
  }
  
  /**
   * Löscht alle aktiven Timer (Wellen, Spawns, Pickups)
   */
  private clearAllTimers(): void {
    // Wellen-Timer löschen
    this.waveTimers.forEach(timer => {
      if (timer) timer.remove();
    });
    this.waveTimers = [];

    // Timed Spawn-Timer löschen
    this.clearAllTimedSpawnTimers();

    // Timed Pickup-Timer löschen
    this.clearAllTimedPickupTimers();

    // Boss-Timer löschen
    if (this.bossTimer) {
      this.bossTimer.remove();
      this.bossTimer = null;
    }
    
    // End-Check-Timer löschen
    if (this.endCheckTimer) {
      this.endCheckTimer.remove();
      this.endCheckTimer = null;
    }
  }
  
  /**
   * Setzt den Manager zurück
   */
  private reset(): void {
    this.clearAllTimers();
    this.waveTimers = [];
    this.timedSpawnTimers = [];
    this.timedPickupTimers = [];
    this.bossTimer = null;
    this.endCheckTimer = null;
    this.levelIntroShown = false;
    this.pendingWaves = [];
    this.currentWaveIndex = 0;
    this.allWavesSpawned = false;
    
    // Setze Zustand zurück
    this.setState(LevelState.INACTIVE);
  }
  
  /**
   * Bereinigt alle Ressourcen
   */
  public destroy(): void {
    console.log('[LEVEL_MANAGER] Manager wird zerstört');
    
    // Prüfe, ob das Spiel bereits beendet wird
    if (this.scene.registry.get('isGameEnding')) {
      // Flag erneut setzen für Konsistenz
      this.scene.registry.set('isGameEnding', true);
    }
    
    this.stopLevel();
    
    // Event-Listener entfernen
    this.eventBus.off(EventType.PAUSE_GAME, this.pauseLevel);
    this.eventBus.off(EventType.RESUME_GAME, this.resumeLevel);
    this.eventBus.off(EventType.GAME_OVER, this.stopLevel);
    this.eventBus.off(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
  }
  
  /**
   * Event-Handler, der aufgerufen wird, wenn ein Gegner zerstört wurde
   * Prüft, ob das Level abgeschlossen ist (alle Wellen gespawnt und keine Gegner mehr)
   */
  private onEnemyDestroyed = (enemy: BaseEnemy): void => {
    // Wenn Level bereits abgeschlossen ist, nichts tun
    if (this.isInState(LevelState.ENDING) || this.isInState(LevelState.COMPLETED)) {
      return;
    }
    
    // Prüfen, ob bereits alle Wellen gespawnt wurden
    if (this.allWavesSpawned) {
      // Explizit die Anzahl verbleibender Gegner ermitteln
      const remainingEnemies = this.enemyManager.getAllEnemies().length;
      
      console.log(`[LEVEL_MANAGER] onEnemyDestroyed: allWavesSpawned=${this.allWavesSpawned}, remainingEnemies=${remainingEnemies}`);
      
      if (remainingEnemies <= 1) { // 1, weil dieser Gegner jetzt entfernt wird
        console.log('[LEVEL_MANAGER] Alle Wellen gespawnt und keine Gegner mehr übrig. Level wird abgeschlossen.');
        this.onLevelComplete();
      }
    } else {
      console.log(`[LEVEL_MANAGER] onEnemyDestroyed: Noch nicht alle Wellen gespawnt. currentWaveIndex=${this.currentWaveIndex}, waves.length=${this.currentLevel?.waves?.length || 0}`);
    }
  }
  
  /**
   * Gibt den aktuellen Spieler-Score zurück
   * Verwendet die UI-Komponente, um den Score abzurufen
   */
  private getPlayerScore(): number {
    // Versuche den Score aus dem UI Manager zu bekommen
    if (this.scene.registry.get('uiManager')) {
      const uiManager = this.scene.registry.get('uiManager');
      if (uiManager && uiManager.getScore) {
        return uiManager.getScore();
      }
    }
    
    // Fallback: Verwende den Registry-Wert
    return this.scene.registry.get('score') || 0;
  }
  
  /**
   * Erstellt einen Timer, der regelmäßig prüft, ob alle Gegner weg sind
   */
  private createEndCheckTimer(): void {
    // Zuerst alten Timer entfernen, falls vorhanden
    if (this.endCheckTimer) {
      this.endCheckTimer.remove();
      this.endCheckTimer = null;
    }
    
    this.endCheckTimer = this.scene.time.addEvent({
      delay: 1000, // Alle 1 Sekunde prüfen
      callback: () => {
        // Wenn das Level nicht mehr läuft oder nicht alle Wellen gespawnt wurden, Timer stoppen
        if (!this.isInState(LevelState.RUNNING) || !this.allWavesSpawned) {
          if (this.endCheckTimer) {
            this.endCheckTimer.remove();
            this.endCheckTimer = null;
          }
          return;
        }
        
        // Prüfe verbleibende Gegner
        const remainingEnemies = this.enemyManager.getAllEnemies().length;
        console.log(`[LEVEL_MANAGER] EndCheckTimer: Verbleibende Gegner: ${remainingEnemies}`);
        
        if (remainingEnemies === 0) {
          console.log('[LEVEL_MANAGER] EndCheckTimer: Keine Gegner mehr übrig. Level wird abgeschlossen.');
          if (this.endCheckTimer) {
            this.endCheckTimer.remove();
            this.endCheckTimer = null;
          }
          this.onLevelComplete();
        }
      },
      callbackScope: this,
      loop: true
    });
  }
  
  /**
   * Prüfe, ob das die letzte Welle war
   */
  private checkIfLastWave(): void {
    if (this.currentWaveIndex >= (this.currentLevel?.waves?.length || 0)) {
      this.allWavesSpawned = true;
      console.log(`[LEVEL_MANAGER] Alle Wellen wurden gespawnt. Warte auf Zerstörung aller Gegner.`);
      
      // Starte den End-Check-Timer
      this.createEndCheckTimer();
    }
  }
} 