import { BaseScene, DebugMode } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType } from '../utils/eventBus';
import { Player } from '../entities/player/player';
import { SpawnManager } from '../managers/spawnManager';
import { CollisionManager } from '../managers/collisionManager';
import { GameUI } from '../ui/gameUI';
import { MusicManager } from '../managers/musicManager';
import { NewEnemyManager } from '../managers/enemyManager';
import { GlowPipeline } from '../pipelines/glowPipeline';
import { LevelManager } from '../managers/levelManager';
import { AssetLoader } from '../utils/assetLoader';
import { AssetManager, AssetCategory } from '../utils/assetManager';

/**
 * Hauptspielszene
 */
export class GameScene extends BaseScene {
  private player!: Player;
  private spawnManager!: SpawnManager;
  private enemyManager!: NewEnemyManager;
  private collisionManager!: CollisionManager;
  private uiManager!: GameUI;
  private levelManager!: LevelManager;
  private musicManager: MusicManager;
  private score: number = 0;
  private isPaused: boolean = false;
  private mouseMoveTimer: number = 0;
  private mouseCursorVisible: boolean = false;
  private readonly mouseHideDelay: number = 3000; // 3 Sekunden
  private glowPipeline!: GlowPipeline;

  constructor() {
    super(Constants.SCENE_GAME);
    this.musicManager = MusicManager.getInstance();
  }

  /**
   * Ressourcen vorladen
   */
  preload(): void {
    super.preload();

    console.log('[GAME_SCENE] Lade alle Spielassets...');

    // Verwende den AssetManager für spielspezifische Assets
    try {
      const assetManager = AssetManager.getInstance();
      
      assetManager.loadAssetsByCategory(this, [
        AssetCategory.PLAYER,
        AssetCategory.ENEMY,
        AssetCategory.BULLET,
        AssetCategory.EXPLOSION,
        AssetCategory.ASTEROID,
        AssetCategory.PICKUP
      ]);
      
      console.log('[GAME_SCENE] Alle Assets wurden geladen');
    } catch (error) {
      console.error('[GAME_SCENE] Fehler beim Laden der Assets:', error);
    }
  }

  /**
   * Erstellt die Spielszene
   */
  create(): void {
    try {
      super.create();

      // Initialisiere den MusicManager und starte die Gameplay-Musik
      this.musicManager.init(this);
      
      // Debug-Ausgabe
      console.log('GameScene: Initialisierung startet');
      
      // Setze alle Spielvariablen zurück
      this.score = 0;
      this.isPaused = false;
      this.mouseMoveTimer = 0;
      this.mouseCursorVisible = false;
      
      // Schwarzer Hintergrund für Weltraum-Feeling
      this.cameras.main.setBackgroundColor('#000000');
      
      // Mauszeiger direkt beim Spielstart ausblenden
      document.body.style.cursor = 'none';
      this.mouseCursorVisible = false;
      this.mouseMoveTimer = this.time.now;
      
      // Mauszeiger-Ausblendung konfigurieren
      this.setupMouseHiding();
      
      // Kamera für flüssigeres Scrolling optimieren
      this.cameras.main.setRoundPixels(true);
      
      // Erstelle die Glow-Pipeline
      this.glowPipeline = new GlowPipeline(this.game);
      if (this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
        this.game.renderer.pipelines.add('Glow', this.glowPipeline);
      }
      
      // Die Explosions-Animation wird jetzt automatisch vom AssetLoader erstellt
      
      console.log('GameScene: Erstelle Spieler');
      // Erstelle den Spieler
      this.player = new Player(this, this.scale.width * 0.2, this.scale.height * 0.5);      
     
      // Erstelle den EnemyManager
      console.log('GameScene: Erstelle EnemyManager');
      this.enemyManager = new NewEnemyManager(this, this.player);
      this.registry.set('enemyManager', this.enemyManager);

      // Erstelle den SpawnManager
      console.log('GameScene: Erstelle SpawnManager');
      this.spawnManager = new SpawnManager(this);
      
      // Erstelle den CollisionManager und setze die Manager
      console.log('GameScene: Erstelle CollisionManager');
      this.collisionManager = new CollisionManager(this, this.player);
      this.collisionManager.setManagers(this.enemyManager, this.spawnManager);
      
      // Erstelle die Game-UI
      console.log('GameScene: Erstelle Game-UI');
      this.uiManager = new GameUI(this, this.player);
      // UI-Manager in der Registry registrieren, damit andere Klassen darauf zugreifen können
      this.registry.set('uiManager', this.uiManager);
      
      // Erstelle den LevelManager und starte das erste Level
      console.log('GameScene: Erstelle LevelManager');
      this.levelManager = new LevelManager(this, this.enemyManager, this.spawnManager);
      
      // Event-Listener hinzufügen
      console.log('GameScene: Registriere Event-Listener');
      this.events.on('shutdown', this.cleanup, this);
      this.events.on('destroy', this.cleanup, this);
      
      // Event-Listen für Score-Updates
      this.eventBus.on(EventType.SCORE_CHANGED, this.updateScore);
      
      // Event-Listener für zerstörte Feinde und Asteroiden hinzufügen
      this.eventBus.on(EventType.ENEMY_DESTROYED, (data) => {
        if (data && data.enemy && data.enemy.scoreValue) {
          this.updateScore(data.enemy.scoreValue);
        } else if (data && typeof data.score === 'number') {
          this.updateScore(data.score);
        }
      });
      
      this.eventBus.on(EventType.ASTEROID_DESTROYED, (points) => {
        this.updateScore(points);
      });
      
      // Event-Listeners für Pause
      this.eventBus.on(EventType.PAUSE_GAME, this.pauseGame);
      this.eventBus.on(EventType.RESUME_GAME, this.resumeGame);
      
      // Event-Listener für Game Over
      this.eventBus.on(EventType.PLAYER_DESTROYED, this.endGame);
      
      // Event-Listener für Game Won
      this.eventBus.on(EventType.GAME_WON, this.gameWon);
      
      // Tastendruck-Listener für ESC-Taste
      this.input.keyboard?.on('keydown-ESC', this.togglePause, this);
      
      // Starte das erste Level
      console.log('GameScene: Starte erstes Level');
      
      // Starte das erste reguläre Level
      this.levelManager.startLevel(0);
      
      console.log('GameScene: Initialisierung abgeschlossen');
    } catch (error) {
      console.error('Fehler beim Erstellen der GameScene:', error);
    }
  }

