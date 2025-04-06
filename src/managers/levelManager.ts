/**
 * LevelManager
 * Verwaltet die Level, deren Progression und Konfiguration
 */

import { EventBus, EventType } from '../utils/eventBus';
import { LevelConfig, Wave, TimedSpawn, TimedPickup, EnemyType, PickupType, FormationType } from '../config/levelConfig';
import { GameLevels } from '../config/gameLevels';
import { Constants } from '../utils/constants';
import { GameScene } from '../scenes/gameScene';
import { MusicManager } from './musicManager';
import { SpawnManager } from './spawnManager';
import { NewEnemyManager } from './newEnemyManager';
import { DifficultyManager } from './difficultyManager';
import { BaseEnemy } from '../entities/enemies/baseEnemy';

export class LevelManager {
  private scene: GameScene;
  private eventBus: EventBus;
  private enemyManager: NewEnemyManager;
  private spawnManager: SpawnManager;
  private difficultyManager: DifficultyManager;
  private musicManager: MusicManager;
  
  private currentLevel: LevelConfig | null = null;
  private currentLevelIndex: number = 0;
  private levelStartTime: number = 0;
  private levelTimer: Phaser.Time.TimerEvent | null = null;
  private waveTimers: Phaser.Time.TimerEvent[] = [];
  private timedSpawnTimers: Phaser.Time.TimerEvent[] = [];
  private timedPickupTimers: Phaser.Time.TimerEvent[] = [];
  private bossTimer: Phaser.Time.TimerEvent | null = null;
  private isPaused: boolean = false;
  private levelCompleted: boolean = false;
  private levelEndingInProgress: boolean = false; // Neuer Lock-Status
  private levelIntroShown: boolean = false;
  private pendingWaves: Wave[] = [];
  private currentWaveIndex: number = 0;
  private levelEndTriggerWaves: Map<number, boolean> = new Map(); // Speichert die Wellen-Indices, die Level-End-Trigger sind
  
  constructor(scene: GameScene, enemyManager: NewEnemyManager, spawnManager: SpawnManager, difficultyManager: DifficultyManager) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    this.enemyManager = enemyManager;
    this.spawnManager = spawnManager;
    this.difficultyManager = difficultyManager;
    this.musicManager = MusicManager.getInstance();
    
    // Event-Listener registrieren
    this.eventBus.on(EventType.PAUSE_GAME, this.pauseLevel);
    this.eventBus.on(EventType.RESUME_GAME, this.resumeLevel);
    this.eventBus.on(EventType.GAME_OVER, this.stopLevel);
    this.eventBus.on(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
  }
  
  /**
   * Startet das Level mit dem angegebenen Index
   */
  public startLevel(levelIndex: number): void {
    //console.log(`[LEVEL_MANAGER] Starte Level ${levelIndex}`);
    //console.log(`[LEVEL_MANAGER] GameLevels verfügbar: ${GameLevels.length}`);
    //console.log(`[LEVEL_MANAGER] GameLevels[0] ist: ${GameLevels[0]?.name || 'undefined'}`);
    this.reset();
    
    // Prüfe, ob Level existiert
    if (levelIndex < 0 || levelIndex >= GameLevels.length) {
      //console.error(`[LEVEL_MANAGER] Level ${levelIndex} existiert nicht!`);
      return;
    }
    
    // Setze aktuelle Level-Daten
    this.currentLevelIndex = levelIndex;
    this.currentLevel = GameLevels[levelIndex];
    this.levelCompleted = false;
    this.currentWaveIndex = 0;
    this.levelEndTriggerWaves.clear();
    
    // Zeitstempel für den Levelstart setzen
    this.levelStartTime = Date.now();
    
    //console.log(`[LEVEL_MANAGER] Level gesetzt auf: ${this.currentLevel?.name || 'undefined'}`);
    //console.log(`[LEVEL_MANAGER] Level hat ${this.currentLevel?.waves?.length || 0} Wellen`);
    
    // Setze Schwierigkeit auf Level-Schwierigkeit
    this.difficultyManager.setDifficulty(this.currentLevel.difficulty);
    
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
      this.showLevelIntro(this.currentLevel.introText, () => {
        this.startLevelTimer();
        this.levelIntroShown = true;
      });
    } else {
      this.startLevelTimer();
    }
    
