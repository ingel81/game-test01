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

### 3.3 Spieler-System

#### Player (src/entities/player/player.ts)
Hauptspielerklasse mit Steuerung, Bewegung und Waffensystem.

**Eigenschaften:**
- `speed`: Bewegungsgeschwindigkeit
- `weapon`: Referenz auf das Waffensystem
- `cursors`: Tastatur-Eingaben
- `touchControls`: Touch-Eingabesteuerung
- `acceleration`: Beschleunigungswert für Bewegung
- `deceleration`: Abbremswert für Bewegung

**Öffentliche Methoden:**
- `update(time, delta)`: Aktualisiert Spielerzustand
- `takeDamage(amount)`: Überschriebene Methode für Spielerschaden

**Private Methoden:**
- `handleMovement(delta)`: Verarbeitet Bewegungseingaben
- `handleShooting(time)`: Verarbeitet Schusseingaben
- `onPowerUpCollected()`: Verarbeitet Power-Up-Sammlungen
- `onEnergyPickupCollected(amount)`: Verarbeitet Energie-Sammlungen
- `setupTouchControls()`: Richtet Touch-Steuerung ein (für mobile Geräte)

```typescript
export class Player extends GameObject {
  private weapon: PlayerWeapon;
  
  // Viele Funktionen für Bewegung, Schießen, Kollisionen, etc.
}
```

#### PlayerWeapon (src/entities/player/playerWeapon.ts)
Verwaltet das Waffensystem des Spielers mit verschiedenen Waffenarten und Projektilen.

**Eigenschaften:**
- `bullets`: Projektilgruppe
- `powerLevel`: Aktuelles Power-Level der Waffe
- `lastShotTime`: Zeitpunkt des letzten Schusses

**Öffentliche Methoden:**
- `shoot(x, y)`: Erzeugt Projektile
- `upgradePowerLevel()`: Verbessert Waffenstärke
- `update(delta)`: Aktualisiert aktive Projektile
- `getActiveBulletCount()`: Gibt Anzahl aktiver Projektile zurück

**Private Methoden:**
- `shootBackward()`: Spezialfunktion für rückwärtige Schüsse
- `createBullet(x, y, velX, velY)`: Erzeugt ein Projektil
- `handleWorldBoundsCollision(body)`: Behandelt Kollisionen mit Weltgrenzen

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

```typescript
export class BaseEnemy extends GameObject {
  // Komponenten für unterschiedliche Verhaltensweisen
  protected movementComponent: MovementComponent;
  protected weaponComponent: WeaponComponent;
  protected visualComponent: VisualComponent;
}
```

#### Gegner-Komponenten

##### MovementComponent
Verwaltet alle Bewegungsmuster für Gegner.

**Unterstützte Bewegungsmuster:**
- `linear`: Einfache lineare Bewegung
- `zigzag`: Zickzack-Bewegung
- `circular`: Kreisförmige Bewegung
- `tracking`: Verfolgt den Spieler
- `evasive`: Weicht dem Spieler aus
- `sinusoidal`: Wellenförmige Bewegung
- `random`: Zufällige Bewegung

**Konfigurationsoptionen:**
- `pattern`: Das zu verwendende Bewegungsmuster
- `speed`: Bewegungsgeschwindigkeit
- `baseVelocityX`: Grundgeschwindigkeit in X-Richtung
- `amplitude`: Allgemeine Amplitude für Bewegungsmuster
- `frequency`: Allgemeine Frequenz für Bewegungsmuster
- `zigzagAmplitude`: Spezifische Amplitude für Zickzack-Bewegung
- `zigzagFrequency`: Spezifische Frequenz für Zickzack-Bewegung
- `circleRadius`: Radius für Kreisbewegung
- `circleSpeed`: Geschwindigkeit für Kreisbewegung
- `trackingFactor`: Faktor für Spielerverfolgung
- `predictiveAimFactor`: Faktor für vorausschauendes Zielen
- `evadeDistance`: Abstand für Ausweichbewegungen
- `changePatternRandomly`: Ob das Muster zufällig gewechselt werden soll
- `patternChangeInterval`: Intervall für Musterwechsel

**Öffentliche Methoden:**
- `update(time, delta)`: Aktualisiert die Bewegung
- `setPattern(pattern)`: Setzt ein bestimmtes Bewegungsmuster
- `adjustForDifficulty(difficulty)`: Passt Bewegung an Schwierigkeit an

