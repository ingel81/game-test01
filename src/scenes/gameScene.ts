import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType } from '../utils/eventBus';
import { Player } from '../entities/player/player';
import { SpawnManager } from '../managers/spawnManager';
import { CollisionManager } from '../managers/collisionManager';
import { GameUI } from '../ui/gameUI';
import { DifficultyManager } from '../managers/difficultyManager';
import { MusicManager } from '../managers/musicManager';
import { NewEnemyManager } from '../managers/newEnemyManager';
import { GlowPipeline } from '../pipelines/glowPipeline';

/**
 * Hauptspielszene
 */
export class GameScene extends BaseScene {
  private player!: Player;
  private spawnManager!: SpawnManager;
  private enemyManager!: NewEnemyManager;
  private collisionManager!: CollisionManager;
  private uiManager!: GameUI;
  private difficultyManager!: DifficultyManager;
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
   * Lädt Assets für die Spielszene
   */
  preload(): void {
    super.preload();

    // Lade die Spieler-Assets
    this.load.image(Constants.ASSET_PLAYER, Constants.getAssetPath('player/sprites/player1.png'));
    this.load.image(Constants.ASSET_PLAYER_UP, Constants.getAssetPath('player/sprites/player2.png'));
    this.load.image(Constants.ASSET_PLAYER_DOWN, Constants.getAssetPath('player/sprites/player3.png'));
    this.load.image(Constants.ASSET_BULLET, Constants.getAssetPath('shoot/shoot1.png'));
    
    // Lade die Feind-Assets
    this.load.image(Constants.ASSET_ENEMY_BULLET, Constants.getAssetPath('shoot/shoot2.png'));
    this.load.image(Constants.ASSET_ENEMY01, Constants.getAssetPath(`enemy/sprites/${Constants.ASSET_ENEMY01}.png`));
    this.load.image(Constants.ASSET_ENEMY02, Constants.getAssetPath(`enemy/sprites/${Constants.ASSET_ENEMY02}.png`));
    this.load.image(Constants.ASSET_BOSS01, Constants.getAssetPath(`enemy/sprites/${Constants.ASSET_BOSS01}.png`));
    
    // Lade die Turret-Assets
    this.load.image(Constants.ASSET_TURRET_BASE, Constants.getAssetPath('enemy/sprites/turret01_base.png'));
    this.load.image(Constants.ASSET_TURRET_TOP, Constants.getAssetPath('enemy/sprites/turret01_top.png'));
    
    // Lade die Umgebungs-Assets
    this.load.image(Constants.ASSET_ASTEROID, Constants.getAssetPath('asteroids/asteroid.png'));
    this.load.image(Constants.ASSET_ASTEROID_SMALL, Constants.getAssetPath('asteroids/asteroid-small.png'));
    
    // Lade die Explosions-Animation
    this.load.image(Constants.ASSET_EXPLOSION_1, Constants.getAssetPath('explosion/sprites/explosion1.png'));
    this.load.image(Constants.ASSET_EXPLOSION_2, Constants.getAssetPath('explosion/sprites/explosion2.png'));
    this.load.image(Constants.ASSET_EXPLOSION_3, Constants.getAssetPath('explosion/sprites/explosion3.png'));
    this.load.image(Constants.ASSET_EXPLOSION_4, Constants.getAssetPath('explosion/sprites/explosion4.png'));
    this.load.image(Constants.ASSET_EXPLOSION_5, Constants.getAssetPath('explosion/sprites/explosion5.png'));
    
    // Sounds werden in BaseScene geladen
  }