    // Level-spezifische Musik starten
    if (this.currentLevel.music) {
      try {
        //console.log(`[LEVEL_MANAGER] Versuche Musik zu spielen: ${this.currentLevel.music}`);
        // Prüfe, ob die Musik im Cache existiert
        if (this.scene.cache.audio.exists(this.currentLevel.music)) {
          this.musicManager.playTrack(this.currentLevel.music);
        } else {
          //console.log(`[LEVEL_MANAGER] Musik '${this.currentLevel.music}' nicht gefunden, spiele zufällige Musik`);
          this.musicManager.playRandomGameplayTrack();
        }
      } catch (error) {
        //console.error(`[LEVEL_MANAGER] Fehler beim Abspielen der Musik: ${error}`);
        // Fallback: Zufällige Musik
        this.musicManager.playRandomGameplayTrack();
      }
    } else {
      this.musicManager.playRandomGameplayTrack();
    }
    
    // Timed Spawns und Pickups initialisieren
    this.setupTimedSpawns();
    this.setupTimedPickups();
    
    // Starte die erste Welle
    this.startNextWave();
    
    //console.log(`[LEVEL_MANAGER] Level ${this.currentLevel.name} gestartet`);
  }
  
  /**
   * Startet das nächste Level
   */
  public startNextLevel(): void {
    // Wenn Level-Ende noch im Gange ist, nicht fortfahren
    if (this.levelEndingInProgress) {
      console.log('[LEVEL_MANAGER] Level-Ende ist noch im Gange. Warte, bevor das nächste Level gestartet wird.');
      return;
    }
    
    // Strikte Prüfung: Starte nur, wenn das Level als abgeschlossen markiert wurde
    if (!this.levelCompleted) {
      console.log('[LEVEL_MANAGER] Level wurde noch nicht als abgeschlossen markiert. Starte noch nicht das nächste Level.');
      return;
    }
    
    // Wenn wir gerade mitten in einer Level-Abschluss-Prüfung sind, nicht fortfahren
    if (this.scene.tweens.isTweening(this)) {
      console.log('[LEVEL_MANAGER] Levelübergang wird bereits durchgeführt. Warte...');
      return;
    }
    
    // Letzte Sicherheitsüberprüfung: Sind wirklich alle Gegner weg?
    const remainingEnemies = this.enemyManager.getAllEnemies();
    if (remainingEnemies.length > 0) {
      console.log(`[LEVEL_MANAGER] Warnung: Es sind noch ${remainingEnemies.length} Gegner aktiv, obwohl das Level als abgeschlossen gilt.`);
      
      // Erzwinge die Entfernung aller verbleibenden Gegner
      remainingEnemies.forEach(enemy => {
        try {
          enemy.destroy();
        } catch (error) {
          console.error(`[LEVEL_MANAGER] Fehler beim Versuch, einen Gegner zu entfernen: ${error}`);
        }
      });
      
      // Kurze Verzögerung, um sicherzustellen, dass EnemyManager alle Gegner entfernen kann
      this.scene.time.delayedCall(
        200,
        () => this.startNextLevel(),
        [],
        this
      );
      return;
    }
    
    const nextLevelIndex = this.currentLevelIndex + 1;
    
    if (nextLevelIndex < GameLevels.length) {
      this.startLevel(nextLevelIndex);
    } else {
      console.log('[LEVEL_MANAGER] Keine weiteren Level verfügbar. Spiel abgeschlossen!');
      // Hole den aktuellen Score
      const currentScore = this.getPlayerScore();
      
      // Emittiere das GAME_FINISHED-Event mit dem finalen Score
      this.eventBus.emit(EventType.GAME_FINISHED, { score: currentScore });
      
      // Starte die FinishedScene
      this.scene.scene.start(Constants.SCENE_FINISHED, { score: currentScore });
    }
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
    if (this.levelTimer) this.levelTimer.paused = true;
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
    if (this.levelTimer) this.levelTimer.paused = false;
    this.waveTimers.forEach(timer => timer.paused = false);
    this.timedSpawnTimers.forEach(timer => timer.paused = false);
    this.timedPickupTimers.forEach(timer => timer.paused = false);
    if (this.bossTimer) this.bossTimer.paused = false;
  }
  
  /**
   * Startet den Timer für das Level
   */
  private startLevelTimer(): void {
    if (!this.currentLevel) return;    
    
    const effectiveDuration = this.currentLevel.duration
    
    this.levelTimer = this.scene.time.delayedCall(
      effectiveDuration,
      () => {
        console.log('[LEVEL_MANAGER] Level-Timer abgelaufen. Bereite Level-Ende vor.');
        
        // Wenn bereits ein Level-Ende im Gange ist, nichts tun
        if (this.levelCompleted || this.levelEndingInProgress) {
          console.log('[LEVEL_MANAGER] Level-Ende bereits eingeleitet, Timer-Auslöser wird ignoriert.');
          return;
        }
        
        // Level-Abschluss einleiten
        this.onLevelComplete();
      },
      [],
      this
    );
  }
  
  /**
   * Startet die nächste Welle (falls vorhanden)
   */
  private startNextWave(): void {
    if (!this.currentLevel) return;
    
    // Wenn es keine weiteren Wellen gibt, Level beenden (falls nicht bereits beendet)
    if (this.currentWaveIndex >= this.currentLevel.waves.length) {
      if (!this.levelCompleted) {
        //console.log(`[LEVEL_MANAGER] Keine weiteren Wellen vorhanden, Level wird beendet`);
        this.onLevelComplete();
      }
      return;
    }
    
    const wave = this.currentLevel.waves[this.currentWaveIndex];
    
    // Timer für die nächste Welle starten
    //console.log(`[LEVEL_MANAGER] Timer für Welle ${this.currentWaveIndex} wird gestartet (Verzögerung: ${wave.delay}ms)`);
    
    const timer = this.scene.time.delayedCall(
      wave.delay,
      () => {
        //console.log(`[LEVEL_MANAGER] Starte Welle ${this.currentWaveIndex}`);
        this.spawnWave(wave);
        this.currentWaveIndex++;
        this.startNextWave();
      },
      [],
      this
    );
    
    this.waveTimers.push(timer);
  }
  
  /**
   * Spawnt eine Welle von Gegnern
   */
  private spawnWave(wave: Wave): void {
    //console.log(`[LEVEL_MANAGER] Spawne Welle: ${wave.count}x ${wave.enemyType}`);
    //console.log(`[LEVEL_MANAGER] Formation: ${wave.formation}, Delay: ${wave.delay || 'undefined'}`);
    //console.log(`[LEVEL_MANAGER] Health Multiplier: ${wave.healthMultiplier || 1}, Speed Multiplier: ${wave.speedMultiplier || 1}`);
    
    // Check EnemyType values
    //console.log(`[LEVEL_MANAGER] EnemyType value: ${wave.enemyType}, type: ${typeof wave.enemyType}`);
    //console.log(`[LEVEL_MANAGER] EnemyType.STANDARD value: ${EnemyType.STANDARD}, type: ${typeof EnemyType.STANDARD}`);
    
    // Wenn diese Welle ein Level-End-Trigger ist, merken wir uns das
    if (wave.isLevelEndTrigger) {
      //console.log(`[LEVEL_MANAGER] Welle ${this.currentWaveIndex} wurde als Level-End-Trigger markiert`);
      this.levelEndTriggerWaves.set(this.currentWaveIndex, true);
      
      // Gib die aktuelle Map aus, um zu überprüfen, ob die Trigger richtig gesetzt werden
      //console.log('[LEVEL_MANAGER] Aktueller Stand der Level-End-Trigger-Wellen:');
      //this.levelEndTriggerWaves.forEach((value, key) => {
      //  console.log(`Welle ${key}: ${value}`);
      //});
    }
    
    // Formation und Position basierend auf Formationstyp berechnen
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    
    // Basiswerte für die X-Position (etwas außerhalb des Bildschirms)
    const baseX = screenWidth + 100;
    
    for (let i = 0; i < wave.count; i++) {
      // Y-Position und Verzögerung basierend auf der Formation berechnen
      let y = screenHeight / 2;
      let x = baseX;
      let spawnDelay = 0;
      
      switch (wave.formation) {
        case FormationType.LINE:
          // Gleichmäßig verteilt horizontal
          y = 150 + (screenHeight - 300) * (i / (wave.count - 1 || 1));
          spawnDelay = i * 300; // 300ms Abstand zwischen Spawns
          break;
        
        case FormationType.V_FORMATION:
          // V-Formation
          const center = wave.count / 2;
          const distance = Math.abs(i - center);
          y = screenHeight / 2 + (i < center ? -1 : 1) * distance * 80;
          x = baseX + distance * 50; // X-Versatz für V-Form
          spawnDelay = distance * 200;
          break;
        
        case FormationType.SQUARE:
          // Quadratische Formation
          const side = Math.ceil(Math.sqrt(wave.count));
          const row = Math.floor(i / side);
          const col = i % side;
          y = 150 + (screenHeight - 300) * (row / (side - 1 || 1));
          x = baseX + col * 50; // X-Versatz für Spalten
          spawnDelay = (row * side + col) * 150;
          break;
        
        case FormationType.RANDOM:
          // Zufällige Positionen
          y = Phaser.Math.Between(150, screenHeight - 150);
          x = baseX + Phaser.Math.Between(-50, 50);
          spawnDelay = Phaser.Math.Between(0, 1000);
          break;
        
        case FormationType.SINGLE:
        default:
          // Einzelner Gegner oder Standard
          y = 150 + (screenHeight - 300) * (i / (wave.count - 1 || 1));
          spawnDelay = i * 500;
          break;
      }
      
      // Verzögertes Spawnen des Gegners
      this.scene.time.delayedCall(
        spawnDelay,
        () => {
          // Multiplikatoren anwenden
          const options = {
            healthMultiplier: wave.healthMultiplier,
            speedMultiplier: wave.speedMultiplier
          };
          
          // Konvertiere den enemyType explizit zu einem String für den NewEnemyManager
          const enemyTypeStr = String(wave.enemyType);
          //console.log(`[LEVEL_MANAGER] Spawne Gegner vom Typ ${enemyTypeStr} an Position (${x}, ${y})`);
          
          // Gegner-Instanz erstellen und speichern
          const enemy = this.enemyManager.spawnEnemyOfType(enemyTypeStr, x, y, options);
          
          // Wenn der Gegner Teil einer Level-End-Trigger-Welle ist, markieren wir ihn
          if (wave.isLevelEndTrigger) {
            const sprite = enemy.getSprite();
            sprite.setData('isLevelEndTrigger', true);
            
            // Überprüfe, ob die Markierung erfolgreich war
            const markedValue = sprite.getData('isLevelEndTrigger');
            //console.log(`[LEVEL_MANAGER] Gegner wurde als Level-End-Trigger markiert: ${markedValue}`);
          }
        },
        [],
        this
      );
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
      // Stelle sicher, dass der Timer nicht länger als MAX_LEVEL_DURATION läuft
      
      const timer = this.scene.time.delayedCall(
        spawn.time,
        () => {
          // Wenn das Level bereits beendet ist, keine weiteren Gegner spawnen
          if (this.levelCompleted) return;
          
          console.log(`[LEVEL_MANAGER] Zeitgesteuerter Spawn: ${spawn.count}x ${spawn.enemyType}`);
          
          const options = {
            healthMultiplier: spawn.healthMultiplier,
            speedMultiplier: spawn.speedMultiplier
          };
          
          // Spawn als eigene Welle behandeln
          this.spawnWave({
            enemyType: spawn.enemyType,
            count: spawn.count,
            formation: spawn.formation,
            healthMultiplier: spawn.healthMultiplier,
            speedMultiplier: spawn.speedMultiplier
          });
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
   */
  private onLevelComplete(): void {
    // KRITISCH: Wenn der Level bereits als abgeschlossen markiert ist oder Level-Ende im Gange ist, nichts tun
    if (this.levelCompleted || this.levelEndingInProgress) {
      console.log('[LEVEL_MANAGER] Level ist bereits als abgeschlossen markiert oder Level-Ende bereits im Gange. Keine weitere Aktion notwendig.');
      return;
    }
    
    // WICHTIG: Sofort einen Lock setzen, um zu verhindern, dass parallele Aufrufe erfolgen
    this.levelEndingInProgress = true;
    console.log('[LEVEL_MANAGER] Level-Ende eingeleitet. Level-Ende-Lock aktiviert.');
    
    // WICHTIG: SOFORT alle Spawning-Prozesse stoppen
    console.log('[LEVEL_MANAGER] Stoppe alle Spawning-Prozesse und Timer...');
    this.clearAllTimers();
    
    // Wichtig: Alle Event-Listener entfernen, die neue Gegner erzeugen könnten
    this.eventBus.off(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
    
    // Simuliere einen Phaser-Framezyklus, um allen ausstehenden Operationen Zeit zu geben
    this.scene.time.delayedCall(50, () => {
      // Erzwinge sofortige Entfernung aller Gegner, die außerhalb des Bildschirms sind
      const allEnemies = this.enemyManager.getAllEnemies();
      console.log(`[LEVEL_MANAGER] Anzahl aller Gegner nach Stopp: ${allEnemies.length}`);
      
      // Wenn keine Gegner mehr da sind, können wir gleich zum nächsten Level wechseln
      if (allEnemies.length === 0) {
        this.completeLevel();
        return;
      }
      
      // Ansonsten iterieren wir über alle Gegner und entfernen die, die außerhalb sind
      let enemiesOutsideScreen = 0;
      for (let i = allEnemies.length - 1; i >= 0; i--) {
        const enemy = allEnemies[i];
        const sprite = enemy.getSprite();
        if (sprite.x < -150 || sprite.y < -150 || sprite.y > this.scene.scale.height + 150) {
          console.log(`[LEVEL_MANAGER] Gegner außerhalb des Bildschirms bei (${sprite.x}, ${sprite.y}) wird entfernt.`);
          enemy.destroy(); 
          enemiesOutsideScreen++;
        }
      }
      
      if (enemiesOutsideScreen > 0) {
        console.log(`[LEVEL_MANAGER] ${enemiesOutsideScreen} Gegner wurden außerhalb des Bildschirms gefunden und entfernt.`);
      }
      
      // Alle verbleibenden Gegner auf dem Bildschirm prüfen
      const remainingEnemies = this.enemyManager.getAllEnemies();
      console.log(`[LEVEL_MANAGER] Verbleibende Gegner auf dem Bildschirm: ${remainingEnemies.length}`);
      
      if (remainingEnemies.length > 0) {
        // Debug-Ausgaben für alle verbleibenden Gegner
        for (let i = 0; i < remainingEnemies.length; i++) {
          const enemy = remainingEnemies[i];
          const sprite = enemy.getSprite();
          console.log(`[LEVEL_MANAGER] Verbleibender Gegner ${i}: Position (${sprite.x}, ${sprite.y}), aktiv: ${sprite.active}`);
        }
        
        // Warten und erneut prüfen
        console.log('[LEVEL_MANAGER] Es sind noch Gegner aktiv. Warte, bis alle Gegner den Bildschirm verlassen haben oder zerstört wurden.');
        
        // Wenn wir warten müssen, aktualisieren wir regelmäßig
        this.checkRemainingEnemies();
      } else {
        // Keine Gegner mehr vorhanden, Level kann sofort abgeschlossen werden
        this.completeLevel();
      }
    });
  }
  
  /**
   * Überprüft regelmäßig, ob noch Gegner vorhanden sind
   */
  private checkRemainingEnemies(): void {
    if (this.levelCompleted) return;
    
    const remainingEnemies = this.enemyManager.getAllEnemies();
    console.log(`[LEVEL_MANAGER] Überprüfung auf verbleibende Gegner: ${remainingEnemies.length}`);
    
    if (remainingEnemies.length === 0) {
      console.log('[LEVEL_MANAGER] Alle Gegner wurden entfernt. Schließe Level ab.');
      this.completeLevel();
    } else {
      // Ausführliche Debug-Informationen
      for (let i = 0; i < remainingEnemies.length; i++) {
        const enemy = remainingEnemies[i];
        const sprite = enemy.getSprite();
        console.log(`[LEVEL_MANAGER] Verbleibender Gegner ${i}: Position (${sprite.x}, ${sprite.y}), aktiv: ${sprite.active}`);
        
        // Entferne Gegner, die außerhalb des Bildschirms sind
        if (sprite.x < -150 || sprite.y < -150 || sprite.y > this.scene.scale.height + 150) {
          console.log(`[LEVEL_MANAGER] Gegner ${i} ist außerhalb des Bildschirms, wird entfernt.`);
          enemy.destroy();
        }
      }
      
      // Erneute Prüfung nach einer kurzen Verzögerung
      this.scene.time.delayedCall(
        100, // Alle 100ms prüfen
        this.checkRemainingEnemies,
        [],
        this
      );
    }
  }
  
  /**
   * Schließt das Level ab und zeigt das Outro an
   */
  private completeLevel(): void {
    if (this.levelCompleted) return;
    
    console.log('[LEVEL_MANAGER] Level wird abgeschlossen!');
    
    // Level-Outro anzeigen, falls vorhanden
    if (this.currentLevel && this.currentLevel.outroText) {
      this.showLevelOutro(this.currentLevel.outroText, () => {
        // Erst hier das Level als abgeschlossen markieren
        this.levelCompleted = true;
        this.levelEndingInProgress = false; // Lock freigeben
        this.startNextLevel();
      });
    } else {
      // Verzögerung hinzufügen, bevor das nächste Level gestartet wird
      this.scene.time.delayedCall(
        2000,
        () => {
          // Erst hier das Level als abgeschlossen markieren
          this.levelCompleted = true;
          this.levelEndingInProgress = false; // Lock freigeben
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
    // Level-Timer löschen
    if (this.levelTimer) {
      this.levelTimer.remove();
      this.levelTimer = null;
    }

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
  }
  
  /**
   * Setzt den Manager zurück
   */
  private reset(): void {
    this.clearAllTimers();
    this.currentLevel = null;
    this.levelStartTime = 0;
    this.isPaused = false;
    this.levelCompleted = false;
    this.levelEndingInProgress = false; // Auch den Lock-Status zurücksetzen
    this.levelIntroShown = false;
    this.pendingWaves = [];
    this.currentWaveIndex = 0;
    this.levelEndTriggerWaves.clear();
  }
  
  /**
   * Bereinigt alle Ressourcen
   */
  public destroy(): void {
    console.log('[LEVEL_MANAGER] Manager wird zerstört');
    this.stopLevel();
    
    // Event-Listener entfernen
    this.eventBus.off(EventType.PAUSE_GAME, this.pauseLevel);
    this.eventBus.off(EventType.RESUME_GAME, this.resumeLevel);
    this.eventBus.off(EventType.GAME_OVER, this.stopLevel);
    this.eventBus.off(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
  }
  
  /**
   * Handler für zerstörte Gegner
   * Überprüft, ob alle Gegner in Level-End-Trigger-Wellen zerstört wurden
   */
  private onEnemyDestroyed = (data: any): void => {
    // Wenn bereits ein Level-Ende im Gange ist oder das Level schon abgeschlossen/pausiert ist, nichts tun
    if (this.levelCompleted || this.isPaused || this.levelEndingInProgress) return;
    
    // Versuche, das Sprite aus den Daten zu extrahieren
    const sprite = data?.sprite || data?.enemy?.getSprite?.();
    let isDestroyedEnemyTrigger = false;
    
    if (sprite && sprite.getData) {
      // Prüfe, ob der zerstörte Gegner ein Level-End-Trigger war
      isDestroyedEnemyTrigger = sprite.getData('isLevelEndTrigger') === true;
      
      if (isDestroyedEnemyTrigger) {
        console.log('[LEVEL_MANAGER] Ein Level-End-Trigger-Gegner wurde zerstört');
      }
    }
    
    // Kleine Verzögerung, um dem EnemyManager Zeit zu geben, seine Listen zu aktualisieren
    this.scene.time.delayedCall(50, () => {
      // Erneute Prüfung, ob Level-Ende schon eingeleitet wurde
      if (this.levelCompleted || this.isPaused || this.levelEndingInProgress) return;
      
      // Prüfe alle verbleibenden Gegner
      const allRemainingEnemies = this.enemyManager.getAllEnemies();
      
      // Finde Level-End-Trigger-Gegner
      const triggerEnemies = allRemainingEnemies.filter((enemy: BaseEnemy) => {
        const enemySprite = enemy.getSprite();
        return enemySprite && enemySprite.getData && enemySprite.getData('isLevelEndTrigger') === true;
      });
      
      // Zeige korrekte Anzahl der verbleibenden Trigger-Gegner an
      const remainingTriggerEnemies = triggerEnemies.length;
      
      // CRITICAL CHECK: Prüfe, ob wir Trigger-Gegner hatten und ob alle zerstört wurden
      const allTriggersDestroyed = 
          (remainingTriggerEnemies === 0) && 
          this.levelEndTriggerWaves.size > 0;
      
      // Wenn alle Trigger-Gegner zerstört wurden und keine weiteren Wellen mehr kommen
      if (allTriggersDestroyed && this.pendingWaves.length === 0) {
        console.log('[LEVEL_MANAGER] Alle Level-End-Trigger-Gegner wurden zerstört. Leite Level-Ende ein.');
        
        // Level beenden
        this.onLevelComplete();
      }
    });
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
   * Startet ein Test-Level direkt, ohne auf die GameLevels zu warten
   */
  public startTestLevel(): void {
    console.log(`[LEVEL_MANAGER] Starte Test-Level`);
    this.reset();
    
    // Erstelle ein einfaches Testlevel
    const testLevel: LevelConfig = {
      id: 'test-level',
      name: 'Test Level',
      description: 'Ein einfaches Testlevel',
      difficulty: 1,
      duration: 60000, // 1 Minute
      minAsteroids: 5,
      maxAsteroids: 10,
      asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID,
      introText: 'Test Level gestartet',
      outroText: 'Test Level beendet',
      
      waves: [
        {
          enemyType: EnemyType.STANDARD,
          count: 3,
          formation: FormationType.LINE,
          delay: 2000
        },
        {
          enemyType: EnemyType.ADVANCED,
          count: 2,
          formation: FormationType.SINGLE,
          delay: 10000
        },
        {
          enemyType: EnemyType.STANDARD,
          count: 5,
          formation: FormationType.V_FORMATION,
          delay: 15000,
          isLevelEndTrigger: true
        }
      ]
    };
    
    // Setze aktuelle Level-Daten
    this.currentLevelIndex = 0;
    this.currentLevel = testLevel;
    console.log(`[LEVEL_MANAGER] Test-Level gesetzt: ${this.currentLevel.name}`);
    console.log(`[LEVEL_MANAGER] Test-Level hat ${this.currentLevel.waves.length} Wellen`);
    
    // Setze Schwierigkeit auf Level-Schwierigkeit
    this.difficultyManager.setDifficulty(this.currentLevel.difficulty);
    
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
      this.showLevelIntro(this.currentLevel.introText, () => {
        this.startLevelTimer();
        this.levelIntroShown = true;
      });
    } else {
      this.startLevelTimer();
    }
    
    // Wellen vorbereiten
    this.pendingWaves = [...this.currentLevel.waves];
    console.log(`[LEVEL_MANAGER] Test-Level Wellen vorbereitet: ${this.pendingWaves.length}`);
    this.startNextWave();
    
    this.levelStartTime = this.scene.time.now;
    console.log(`[LEVEL_MANAGER] Test-Level gestartet: ${this.currentLevel.name}`);
  }
} 