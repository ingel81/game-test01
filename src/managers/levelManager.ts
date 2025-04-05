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
    console.log(`[LEVEL_MANAGER] Starte Level ${levelIndex}`);
    console.log(`[LEVEL_MANAGER] GameLevels verfügbar: ${GameLevels.length}`);
    console.log(`[LEVEL_MANAGER] GameLevels[0] ist: ${GameLevels[0]?.name || 'undefined'}`);
    this.reset();
    
    // Prüfe, ob Level existiert
    if (levelIndex < 0 || levelIndex >= GameLevels.length) {
      console.error(`[LEVEL_MANAGER] Level ${levelIndex} existiert nicht!`);
      return;
    }
    
    // Setze aktuelle Level-Daten
    this.currentLevelIndex = levelIndex;
    this.currentLevel = GameLevels[levelIndex];
    console.log(`[LEVEL_MANAGER] Level gesetzt auf: ${this.currentLevel?.name || 'undefined'}`);
    console.log(`[LEVEL_MANAGER] Level hat ${this.currentLevel?.waves?.length || 0} Wellen`);
    
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
        console.log(`[LEVEL_MANAGER] Versuche Musik zu spielen: ${this.currentLevel.music}`);
        // Prüfe, ob die Musik im Cache existiert
        if (this.scene.cache.audio.exists(this.currentLevel.music)) {
          this.musicManager.playTrack(this.currentLevel.music);
        } else {
          console.log(`[LEVEL_MANAGER] Musik '${this.currentLevel.music}' nicht gefunden, spiele zufällige Musik`);
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
    
    // Wellen vorbereiten
    this.pendingWaves = [...this.currentLevel.waves];
    this.startNextWave();
    
    // Zeitgesteuerte Spawns starten, falls vorhanden
    if (this.currentLevel.timedSpawns) {
      this.setupTimedSpawns(this.currentLevel.timedSpawns);
    }
    
    // Zeitgesteuerte Pickups starten, falls vorhanden
    if (this.currentLevel.timedPickups) {
      this.setupTimedPickups(this.currentLevel.timedPickups);
    }
    
    this.levelStartTime = this.scene.time.now;
    console.log(`[LEVEL_MANAGER] Level ${this.currentLevel.name} gestartet`);
  }
  
  /**
   * Startet das nächste Level
   */
  public startNextLevel(): void {
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
    console.log('[LEVEL_MANAGER] Level wird gestoppt');
    this.clearAllTimers();
    this.isPaused = true;
  }
  
  /**
   * Pausiert das aktuelle Level
   */
  private pauseLevel = (): void => {
    if (this.isPaused) return;
    
    console.log('[LEVEL_MANAGER] Level pausiert');
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
    
    console.log('[LEVEL_MANAGER] Level fortgesetzt');
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
    
    this.levelTimer = this.scene.time.delayedCall(
      this.currentLevel.duration,
      this.onLevelComplete,
      [],
      this
    );
  }
  
  /**
   * Startet die nächste Welle
   */
  private startNextWave(): void {
    console.log(`[LEVEL_MANAGER] startNextWave aufgerufen, verbleibende Wellen: ${this.pendingWaves.length}`);
    
    if (this.pendingWaves.length === 0) {
      console.log('[LEVEL_MANAGER] Alle Wellen abgeschlossen. Warte auf Levelende oder Boss.');
      return;
    }
    
    const nextWave = this.pendingWaves.shift();
    if (!nextWave) return;
    
    this.currentWaveIndex++;
    console.log(`[LEVEL_MANAGER] Starte Welle ${this.currentWaveIndex}: ${nextWave.count}x ${nextWave.enemyType} in ${nextWave.formation}`);
    
    // Verzögerung für die Welle, falls angegeben
    const delay = nextWave.delay || 0;
    console.log(`[LEVEL_MANAGER] Welle wird in ${delay}ms gestartet`);
    
    // Timer für die Welle erstellen
    const waveTimer = this.scene.time.delayedCall(
      delay,
      () => {
        console.log(`[LEVEL_MANAGER] Wave Timer fired after ${delay}ms delay`);
        this.spawnWave(nextWave);
        // Nächste Welle starten nach einer kleinen Pause
        const nextWaveTimer = this.scene.time.delayedCall(
          2000, // 2 Sekunden Pause zwischen Wellen
          () => {
            console.log(`[LEVEL_MANAGER] Next Wave Timer fired after 2000ms delay`);
            this.startNextWave();
          },
          [],
          this
        );
        this.waveTimers.push(nextWaveTimer);
      },
      [],
      this
    );
    
    this.waveTimers.push(waveTimer);
  }
  
  /**
   * Spawnt eine Welle von Gegnern
   */
  private spawnWave(wave: Wave): void {
    console.log(`[LEVEL_MANAGER] Spawne Welle: ${wave.count}x ${wave.enemyType}`);
    console.log(`[LEVEL_MANAGER] Formation: ${wave.formation}, Delay: ${wave.delay || 'undefined'}`);
    console.log(`[LEVEL_MANAGER] Health Multiplier: ${wave.healthMultiplier || 1}, Speed Multiplier: ${wave.speedMultiplier || 1}`);
    
    // Check EnemyType values
    console.log(`[LEVEL_MANAGER] EnemyType value: ${wave.enemyType}, type: ${typeof wave.enemyType}`);
    console.log(`[LEVEL_MANAGER] EnemyType.STANDARD value: ${EnemyType.STANDARD}, type: ${typeof EnemyType.STANDARD}`);
    
    // Wenn diese Welle ein Level-End-Trigger ist, merken wir uns das
    if (wave.isLevelEndTrigger) {
      console.log(`[LEVEL_MANAGER] Welle ${this.currentWaveIndex} wurde als Level-End-Trigger markiert`);
      this.levelEndTriggerWaves.set(this.currentWaveIndex, true);
      
      // Gib die aktuelle Map aus, um zu überprüfen, ob die Trigger richtig gesetzt werden
      console.log('[LEVEL_MANAGER] Aktueller Stand der Level-End-Trigger-Wellen:');
      this.levelEndTriggerWaves.forEach((value, key) => {
        console.log(`Welle ${key}: ${value}`);
      });
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
          console.log(`[LEVEL_MANAGER] Spawne Gegner vom Typ ${enemyTypeStr} an Position (${x}, ${y})`);
          
          // Gegner-Instanz erstellen und speichern
          const enemy = this.enemyManager.spawnEnemyOfType(enemyTypeStr, x, y, options);
          
          // Wenn der Gegner Teil einer Level-End-Trigger-Welle ist, markieren wir ihn
          if (wave.isLevelEndTrigger) {
            const sprite = enemy.getSprite();
            sprite.setData('isLevelEndTrigger', true);
            
            // Überprüfe, ob die Markierung erfolgreich war
            const markedValue = sprite.getData('isLevelEndTrigger');
            console.log(`[LEVEL_MANAGER] Gegner wurde als Level-End-Trigger markiert: ${markedValue}`);
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
  private setupTimedSpawns(timedSpawns: TimedSpawn[]): void {
    timedSpawns.forEach(spawn => {
      const timer = this.scene.time.delayedCall(
        spawn.time,
        () => {
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
   * Richtet zeitgesteuerte Pickup-Spawns ein
   */
  private setupTimedPickups(timedPickups: TimedPickup[]): void {
    timedPickups.forEach(pickup => {
      const timer = this.scene.time.delayedCall(
        pickup.time,
        () => {
          // Wenn das Level bereits beendet ist, keine weiteren Pickups spawnen
          if (this.levelCompleted) return;
          
          console.log(`[LEVEL_MANAGER] Zeitgesteuerter Pickup: ${pickup.count}x ${pickup.type}`);
          
          for (let i = 0; i < pickup.count; i++) {
            // Verzögertes Spawnen der Pickups
            this.scene.time.delayedCall(
              i * 500, // 500ms Abstand zwischen Spawns
              () => {
                const x = this.scene.scale.width + 50;
                const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
                
                if (pickup.type === PickupType.ENERGY) {
                  this.spawnManager.spawnEnergyPickup(x, y);
                } else if (pickup.type === PickupType.POWER) {
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
   * Handler für Level-Abschluss
   */
  private onLevelComplete(): void {
    if (this.levelCompleted) return;
    
    console.log('[LEVEL_MANAGER] Level abgeschlossen!');
    this.levelCompleted = true;
    
    // Level-Outro anzeigen, falls vorhanden
    if (this.currentLevel && this.currentLevel.outroText) {
      this.showLevelOutro(this.currentLevel.outroText, () => {
        this.startNextLevel();
      });
    } else {
      // Verzögerung hinzufügen, bevor das nächste Level gestartet wird
      this.scene.time.delayedCall(
        2000,
        this.startNextLevel,
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
   * Löscht alle Timer
   */
  private clearAllTimers(): void {
    if (this.levelTimer) {
      this.levelTimer.remove();
      this.levelTimer = null;
    }
    
    this.waveTimers.forEach(timer => timer.remove());
    this.waveTimers = [];
    
    this.timedSpawnTimers.forEach(timer => timer.remove());
    this.timedSpawnTimers = [];
    
    this.timedPickupTimers.forEach(timer => timer.remove());
    this.timedPickupTimers = [];
    
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
    // Wenn der Level bereits abgeschlossen ist, nichts tun
    if (this.levelCompleted) return;
    
    console.log('[LEVEL_MANAGER] onEnemyDestroyed wurde aufgerufen');
    
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
    
    // Prüfe alle verbleibenden Gegner
    const allRemainingEnemies = this.enemyManager.getAllEnemies();
    console.log(`[LEVEL_MANAGER] Verbleibende Gegner: ${allRemainingEnemies.length - 1}`);
    
    // Finde Level-End-Trigger-Gegner
    const triggerEnemies = allRemainingEnemies.filter((enemy: BaseEnemy) => {
      const enemySprite = enemy.getSprite();
      return enemySprite && enemySprite.getData && enemySprite.getData('isLevelEndTrigger') === true;
    });
    
    // Korrektur: Zeige korrekte Anzahl der verbleibenden Trigger-Gegner an
    const remainingTriggerEnemies = isDestroyedEnemyTrigger ? triggerEnemies.length - 1 : triggerEnemies.length;
    console.log(`[LEVEL_MANAGER] Verbleibende Level-End-Trigger-Gegner: ${remainingTriggerEnemies}`);
    
    // CRITICAL CHECK: Prüfe, ob wir Trigger-Gegner hatten (Map sollte nicht leer sein)
    // und ob alle Trigger-Gegner zerstört wurden
    const allTriggersDestroyed = 
        (remainingTriggerEnemies === 0) && 
        this.levelEndTriggerWaves.size > 0;
    
    // Debug-Ausgabe für die Bedingungselemente
    console.log(`[LEVEL_MANAGER] Level-End Bedingung: allTriggersDestroyed=${allTriggersDestroyed}, pendingWaves=${this.pendingWaves.length}, levelEndTriggerWaves.size=${this.levelEndTriggerWaves.size}`);
        
    if (allTriggersDestroyed && this.pendingWaves.length === 0) {
      
      console.log('[LEVEL_MANAGER] Alle Level-End-Trigger-Gegner wurden zerstört. Beende Level.');
      
      // Timer sofort stoppen und entfernen
      if (this.levelTimer) {
        console.log('[LEVEL_MANAGER] Stoppe Level-Timer');
        this.levelTimer.remove();
        this.levelTimer = null;
      }
      
      // WICHTIG: Verzögerung einbauen, um Race-Conditions zu vermeiden
      this.scene.time.delayedCall(
        100, // Kleine Verzögerung
        () => {
          // Level sofort abschließen
          this.onLevelComplete();
        }
      );
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