  /**
   * Update-Methode, wird jeden Frame aufgerufen
   */
  update(time: number, delta: number): void {
    if (this.isPaused) return;
    
    super.update(time, delta);
    
    // Update Player
    this.player.update(time, delta);
    
    // Update EnemyManager
    this.enemyManager.update(time, delta);
    
    // Update CollisionManager
    this.collisionManager.update(time, delta);
    
    // Update UI
    this.uiManager.update(time, delta);
    
    // Prüfe Mausbewegungen für Cursor-Ausblendung
    this.updateMouseHiding(time);
  }

  /**
   * Aktualisiert den Score
   */
  private updateScore = (points: number): void => {
    this.score += points;
    this.uiManager.updateScore(this.score);
  }

  /**
   * Konfiguriert die Mauszeiger-Ausblendung
   */
  private setupMouseHiding(): void {
    this.input.on('pointermove', () => {
      if (!this.mouseCursorVisible) {
        document.body.style.cursor = 'default';
        this.mouseCursorVisible = true;
      }
      this.mouseMoveTimer = this.time.now;
    });
  }

  /**
   * Aktualisiert die Mauszeiger-Ausblendung
   */
  private updateMouseHiding(time: number): void {
    if (this.mouseCursorVisible && time - this.mouseMoveTimer > this.mouseHideDelay) {
      document.body.style.cursor = 'none';
      this.mouseCursorVisible = false;
    }
  }

  /**
   * Blendet den Mauszeiger aus
   */
  private hideCursor(): void {
    document.body.style.cursor = 'none';
    this.mouseCursorVisible = false;
  }

  /**
   * Wechselt zwischen Pause und Spielmodus
   */
  private togglePause(): void {
    if (this.isPaused) {
      this.eventBus.emit(EventType.RESUME_GAME);
    } else {
      this.eventBus.emit(EventType.PAUSE_GAME);
    }
  }

  /**
   * Pausiert das Spiel
   */
  private pauseGame = (): void => {
    if (this.isPaused) return;
    
    this.isPaused = true;
    
    // Bei Pause immer den Cursor anzeigen
    document.body.style.cursor = 'default';
    this.mouseCursorVisible = true;
    
    // Zeige Pause-Menü an
    this.scene.pause();
    this.scene.launch(Constants.SCENE_PAUSE, { score: this.score });
  }

  /**
   * Setzt das Spiel fort
   */
  private resumeGame = (): void => {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    
    // Bei Fortsetzung den Cursor wieder ausblenden
    this.hideCursor();
    this.mouseMoveTimer = this.time.now;
    
    this.scene.resume();
  }

  /**
   * Beendet das Spiel
   */
  private endGame = (): void => {
    this.scene.start(Constants.SCENE_GAME_OVER, { score: this.score });
  }

  /**
   * Spiel gewonnen Handler
   */
  private gameWon = (): void => {
    // Alle Sounds stoppen
    this.sound.stopAll();
    
    // Zur Finished Scene wechseln
    this.scene.start(Constants.SCENE_FINISHED, { score: this.score });
  }

  /**
   * Bereinigt alle Ressourcen
   */
  private cleanup(): void {
    console.log('GameScene: Cleanup');
    
    // Entferne alle Event-Listener
    this.eventBus.off(EventType.SCORE_CHANGED, this.updateScore);
    this.eventBus.off(EventType.PAUSE_GAME, this.pauseGame);
    this.eventBus.off(EventType.RESUME_GAME, this.resumeGame);
    this.eventBus.off(EventType.PLAYER_DESTROYED, this.endGame);
    this.eventBus.off(EventType.GAME_WON, this.gameWon);
    
    // Entferne spezifische Event-Listener (wir können keine Referenz auf die Lambdas haben,
    // also entfernen wir alle Listener für diese Events)
    this.eventBus.removeAllListeners(EventType.ENEMY_DESTROYED);
    this.eventBus.removeAllListeners(EventType.ASTEROID_DESTROYED);
    
    this.input.keyboard?.off('keydown-ESC', this.togglePause, this);
    
    // Zerstöre alle Manager und UI
    if (this.levelManager) this.levelManager.destroy();
    if (this.spawnManager) this.spawnManager.destroy();
    if (this.enemyManager) this.enemyManager.destroy();
    if (this.player) this.player.destroy();
    if (this.uiManager) this.uiManager.destroy();
    
    // Pipeline entfernen
    if (this.glowPipeline && this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      this.game.renderer.pipelines.remove('Glow');
    }
  }
} 