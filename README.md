# Echoes From The Rift - Dokumentation

## 1. Übersicht

Dieses Projekt ist ein 2D-Weltraum-Shooter, entwickelt mit Phaser 3 und TypeScript. Das Spiel nutzt eine objektorientierte, komponentenbasierte Architektur für maximale Wiederverwendbarkeit und Erweiterbarkeit.

## 2. Projektstruktur

Die Anwendung ist wie folgt strukturiert:

```
/
├── assets/            # Spielressourcen (Grafiken, Audio)
├── dist/              # Kompilierte Dateien
├── src/               # Quellcode
│   ├── core/          # Kern-Komponenten
│   ├── entities/      # Spielobjekte
│   │   ├── enemies/   # Gegner-Klassen
│   │   ├── player/    # Spieler-Klassen
│   │   ├── pickups/   # Sammelgegenstände
│   │   ├── environment/ # Umgebungsobjekte (Asteroiden, etc.)
│   ├── managers/      # Manager-Klassen
│   ├── scenes/        # Spielszenen
│   ├── shaders/       # GLSL-Shader
│   ├── ui/            # Benutzeroberfläche
│   ├── utils/         # Hilfsfunktionen
│   ├── pipelines/     # Render-Pipelines
│   ├── factories/     # Fabriken für Spielobjekte
│   ├── config/        # Konfigurationsdateien
│   ├── collisionManager.ts # Kollisionssystem
├── index.html         # Haupt-HTML-Datei
├── tsconfig.json      # TypeScript-Konfiguration
├── vite.config.ts     # Vite-Konfiguration
```

## 3. Architektur

### 3.1 Kernkomponenten

#### GameConfig (src/core/config.ts)
Zentrale Konfigurationsklasse für Phaser-Einstellungen, Spielparameter und Bildschirmanpassungen.

**Wichtigste Funktionen:**
- `getConfig()`: Liefert die Phaser-Konfiguration mit Szenen, Physik und Bildschirmeinstellungen
- `addGameStyles()`: Fügt CSS-Stile für das Spielcontainer hinzu
- `addResizeListener()`: Fügt Event-Listener für Fenstergrößenänderungen hinzu

```typescript
// Beispiel zur Verwendung
const config = GameConfig.getConfig();
const game = new Phaser.Game(config);
```

Die Konfiguration enthält Einstellungen für:
- Renderer-Typ (AUTO wählt WebGL oder Canvas)
- Fenstergröße und Anpassungen
- Physik-Engine-Parameter
- Szenen-Management
- Skalierungsoptionen für verschiedene Bildschirmgrößen
- DOM-Container-Einstellungen

### 3.2 Entity-System

Das Projekt verwendet ein hierarchisches Entity-System:

#### Entity (src/entities/entity.ts)
Abstrakte Basisklasse für alle Spielobjekte mit grundlegenden Funktionen für Position und Bewegung.

**Eigenschaften:**
- `sprite`: Phaser-Sprite für Rendering und Physik
- `scene`: Referenz auf die aktuelle Szene

**Öffentliche Methoden:**
- `getSprite()`: Gibt das Phaser-Sprite zurück
- `update(time, delta)`: Abstrakte Methode für Frame-Updates
- `destroy()`: Gibt Ressourcen frei
- `setPosition(x, y)`: Positioniert die Entität
- `setVelocity(x, y)`: Setzt die Geschwindigkeit

```typescript
export abstract class Entity {
  protected sprite: Phaser.Physics.Arcade.Sprite;
  protected scene: Phaser.Scene;
  
  // Methoden zur Steuerung von Position und Geschwindigkeit
  public abstract update(time: number, delta: number): void;
}
```

#### GameObject (src/entities/gameObject.ts)
Erweitert Entity um Gesundheits- und Kollisionssystem.

**Eigenschaften:**
- `health`: Aktueller Gesundheitswert
- `maxHealth`: Maximaler Gesundheitswert
- `isDestroyed`: Flag, ob das Objekt zerstört wurde