##### WeaponComponent
Verwaltet alle Schussmuster und Projektilerzeugung.

**Unterstützte Schussmuster:**
- `single`: Einzelschuss
- `double`: Doppelschuss
- `burst`: Schnelle Schussserie
- `spread`: Fächerschuss
- `random`: Zufällige Kombination aus verschiedenen Schussmustern

**Konfigurationsoptionen:**
- `pattern`: Das zu verwendende Schussmuster
- `fireRate`: Schussfrequenz in Millisekunden
- `bulletSpeed`: Geschwindigkeit der Projektile
- `bulletTexture`: Textur für Projektile
- `burstCount`: Anzahl der Projektile in einer Burst-Serie
- `burstDelay`: Verzögerung zwischen Burst-Schüssen
- `spreadAngle`: Winkel für Fächerschüsse
- `spreadCount`: Anzahl der Projektile bei Fächerschüssen
- `predictiveAim`: Ob vorausschauend gezielt werden soll
- `targetPlayer`: Ob direkt auf den Spieler gezielt werden soll
- `changePatternRandomly`: Ob das Muster zufällig gewechselt werden soll
- `patternChangeInterval`: Intervall für Musterwechsel

**Öffentliche Methoden:**
- `update(time, delta)`: Aktualisiert Waffensystem
- `setPattern(pattern)`: Setzt ein bestimmtes Schussmuster
- `adjustForDifficulty(difficulty)`: Passt Waffe an Schwierigkeit an

**Private Methoden:**
- `fireBullet()`: Erzeugt ein einzelnes Projektil
- `fireSpread()`: Erzeugt einen Fächer aus Projektilen
- `changePattern()`: Ändert das Schussmuster zufällig

##### VisualComponent
Verwaltet visuelle Aspekte von Gegnern.

**Konfigurationsoptionen:**
- `tint`: Farbton für den Sprite
- `scale`: Skalierungsfaktor
- `hitEffectDuration`: Dauer des Treffereffekts
- `glowEffect`: Ob ein Glüheffekt aktiviert sein soll
- `particleEffect`: Ob Partikeleffekte aktiviert sein sollen

**Öffentliche Methoden:**
- `update(time, delta)`: Aktualisiert visuelle Effekte
- `playHitEffect()`: Zeigt Treffereffekt
- `playDeathEffect()`: Zeigt Todeseffekt

#### Konkrete Gegnerklassen
- **StandardEnemy**: Einfacher Standardgegner
- **AdvancedEnemy**: Fortgeschrittener Gegner mit komplexeren Verhaltensweisen
- **EliteEnemy**: Elitegegner mit Spezialangriffen
- **BossEnemy**: Komplexer Bossgegner mit mehreren Phasen (Dateiname: newBossEnemy.ts)

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

```typescript
export abstract class BaseScene extends Phaser.Scene {
  protected eventBus: EventBus;
  
  // Methoden für UI-Elemente, Sterne, Planeten-Hintergrund, etc.
}
```

#### Konkrete Szenen
- **MainMenuScene**: Hauptmenü des Spiels mit Spielstart, Optionen und Credits
- **GameScene**: Hauptspielszene mit Spieler, Gegnern und Spiellogik
- **GameOverScene**: Anzeige nach Spielende mit Highscore und Neustart-Option
- **PauseScene**: Pausenmenü mit Optionen zum Fortsetzen oder Beenden

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
- `ENEMY_KILLED`: Gegner wurde getötet (durch Spieler)
- `ENEMY_DESTROYED`: Gegner wurde zerstört (allgemein)
- `BOSS_SPAWNED`: Boss wurde erzeugt
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
- `BOSS_DESTROYED`: Boss wurde zerstört
- `GAME_START`: Spiel wurde gestartet
- `POWER_PICKUP_COLLECTED`: Power-Pickup wurde gesammelt

**Zusätzliche String-Events (nicht im Enum):**
- `CREATE_SMALL_ASTEROID`: Erstellt einen kleinen Asteroiden
- `CREATE_ENERGY_PICKUP`: Erstellt ein Energie-Pickup
- `CREATE_POWER_PICKUP`: Erstellt ein Power-Pickup
- `REGISTER_ENEMY_BULLET`: Registriert ein Gegner-Projektil