  /**
   * Erstellt die Spielszene
   */
  create(): void {
    try {
      super.create();

      // Initialisiere den MusicManager und starte die Gameplay-Musik
      this.musicManager.init(this);
      this.musicManager.playRandomGameplayTrack();

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
            
            console.log('GameScene: Erstelle Explosion-Animation');
            // Erstelle die Explosions-Animation
            if (!this.anims.exists('explode')) {
              this.anims.create({
                key: 'explode',
                frames: [
                  { key: Constants.ASSET_EXPLOSION_1 },
                  { key: Constants.ASSET_EXPLOSION_2 },
                  { key: Constants.ASSET_EXPLOSION_3 },
                  { key: Constants.ASSET_EXPLOSION_4 },
                  { key: Constants.ASSET_EXPLOSION_5 }
                ],
                frameRate: 10,
                repeat: 0,
                hideOnComplete: true
              });
            }
      // Erstelle den Spieler
      this.player = new Player(this, 100, this.scale.height / 2);
      
      // Aktiviere die Glow-Pipeline für die Schüsse
      if (this.player instanceof Player) {
        this.player.getWeapon().setBulletPipeline('Glow');
      }
      
      console.log('GameScene: Erstelle Manager');
      // Erstelle die Manager
      this.createManagers();
      this.uiManager = new GameUI(this);

      // Verknüpfe die Manager
      this.collisionManager.setManagers(this.enemyManager, this.spawnManager);

      console.log('GameScene: Event-Listener registrieren');
      // Event-Listener
      this.eventBus.on(EventType.PAUSE_GAME, this.pauseGame);
      this.eventBus.on(EventType.RESUME_GAME, this.resumeGame);
      this.eventBus.on(EventType.GAME_OVER, this.gameOver);
      this.eventBus.on(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
      
      // ESC-Taste zum Pausieren des Spiels
      this.input.keyboard.on('keydown-ESC', () => {
        this.eventBus.emit(EventType.PAUSE_GAME);
      });
      
      // Neue Event-Listener für Spieler-Gesundheit
      this.eventBus.on(EventType.PLAYER_DAMAGED, this.onPlayerDamaged);
      this.eventBus.on(EventType.PLAYER_HEALED, this.onPlayerHealed);
      
      // Initiale Aktualisierung der Gesundheitsanzeige
      this.uiManager.updateHealth(this.player.getHealth());
      
      // Optimiere die Performance
      this.physics.world.setFPS(60);
      this.physics.world.fixedStep = true;

      console.log('GameScene: Initialisierung abgeschlossen');
    } catch (error) {
      console.error('Fehler beim Erstellen der Spielszene:', error);
      this.scene.start(Constants.SCENE_MAIN_MENU);
    }
  }

  /**
   * Konfiguriert die Mauszeiger-Ausblendung
   */
  private setupMouseHiding(): void {
    // Event-Listener für Mausbewegung hinzufügen
    this.input.on('pointermove', () => {
      // Timer zurücksetzen bei Mausbewegung
      this.mouseMoveTimer = this.time.now;
      
      // Cursor kurz anzeigen, wenn sich die Maus bewegt
      if (!this.mouseCursorVisible) {
        this.showCursor();
        
        // Nach Verzögerung wieder ausblenden
        this.time.delayedCall(this.mouseHideDelay, () => {
          if (!this.isPaused && this.scene.isActive()) {
            this.hideCursor();
          }
        });
      }
    });
  }
  
  /**
   * Zeigt den Mauszeiger an
   */
  private showCursor(): void {
    if (!this.mouseCursorVisible) {
      document.body.style.cursor = 'default';
      this.mouseCursorVisible = true;
    }
  }
  
  /**
   * Blendet den Mauszeiger aus
   */
  private hideCursor(): void {
    if (this.mouseCursorVisible) {
      document.body.style.cursor = 'none';
      this.mouseCursorVisible = false;
    }
  }

  /**
   * Aktualisiert die Spielszene
   */
  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Rufe zuerst die BaseScene-Update-Methode auf, um die Sterne zu aktualisieren
    super.update(time, delta);

    try {
      // Aktualisiere die Spielobjekte
      this.player.update(time, delta);
      this.spawnManager.update(time, delta);
      this.enemyManager.update(time, delta);
      this.collisionManager.update(time, delta);
      this.difficultyManager.update(time, delta);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Spielszene:', error);
      this.gameOver();
    }
  }