**Öffentliche Methoden:**
- `takeDamage(amount)`: Verarbeitet eingehenden Schaden
- `getHealth()`: Gibt aktuelle Gesundheit zurück
- `getMaxHealth()`: Gibt maximale Gesundheit zurück
- `getHealthPercentage()`: Gibt Gesundheit als Prozentsatz zurück
- `heal(amount)`: Erhöht die Gesundheit
- `destroy()`: Überschreibt die Entity-Methode und ruft onDestroy auf

**Geschützte Methoden:**
- `onCollision(other)`: Abstrakte Methode für Kollisionsverarbeitung
- `onDestroy()`: Abstrakte Methode, die bei Zerstörung aufgerufen wird

```typescript
export abstract class GameObject extends Entity {
  protected health: number;
  protected maxHealth: number;
  
  public takeDamage(amount: number): boolean;
  protected abstract onCollision(other: GameObject): void;
  protected abstract onDestroy(): void;
}
```

### 3.3 Projektilsystem

Das Spiel implementiert ein flexibles Projektilsystem:

#### Bullet (src/entities/Bullet.ts)
Basisklasse für alle Projektile im Spiel.

#### PlayerBullet (src/entities/PlayerBullet.ts)
Spezialisierte Projektilklasse für Spieler-Schüsse.

#### EnemyBullet (src/entities/EnemyBullet.ts)
Spezialisierte Projektilklasse für Gegner-Schüsse.

### 3.4 Gegner-System

Das Projekt verwendet ein modulares, komponentenbasiertes Gegner-System:

#### BaseEnemy (src/entities/enemies/baseEnemy.ts)
Hauptbasisklasse für alle Gegner mit Komponenten für Bewegung, Waffen und visuelle Effekte.

**Eigenschaften:**
- `speed`: Bewegungsgeschwindigkeit
- `scoreValue`: Punktwert bei Zerstörung
- `movementComponent`: Bewegungskomponente
- `weaponComponent`: Waffenkomponente
- `visualComponent`: Visuelle Effektkomponente

**Öffentliche Methoden:**
- `update(time, delta)`: Aktualisiert alle Komponenten
- `takeDamage(amount)`: Verarbeitet Schaden
- `applyDifficulty(data)`: Passt Gegner an Schwierigkeitsgrad an

**Geschützte Methoden:**
- `getRandomMovementPattern()`: Gibt ein zufälliges Bewegungsmuster zurück
- `getRandomShootingPattern()`: Gibt ein zufälliges Schussmuster zurück
- `initComponents(config)`: Initialisiert alle Komponenten
- `onCollision(other)`: Verarbeitet Kollisionen
- `onDestroy()`: Wird bei Zerstörung aufgerufen

#### Konkrete Gegnerklassen
- **StandardEnemy**: Einfacher Standardgegner
- **AdvancedEnemy**: Fortgeschrittener Gegner mit komplexeren Verhaltensweisen
- **EliteEnemy**: Elitegegner mit Spezialangriffen
- **TurretEnemy**: Stationärer Gegner, der auf den Spieler schießt
- **BossEnemy**: Komplexer Bossgegner mit mehreren Phasen

### 3.5 Szenen-System

#### BaseScene (src/scenes/baseScene.ts)
Abstrakte Basisklasse für alle Spielszenen mit gemeinsamen Funktionen.

**Eigenschaften:**
- `eventBus`: Referenz auf das Event-System
- `stars`: Sternenhintergrund
- `planetsBackground`: Planetenhintergrund
- `fpsDisplay`: FPS-Anzeige

**Öffentliche/Protected Methoden:**
- `preload()`: Lädt gemeinsame Assets
- `create()`: Erstellt UI-Elemente und Hintergrund
- `update(time, delta)`: Standardupdates für alle Szenen
- `createButton(x, y, text, onClick)`: Erstellt UI-Buttons
- `createTextButton(x, y, text, callback)`: Erstellt Textbuttons
- `createFuturisticFrame(x, y, width, height)`: Erstellt UI-Rahmen
- `createStars()`: Erstellt Sternenhintergrund
- `updateStars(delta)`: Aktualisiert Sternenhintergrund
- `createPlanetsBackground()`: Erstellt Planetenhintergrund
- `createFpsDisplay()`: Erstellt FPS-Anzeige für Debug-Zwecke