```typescript
// Beispiel zur Verwendung
const eventBus = EventBus.getInstance();
eventBus.on(EventType.ENEMY_DESTROYED, this.handleEnemyDestroyed);
eventBus.emit(EventType.SCORE_CHANGED, points);
```

### 3.7 Manager-Systeme

#### EnemyManager (src/managers/newEnemyManager.ts)
Verwaltet die Erzeugung, Aktualisierung und Verwaltung aller Gegner im Spiel.

**Hauptfunktionen:**
- Gegner-Pooling für optimierte Leistung
- Dynamische Gegner-Erzeugung basierend auf Spielfortschritt
- Verwaltung verschiedener Gegnertypen und -muster

```typescript
// Kern-Funktionalität des EnemyManager
export class EnemyManager {
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

#### CollisionManager (src/managers/collisionManager.ts)
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
Verwaltet alle Soundeffekte und Musik im Spiel.

**Hauptfunktionen:**
- Abspielen und Stummschalten von Sounds
- Lautstärkesteuerung
- Optimiertes Audio-Ressourcenmanagement
- Persistente Einstellungen im lokalen Speicher

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

### 3.8 UI-System

#### GameUI (src/ui/gameUI.ts)
Hauptklasse für die Spielbenutzeroberfläche, die alle UI-Komponenten koordiniert.

```typescript
export class GameUI {
    private scene: GameScene;
    private healthBar: HealthBar;
    private scoreDisplay: ScoreDisplay;
    private pauseButton: Phaser.GameObjects.Image;
    
    // Methoden zum Aktualisieren der UI-Elemente
    public updateHealth(health: number, maxHealth: number): void;
    public updateScore(score: number): void;
    public showGameOverScreen(): void;
}
```

#### HealthBar (src/ui/healthBar.ts)
Zeigt die Spielergesundheit in einer visuell ansprechenden Leiste an.

```typescript
export class HealthBar {
    private bar: Phaser.GameObjects.Graphics;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    
    // Methoden zum Aktualisieren und Animieren
    public update(value: number, maxValue: number): void;
    public animateDamage(oldValue: number, newValue: number): void;
}
```

#### ScoreDisplay (src/ui/scoreDisplay.ts)
Zeigt den aktuellen Punktestand und andere Spielstatistiken an.

```typescript
export class ScoreDisplay {
    private scoreText: Phaser.GameObjects.Text;
    private currentScore: number = 0;
    private targetScore: number = 0;
    
    // Methoden für Punktestandsaktualisierung
    public updateScore(score: number): void;
    private animateScoreChange(): void;
}
```

#### TouchControls (src/ui/touchControls.ts)
Implementiert die Touch-Steuerung für mobile Geräte mit optimierter Reaktion.

```typescript
export class TouchControls {
    private scene: GameScene;
    private joystickBase: Phaser.GameObjects.Image;
    private joystickThumb: Phaser.GameObjects.Image;
    private shootButton: Phaser.GameObjects.Image;
    
    // Methoden zur Verarbeitung von Touch-Eingaben
    public update(): void;
    public getJoystickDirection(): { x: number, y: number };
    public isShootPressed(): boolean;
    
    // Setup-Methoden
    private setupJoystick(): void;
    private setupFireButton(): void;
}
```

#### PlanetsBackground (src/ui/planetsBackground.ts)
Erstellt und verwaltet den dynamischen Planetenhintergrund.

```typescript
export class PlanetsBackground {
    private scene: Phaser.Scene;
    private planets: Phaser.GameObjects.Image[] = [];
    
    // Methoden zur Hintergrundverwaltung
    public update(delta: number): void;
    private createPlanet(depth: number): void;
}
```

#### FpsDisplay (src/ui/fpsDisplay.ts)
Zeigt die aktuelle Bildrate für Debugging-Zwecke an (nur im Entwicklungsmodus).

```typescript
export class FpsDisplay {
    private text: Phaser.GameObjects.Text;
    private lastTime: number = 0;
    
