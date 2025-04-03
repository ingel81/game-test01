/**
 * LevelManager
 * Verwaltet die Level, deren Progression und Konfiguration
 */

import { EventBus, EventType } from '../utils/eventBus';
import { LevelConfig, Wave, TimedSpawn, TimedPickup, EnemyType, PickupType, Levels } from '../config/levelConfig';
import { Constants } from '../utils/constants';
import { GameScene } from '../scenes/gameScene';
import { MusicManager } from './musicManager';
import { SpawnManager } from './spawnManager';
import { NewEnemyManager } from './newEnemyManager';
import { DifficultyManager } from './difficultyManager';

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
    this.eventBus.on(EventType.BOSS_DESTROYED, this.onBossDestroyed);
  }
  
  /**
   * Startet das Level mit dem angegebenen Index
   */
  public startLevel(levelIndex: number): void {
    console.log(`[LEVEL_MANAGER] Starte Level ${levelIndex}`);
    this.reset();
    
    // Prüfe, ob Level existiert
    if (levelIndex < 0 || levelIndex >= Levels.length) {
      console.error(`[LEVEL_MANAGER] Level ${levelIndex} existiert nicht!`);
      return;
    }
    
    // Setze aktuelle Level-Daten
    this.currentLevelIndex = levelIndex;
    this.currentLevel = Levels[levelIndex];
    
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
      this.musicManager.playTrack(this.currentLevel.music);
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
    
    if (nextLevelIndex < Levels.length) {
      this.startLevel(nextLevelIndex);
    } else {
      console.log('[LEVEL_MANAGER] Keine weiteren Level verfügbar. Spiel abgeschlossen!');
      // Hier könnte ein Spiel-Ende-Event oder ähnliches ausgelöst werden
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
    
    // Timer für die Welle erstellen
    const waveTimer = this.scene.time.delayedCall(
      delay,
      () => {
        this.spawnWave(nextWave);
        // Nächste Welle starten nach einer kleinen Pause
        const nextWaveTimer = this.scene.time.delayedCall(
          2000, // 2 Sekunden Pause zwischen Wellen
          this.startNextWave,
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
        case 'line':
          // Gleichmäßig verteilt horizontal
          y = 150 + (screenHeight - 300) * (i / (wave.count - 1 || 1));
          spawnDelay = i * 300; // 300ms Abstand zwischen Spawns
          break;
        
        case 'vFormation':
          // V-Formation
          const center = wave.count / 2;
          const distance = Math.abs(i - center);
          y = screenHeight / 2 + (i < center ? -1 : 1) * distance * 80;
          x = baseX + distance * 50; // X-Versatz für V-Form
          spawnDelay = distance * 200;
          break;
        
        case 'square':
          // Quadratische Formation
          const side = Math.ceil(Math.sqrt(wave.count));
          const row = Math.floor(i / side);
          const col = i % side;
          y = 150 + (screenHeight - 300) * (row / (side - 1 || 1));
          x = baseX + col * 50; // X-Versatz für Spalten
          spawnDelay = (row * side + col) * 150;
          break;
        
        case 'random':
          // Zufällige Positionen
          y = Phaser.Math.Between(150, screenHeight - 150);
          x = baseX + Phaser.Math.Between(-50, 50);
          spawnDelay = Phaser.Math.Between(0, 1000);
          break;
        
        case 'single':
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
          
          this.enemyManager.spawnEnemyOfType(wave.enemyType, x, y, options);
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
   * Handler für Boss-Zerstörung
   */
  private onBossDestroyed = (): void => {
    console.log('[LEVEL_MANAGER] Boss wurde zerstört');
    
    if (this.levelCompleted) return;
    
    // Level abschließen, wenn alle Wellen vorbei sind und der Boss besiegt wurde
    if (this.pendingWaves.length === 0) {
      this.onLevelComplete();
    }
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
    const introText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      text,
      {
        fontSize: '32px',
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
    this.scene.tweens.add({
      targets: introText,
      alpha: 1,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.scene.time.delayedCall(
          2000,
          () => {
            this.scene.tweens.add({
              targets: introText,
              alpha: 0,
              duration: 1000,
              ease: 'Linear',
              onComplete: () => {
                introText.destroy();
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
    const outroText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      text,
      {
        fontSize: '32px',
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
    this.scene.tweens.add({
      targets: outroText,
      alpha: 1,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.scene.time.delayedCall(
          2000,
          () => {
            this.scene.tweens.add({
              targets: outroText,
              alpha: 0,
              duration: 1000,
              ease: 'Linear',
              onComplete: () => {
                outroText.destroy();
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
  }
} 