#### Konkrete Szenen
- **MainMenuScene**: Hauptmenü des Spiels mit Spielstart, Optionen und Credits
- **GameScene**: Hauptspielszene mit Spieler, Gegnern und Spiellogik
- **GameOverScene**: Anzeige nach Spielende mit Highscore und Neustart-Option
- **PauseScene**: Pausenmenü mit Optionen zum Fortsetzen oder Beenden
- **FinishedScene**: Erscheint nach erfolgreichem Abschluss aller Level

### 3.6 Event-System

#### EventBus (src/utils/eventBus.ts)
Implementiert ein Publisher-Subscriber-Muster für die Kommunikation zwischen verschiedenen Spielkomponenten.

**Öffentliche Methoden:**
- `getInstance()`: Gibt die Singleton-Instanz zurück
- `resetInstance()`: Setzt die EventBus-Instanz zurück
- `on(event, callback)`: Registriert einen Event-Listener
- `off(event, callback)`: Entfernt einen Event-Listener
- `emit(event, data)`: Löst ein Event aus
- `removeAllListeners(event)`: Entfernt alle Listener für ein Event
- `removeAllEvents()`: Entfernt alle Event-Listener

**Im EventType-Enum definierte Events:**
- `PLAYER_CREATED`: Spieler wurde erstellt
- `ENEMY_KILLED`: Gegner wurde getötet
- `ENEMY_DESTROYED`: Gegner wurde zerstört
- `BOSS_SPAWNED`: Boss wurde erzeugt
- `BOSS_DESTROYED`: Boss wurde zerstört
- `PLAYER_DAMAGED`: Spieler hat Schaden erhalten
- `PLAYER_HEALED`: Spieler wurde geheilt
- `PLAYER_DESTROYED`: Spieler wurde zerstört
- `SCORE_CHANGED`: Punktestand hat sich geändert
- `DIFFICULTY_CHANGED`: Schwierigkeitsgrad hat sich geändert
- `GAME_OVER`: Spiel ist beendet
- `PAUSE_GAME`: Spiel wurde pausiert
- `RESUME_GAME`: Spiel wurde fortgesetzt
- `PICKUP_COLLECTED`: Pickup wurde gesammelt
- `ASTEROID_DESTROYED`: Asteroid wurde zerstört
- `GAME_START`: Spiel wurde gestartet
- `POWER_PICKUP_COLLECTED`: Power-Pickup wurde gesammelt
- `DEBUG_TOGGLED`: Debug-Modus wurde umgeschaltet
- `GAME_FINISHED`: Spiel wurde erfolgreich abgeschlossen

```typescript
// Beispiel zur Verwendung
const eventBus = EventBus.getInstance();
eventBus.on(EventType.ENEMY_DESTROYED, this.handleEnemyDestroyed);
eventBus.emit(EventType.SCORE_CHANGED, points);
```

### 3.7 Manager-Systeme

#### LevelManager (src/managers/levelManager.ts)
Verwaltet die Level, deren Progression und Konfiguration.

**Hauptfunktionen:**
- Level-basierte Spielprogression
- Management von Wellen und zeitgesteuerten Ereignissen
- Level-Intros und -Outros
- Übergang zwischen Levels

```typescript
export class LevelManager {
  private currentLevel: LevelConfig | null = null;
  private currentLevelIndex: number = 0;
  private levelTimer: Phaser.Time.TimerEvent | null = null;
  private pendingWaves: Wave[] = [];
  
  // Hauptfunktionen
  public startLevel(levelIndex: number): void;
  public startNextLevel(): void;
  private spawnWave(wave: Wave): void;
  private setupTimedSpawns(timedSpawns: TimedSpawn[]): void;
  private setupTimedPickups(timedPickups: TimedPickup[]): void;
}
```