    // Methoden zur FPS-Anzeige
    public update(time: number): void;
    public toggle(): void;
}
```

### 3.9 Komponenten-Systeme

#### VisualComponent (src/entities/enemies/components/visualComponent.ts)
Verwaltet alle visuellen Aspekte der Gegner.

```typescript
export interface VisualConfig {
    tint?: number;                // Farbton für den Sprite
    scale?: number;               // Skalierungsfaktor
    alpha?: number;               // Transparenz
    hitEffectDuration?: number;   // Dauer des Treffereffekts
    hitEffectTint?: number;       // Farbe des Treffereffekts
    useAnimations?: boolean;      // Ob Animationen verwendet werden
    animationPrefix?: string;     // Präfix für Animationsschlüssel
    rotationSpeed?: number;       // Rotationsgeschwindigkeit
    glowEffect?: boolean;         // Ob Glow-Effekt aktiviert werden soll
    particleEffect?: boolean;     // Ob Partikeleffekte aktiviert werden
    deathAnimationKey?: string;   // Schlüssel für Todesanimation
}
```

Die Komponente bietet zahlreiche visuelle Effekte:
- Farbton- und Transparenzänderungen
- Rotationseffekte
- Animationen mit flexiblen Präfixen
- Glow-Effekte
- Partikeleffekte
- Pulsierendes Leuchten

```typescript
// Beispiele für zusätzliche Methoden
public playPulsingEffect(): void;
public playGlowEffect(intensity: number): void;
public createThrusterParticles(): void;
```

#### Animationssystem

Das integrierte Animationssystem ermöglicht die Verwaltung komplexer Sprite-Animationen:

```typescript
// Animation einrichten
private setupAnimations(): void {
    if (!this.config.useAnimations) return;
    
    const prefix = this.config.animationPrefix || 'enemy';
    
    // Idle-Animation
    if (!this.sprite.anims.exists(`${prefix}_idle`)) {
        this.sprite.anims.create({
            key: `${prefix}_idle`,
            frames: this.sprite.anims.generateFrameNumbers(this.sprite.texture.key, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    }
    
    // Damage-Animation
    if (!this.sprite.anims.exists(`${prefix}_damage`)) {
        this.sprite.anims.create({
            key: `${prefix}_damage`,
            frames: this.sprite.anims.generateFrameNumbers(this.sprite.texture.key, { start: 4, end: 5 }),
            frameRate: 12,
            repeat: 0
        });
    }
    
    // Animation starten
    this.sprite.play(`${prefix}_idle`);
}
```

### 3.10 Shader und visuelle Effekte

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

**Hinweis:** Aktuell sind die Shader direkt in der `glowPipeline.ts` als Strings implementiert. Eine geplante Verbesserung ist die Auslagerung in separate `.glsl`-Dateien im `/src/shaders/`-Verzeichnis.

## 4. Implementierungsleitfaden

### 4.1 Erstellen einer neuen Szene

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

### 4.2 Erstellen eines neuen Gegnertyps

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

### 4.3 Erstellen eines neuen Pickup-Items

```typescript
import { Entity } from '../entity';
import { Player } from '../player/player';
import { EventBus, EventType } from '../../utils/eventBus';

export class MyPickup extends Entity {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pickup-texture');
    this.sprite.setScale(0.8);
    
    // Physik-Einstellungen
    this.sprite.body.setVelocity(-100, 0);
  }
  
  update(time: number, delta: number): void {
    // Bewegungslogik
    
    // Prüfe, ob außerhalb des Bildschirms
    if (this.sprite.x < -50) {
      this.destroy();
    }
  }
  
  onCollect(player: Player): void {
    // Effekt bei Sammeln
    EventBus.getInstance().emit(EventType.PICKUP_COLLECTED, 50);
    this.destroy();
  }
}
```

## 5. Asset-Management

### 5.1 Bilder
Assets sollten im Ordner `assets/` platziert werden und in der preload-Methode der entsprechenden Szene geladen werden.

```typescript
preload() {
  this.load.image('asset-key', 'assets/path/to/image.png');
}
```

### 5.2 Audio
Soundeffekte und Musik werden ebenfalls in der preload-Methode geladen.

```typescript
preload() {
  this.load.audio('sound-key', 'assets/sounds/effect.wav');
}

// Abspielen
this.sound.play('sound-key');
```

## 6. Performance-Optimierung

- **Objekt-Pools**: Verwenden Sie Objekt-Pools für häufig erzeugte und zerstörte Objekte wie Projektile
- **Textur-Atlas**: Kombinieren Sie Sprites in Textur-Atlanten
- **Effiziente Physik**: Begrenzen Sie Physikberechnungen auf aktive Objekte
- **Lazy Loading**: Laden Sie Assets nur in den Szenen, in denen sie benötigt werden

## 7. Verbesserungsvorschläge

### 7.1 Technische Verbesserungen
1. **WebGL-Shader für spezielle Effekte**: Implementieren erweiterter visueller Effekte mittels eigener Shader
2. **Verbesserte Kollisionserkennung**: Implementierung einer pixelgenauen Kollisionserkennung für präzisere Spielmechanik
3. **Leistungsoptimierung**: Implementierung von Objekt-Pooling für alle Projektile und kurzlebige Effekte
4. **Save/Load-System**: Persistentes Speichersystem für Highscores und Spielstände
5. **Mobile Optimierung**: Anpassung der Touch-Steuerung und Leistungsoptimierung für mobile Geräte

### 7.2 Spieldesign-Verbesserungen
1. **Upgrade-System**: Erweitertes Fortschrittssystem für Spieler mit Skillbäumen und permanenten Verbesserungen
2. **Mehr Gegnertypen**: Erweitern der Gegnervielfalt mit einzigartigen Verhaltensweisen und Angriffsmustern
3. **Mehrspieler-Modus**: Implementierung eines kooperativen oder kompetitiven Mehrspieler-Modus
4. **Level-Editor**: Tool zur einfachen Erstellung neuer Level und Missionen
5. **Story-Modus**: Implementierung eines narrativen Fortschrittssystems mit Zwischensequenzen

### 7.3 Content-Erweiterungen
1. **Neue Waffentypen**: Erweiterung der Waffenvielfalt mit einzigartigen Mechaniken
2. **Bosse**: Implementierung komplexer Boss-Kämpfe mit mehreren Phasen
3. **Verschiedene Biome/Umgebungen**: Erweiterung um unterschiedliche Spielumgebungen mit eigenen Herausforderungen
4. **Power-ups und passive Fähigkeiten**: Erweiterte Sammelgegenstände und Spezialisierungsmöglichkeiten

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

### 9.4 Asset-Handhabung mit Vite

Assets werden im `assets/`-Verzeichnis platziert und sind automatisch unter dem Root-Pfad `/` verfügbar:

```typescript
// Beispiel für Asset-Ladung in Vite
preload() {
  // Assets werden direkt aus dem publicDir geladen
  this.load.image('player', '/images/player.png');
  this.load.spritesheet('explosion', '/sprites/explosion.png', { 
    frameWidth: 64, 
    frameHeight: 64 
  });
  this.load.audio('shoot', '/sounds/shoot.wav');
}
```

## 10. Entwicklungshilfen

### 10.1 Cheat-System

Das Spiel enthält ein Cheat-System für Entwicklungs- und Testzwecke:

```typescript
/**
 * Verarbeitet Cheat-Tastenkombinationen.
 * HINWEIS: Diese Funktion dient nur Entwicklungszwecken und sollte in der
 * Produktionsversion deaktiviert oder entfernt werden.
 * 
 * Unterstützte Cheats:
 * - "HEAL": Stellt 50 Gesundheitspunkte wieder her
 * - "POWER": Erhöht die Waffenstärke um eine Stufe
 * - "EXTRA": Gewährt ein zusätzliches Leben
 */
private handleCheatKeys(time: number): void {
    // Implementierung...
}
```

## 11. To-Do: Verbleibende Aufgaben

Die folgende Liste enthält verbleibende Aufgaben zur Verbesserung des Projekts:

### 11.1 Technische Verbesserungen

1. **Shader-Implementierung**: Die GLSL-Shader sollten in separate `.glsl`-Dateien im `/src/shaders/`-Verzeichnis ausgelagert werden, anstatt als Strings in `glowPipeline.ts` definiert zu sein.

2. **Animation-Framework**: Implementation eines zentralen AnimationService für bessere Wiederverwendbarkeit:
   ```typescript
   export class AnimationService {
       // Zentralisierte Animation-Verwaltung
       public createAnimation(key, spritesheet, frames, frameRate, repeat): void;
       public playAnimation(sprite, key): void;
   }
   ```

3. **Dateinamen-Konsistenz**: Die Dateinamen-Konventionen sollten vereinheitlicht werden, insbesondere:
   - `newBossEnemy.ts` sollte in `bossEnemy.ts` umbenannt werden

### 11.2 Dokumentations-Verbesserungen

1. **Code-Beispiele**: Mehr praktische Beispiele für die Verwendung der Manager-Klassen hinzufügen

2. **Detaillierte API-Dokumentation**: Ausführlichere Dokumentation der öffentlichen APIs für bessere Entwicklerfreundlichkeit