  /**
   * Pausiert das Spiel
   */
  private pauseGame = (): void => {
    if (this.isPaused) return;
    
    this.isPaused = true;
    
    // Bei Pause immer den Cursor anzeigen
    this.showCursor();
    
    this.scene.launch(Constants.SCENE_PAUSE);
    this.scene.pause();
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
  private gameOver = (): void => {
    try {
      // Stelle sicher, dass der Cursor wieder sichtbar ist
      document.body.style.cursor = 'default';
      
      // Entferne Event-Listener
      this.eventBus.off(EventType.PAUSE_GAME, this.pauseGame);
      this.eventBus.off(EventType.RESUME_GAME, this.resumeGame);
      this.eventBus.off(EventType.GAME_OVER, this.gameOver);
      this.eventBus.off(EventType.PLAYER_DAMAGED, this.onPlayerDamaged);
      this.eventBus.off(EventType.PLAYER_HEALED, this.onPlayerHealed);
      this.eventBus.off(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
      
      // Entferne Tastatur-Listener
      this.input.keyboard.off('keydown-ESC');
      
      // Stoppe die Musik
      this.musicManager.stopCurrentMusic();
      
      // Bereinige Enemy Manager
      if (this.enemyManager) {
        this.enemyManager.destroy();
      }
      
      // Starte Game Over Szene
      this.scene.start(Constants.SCENE_GAME_OVER, { score: this.score });
    } catch (error) {
      console.error('Fehler beim Beenden des Spiels:', error);
      this.scene.start(Constants.SCENE_MAIN_MENU);
    }
  }

  /**
   * Wird aufgerufen, wenn die Szene zerstört wird
   */
  destroy(): void {
    try {
      // Entferne Event-Listener
      this.eventBus.off(EventType.PAUSE_GAME, this.pauseGame);
      this.eventBus.off(EventType.RESUME_GAME, this.resumeGame);
      this.eventBus.off(EventType.GAME_OVER, this.gameOver);
      this.eventBus.off(EventType.PLAYER_DAMAGED, this.onPlayerDamaged);
      this.eventBus.off(EventType.PLAYER_HEALED, this.onPlayerHealed);
      this.eventBus.off(EventType.ENEMY_DESTROYED, this.onEnemyDestroyed);
      
      // Entferne Tastatur-Listener
      this.input.keyboard.off('keydown-ESC');
      
      // Stoppe die Musik
      this.musicManager.stopCurrentMusic();
      
      // Bereinige Enemy Manager
      if (this.enemyManager) {
        this.enemyManager.destroy();
      }
    } catch (error) {
      console.error('Fehler beim Zerstören der Spielszene:', error);
    }
  }

  /**
   * Wird aufgerufen, wenn der Spieler Schaden nimmt
   */
  private onPlayerDamaged = (health: number): void => {
    // Aktualisiere die Gesundheitsanzeige
    this.uiManager.updateHealth(health);
    
    // Prüfe, ob der Spieler tot ist
    if (health <= 0) {
      this.gameOver();
    }
  }

  /**
   * Wird aufgerufen, wenn der Spieler geheilt wird
   */
  private onPlayerHealed = (health: number): void => {
    // Aktualisiere die Gesundheitsanzeige
    this.uiManager.updateHealth(health);
  }

  /**
   * Wird aufgerufen, wenn ein Feind zerstört wird
   */
  private onEnemyDestroyed = (scoreValue: number = 10): void => {
    // Aktualisiere den Punktestand
    this.score += scoreValue;
    this.uiManager.updateScore(this.score);
  }

  /**
   * Erstellt die Manager
   */
  private createManagers(): void {
    // Erstelle den Enemy Manager
    this.enemyManager = new NewEnemyManager(this, this.player);
    
    // Füge den Enemy Manager zur Registry hinzu, damit andere Klassen ihn finden können
    this.registry.set('enemyManager', this.enemyManager);
    
    // Erstelle den Spawn Manager
    this.spawnManager = new SpawnManager(this);
    
    // Erstelle den Collision Manager
    this.collisionManager = new CollisionManager(this, this.player);
    
    // Erstelle den Difficulty Manager
    this.difficultyManager = new DifficultyManager(this);
  }
} 