#### EnemyManager (src/managers/newEnemyManager.ts)
Verwaltet die Erzeugung, Aktualisierung und Verwaltung aller Gegner im Spiel.

**Hauptfunktionen:**
- Gegner-Pooling für optimierte Leistung
- Dynamische Gegner-Erzeugung basierend auf Spielfortschritt
- Verwaltung verschiedener Gegnertypen und -muster

```typescript
// Kern-Funktionalität des EnemyManager
export class NewEnemyManager {
    private enemies: BaseEnemy[] = [];
    private enemyPool: Map<string, BaseEnemy[]> = new Map();
    private scene: GameScene;
    private player: Player;
    private difficultyManager: DifficultyManager;

    // Hauptfunktionen:
    public spawnEnemy(type: string, x: number, y: number): BaseEnemy;
    public update(time: number, delta: number): void;
    private recycleEnemy(enemy: BaseEnemy): void;
    private getEnemyFromPool(type: string): BaseEnemy | null;
    private createNewEnemy(type: string, x: number, y: number): BaseEnemy;
}
```

#### SpawnManager (src/managers/spawnManager.ts)
Koordiniert das Erscheinen von Gegnern, Powerups und Umgebungsobjekten.

**Hauptfunktionen:**
- Wellenbasierte Gegnererzeugung
- Zeitgesteuerte Spawns
- Zufällige Verteilung von Pickups und Objekten

```typescript
export class SpawnManager {
    private scene: GameScene;
    private difficultyManager: DifficultyManager;
    private waveConfig: WaveConfig[];
    private currentWave: number = 0;
    private waveTimer: number = 0;
    private pickupProbability: number = 0.2;
    
    // Methoden zur Spawn-Steuerung
    public update(time: number, delta: number): void;
    private spawnWave(): void;
    private spawnEnemyGroup(type: string, count: number, formation: string): void;
    private spawnPickup(x: number, y: number, type: string): void;
    private spawnAsteroid(size: string): void;
}
```

#### CollisionManager (src/managers/collisionManager.ts oder src/collisionManager.ts)
Verwaltet alle Kollisionen zwischen Spielobjekten.

**Hauptfunktionen:**
- Registrierung von Kollisionsgruppen
- Behandlung verschiedener Kollisionstypen
- Optimierte Kollisionserkennung

```typescript
export class CollisionManager {
    private scene: GameScene;
    private player: Player;
    private playerBullets: Phaser.Physics.Arcade.Group;
    private enemies: Phaser.Physics.Arcade.Group;
    private enemyBullets: Phaser.Physics.Arcade.Group;
    private pickups: Phaser.Physics.Arcade.Group;
    private asteroids: Phaser.Physics.Arcade.Group;
    
    // Optimierte Kollisionsüberprüfungen
    public setupCollisions(): void;
    public update(): void;
    
    // Kollisionshandler
    private handlePlayerEnemyCollision(player: any, enemy: any): void;
    private handlePlayerPickupCollision(player: any, pickup: any): void;
    private handleBulletEnemyCollision(bullet: any, enemy: any): void;
}
```

#### DifficultyManager (src/managers/difficultyManager.ts)
Steuert die Spielschwierigkeit dynamisch basierend auf Spielerfortschritt.

**Hauptfunktionen:**
- Progressive Schwierigkeitsstufen
- Anpassung von Gegnerparametern
- Dynamische Skalierung der Herausforderung

```typescript
export class DifficultyManager {
    private difficulty: number = 1.0;
    private maxDifficulty: number = 5.0;
    private timePlayed: number = 0;
    private scoreMultiplier: number = 1.0;
    private enemyHealthMultiplier: number = 1.0;
    private enemySpeedMultiplier: number = 1.0;
    private enemyFireRateMultiplier: number = 1.0;
    
    // Methoden zur Schwierigkeitsanpassung
    public update(delta: number): void;
    public getDifficulty(): number;
    public getScoreMultiplier(): number;
    public getEnemyAttributeMultipliers(): { health: number, speed: number, fireRate: number };
}
```

#### SoundManager (src/managers/soundManager.ts)
Verwaltet alle Soundeffekte im Spiel.

```typescript
export class SoundManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound>;
  private volume: number = 1.0;
  private muted: boolean = false;
  
  // Hauptmethoden
  public playSound(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void;
  public setVolume(volume: number): void;
  public toggleMute(): boolean;
  private saveSettings(): void;
  private loadSettings(): void;
}
```

#### MusicManager (src/managers/musicManager.ts)
Verwaltet die Hintergrundmusik.

```typescript
export class MusicManager {
  private static instance: MusicManager;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private volume: number = 0.5;
  private muted: boolean = false;
  
  // Hauptmethoden
  public playTrack(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void;
  public playRandomGameplayTrack(): void;
  public stopMusic(): void;
  public setVolume(volume: number): void;
  public toggleMute(): boolean;
}
```

### 3.8 Level- und Missionsystem

#### LevelConfig (src/config/levelConfig.ts)
Definiert die Struktur und Konfiguration der Spiellevel.

**Hauptkomponenten:**
- `LevelConfig`: Interface für Level-Konfigurationen
- `Wave`: Interface für Gegner-Wellen
- `TimedSpawn`: Interface für zeitgesteuerte Spawns
- `TimedPickup`: Interface für zeitgesteuerte Pickups
- `EnemyType`: Enum für Gegnertypen
- `FormationType`: Enum für Formationen
- `PickupType`: Enum für Pickup-Typen
- `Levels`: Array mit allen Level-Konfigurationen

```typescript
export interface LevelConfig {
  id: string;                     // Eindeutige Level-ID
  name: string;                   // Name des Levels
  description: string;            // Beschreibung des Levels
  difficulty: number;             // Schwierigkeitsgrad des Levels (1-10)
  duration: number;               // Dauer des Levels in Millisekunden
  minAsteroids?: number;          // Minimale Anzahl an Asteroiden
  maxAsteroids?: number;          // Maximale Anzahl an Asteroiden
  asteroidSpawnRate?: number;     // Spawn-Rate für Asteroiden in ms
  music?: string;                 // Musik für dieses Level
  background?: string;            // Hintergrund für dieses Level
  introText?: string;             // Einleitungstext für das Level
  outroText?: string;             // Text nach Abschluss des Levels
  
  waves: Wave[];                  // Gegnerwellen
  timedSpawns?: TimedSpawn[];     // Zeitbasierte Gegner-Spawns
  timedPickups?: TimedPickup[];   // Zeitbasierte Pickup-Spawns
}
```

### 3.9 Shader und visuelle Effekte

#### GlowPipeline (src/pipelines/glowPipeline.ts)
Implementiert einen WebGL-Shader für Glow-Effekte.

```typescript
export class GlowPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    private _intensity: number;

    constructor(game: Game) {
        super({
            game,
            renderTarget: true,
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform float intensity;
                varying vec2 outTexCoord;

                // Shader-Code für Glow-Effekt
                void main() {
                    // ...
                }
            `
        });
    }

    // Methoden zur Intensitätssteuerung
    public setIntensity(value: number): this;
}
```

Die Shader-Dateien befinden sich nun im `/src/shaders/`-Verzeichnis als separate `.glsl`-Dateien.

## 4. Level-System

### 4.1 Level-Konfiguration
Das Spiel verwendet ein flexibles Level-System, bei dem jedes Level in der `levelConfig.ts` definiert wird:

```typescript
export const Level1: LevelConfig = {
  id: 'level-1',
  name: 'First Encounters',
  description: 'The first enemies appear. Be careful and test your weapons.',
  difficulty: 1,
  duration: 30000,
  minAsteroids: 2,
  maxAsteroids: 5,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID,
  introText: 'Enemy ships have been spotted in this sector. Eliminate them to protect our territory.',
  outroText: 'Well done! The first wave has been repelled.',
  
  waves: [
    {
      enemyType: EnemyType.STANDARD,
      count: 3,
      formation: FormationType.LINE,
      delay: 5000
    },
    // Weitere Wellen...
  ],
  
  timedPickups: [
    {
      time: 20000,
      type: PickupType.ENERGY,
      count: 2
    }
    // Weitere zeitgesteuerte Pickups...
  ]
};
```

### 4.2 Level-Progression
Der LevelManager steuert den Fortschritt durch die Level:

```typescript
// Beispiel zur Verwendung
levelManager.startLevel(0); // Startet das erste Level
levelManager.startNextLevel(); // Wechselt zum nächsten Level
```

## 5. Implementierungsleitfaden

### 5.1 Erstellen einer neuen Szene

```typescript
import { BaseScene } from './baseScene';

export class MyNewScene extends BaseScene {
  constructor() {
    super('myNewScene');
  }
  
  create() {
    super.create(); // Ruft BaseScene-Initialisierung auf
    
    // Szenen-spezifischer Code
    this.createTextButton(
      this.scale.width / 2,
      this.scale.height / 2,
      'Start Game',
      () => this.scene.start('gameScene')
    );
  }
}

// In GameConfig hinzufügen:
scene: [
  MainMenuScene,
  GameScene,
  MyNewScene,
  // ...
]
```

### 5.2 Erstellen eines neuen Gegnertyps

```typescript
import { BaseEnemy, EnemyConfig } from './baseEnemy';
import { Player } from '../player/player';
import { Constants } from '../../utils/constants';

export class MyNewEnemy extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    const config: EnemyConfig = {
      texture: Constants.ASSET_ENEMY,
      health: 150,
      speed: 120,
      scoreValue: 75,
      fireRate: 900,
      
      // Bewegungseinstellungen
      movement: {
        pattern: 'zigzag',
        speed: 120,
        zigzagAmplitude: 100
      },
      
      // Waffeneinstellungen
      weapon: {
        pattern: 'double',
        fireRate: 900
      },
      
      // Visuelle Einstellungen
      visual: {
        tint: 0x00FF00,
        scale: 1.1
      }
    };
    
    super(scene, x, y, player, config);
  }
  
  // Spezifische Anpassungen falls benötigt
  protected onDestroy(): void {
    super.onDestroy(); // Falls die Basisklasse eine Implementierung hat
    
    // Eigene Logik für Zerstörung hinzufügen
    this.eventBus.emit('CREATE_ENERGY_PICKUP', { x: this.sprite.x, y: this.sprite.y });
  }
}
```

## 6. Asset-Management

### 6.1 Bilder
Assets sollten im Ordner `assets/` platziert werden und in der preload-Methode der entsprechenden Szene geladen werden.

```typescript
preload() {
  this.load.image('asset-key', 'assets/path/to/image.png');
}
```

### 6.2 Audio
Soundeffekte und Musik werden ebenfalls in der preload-Methode geladen.

```typescript
preload() {
  this.load.audio('sound-key', 'assets/sounds/effect.wav');
}

// Abspielen
SoundManager.getInstance().playSound('sound-key');
// oder für Musik
MusicManager.getInstance().playTrack('music-key');
```

## 7. Performance-Optimierung

- **Objekt-Pools**: Für häufig erzeugte und zerstörte Objekte wie Projektile
- **Textur-Atlas**: Kombinieren von Sprites in Textur-Atlanten
- **Effiziente Physik**: Beschränkung der Physikberechnungen auf aktive Objekte
- **Lazy Loading**: Laden von Assets nur in den Szenen, in denen sie benötigt werden

## 8. Technologien und Abhängigkeiten

- **Phaser 3**: JavaScript/TypeScript Spieleentwicklungsframework
- **TypeScript**: Typsicheres JavaScript für robustere Codebasis
- **Vite**: Modernes und schnelles Build-Tool und Entwicklungsserver
- **Node.js**: Entwicklungsumgebung für Build-Prozesse

## 9. Build und Deployment

### 9.1 Entwicklungsserver starten
```bash
npm run dev
```

### 9.2 Produktionsbuild erstellen
```bash
npm run build
```

### 9.3 Build-Vorschau anzeigen
```bash
npm run preview
```