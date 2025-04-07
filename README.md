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

### 3.3 Player-System

#### Player (src/entities/player/player.ts)
Implementiert die Spielerklasse mit erweiterter Steuerung und Waffensystemen.

**Haupteigenschaften:**
- `speed`: Bewegungsgeschwindigkeit des Spielers
- `weapon`: Referenz auf das Waffensystem
- `acceleration`/`deceleration`: Parameter für flüssigere Bewegungssteuerung
- `touchControls`: Objektstruktur für Touch-Steuerung auf mobilen Geräten
- `isTouchDevice`: Flag zur Erkennung von Touch-Geräten

**Wichtige Methoden:**
- `handleMovement(delta)`: Verbesserte Bewegungslogik mit Beschleunigung und Abbremsung
- `handleShooting(time)`: Verarbeitet Schussaktionen und Feuerraten
- `setupTouchControls()`: Konfiguriert Touch-Steuerung für mobile Geräte
- `takeDamage(amount)`: Erweiterte Schadensfunktion mit Unverwundbarkeitseffekten
- `heal(amount)`: Heilungsfunktion mit Begrenzung auf maximale Gesundheit
- `onPowerUpCollected()`: Verarbeitet eingesammelte Power-Ups
- `onEnergyPickupCollected(amount)`: Verarbeitet eingesammelte Energieeinheiten
- `handleCheatKeys(time)`: Verarbeitet geheime Tastenkombinationen für Entwicklungszwecke

**Verbesserungen gegenüber früheren Versionen:**
- Optimierte Bewegungsphysik für direktere Kontrolle
- Unterstützung für Smartphone-Steuerung
- Dynamische Sprite-Anpassung basierend auf Bewegungsrichtung
- Cheatsystem für Entwicklungs- und Testzwecke
- Verbesserte Kollisionsbehandlung
- Erweitertes Gesundheits- und Heilungssystem

#### PlayerWeapon (src/entities/player/playerWeapon.ts)
Verwaltung der Spielerwaffen mit mehreren Leistungsstufen und Schussmustern.

**Haupteigenschaften:**
- `powerLevel`: Aktuelle Leistungsstufe der Waffe (1-6)
- `bulletPool`: Optimierter Objekt-Pool für Projektile
- `shotDelay`: Zeit zwischen Schüssen abhängig von Leistungsstufe

**Wichtige Methoden:**
- `shoot(x, y)`: Erzeugt Projektile basierend auf aktueller Leistungsstufe
- `update(delta)`: Aktualisiert alle aktiven Projektile
- `increasePower()`: Erhöht die Leistungsstufe der Waffe
- `getBullets()`: Gibt die Projektilgruppe zurück

**Schussmuster nach Leistungsstufe:**
- Stufe 1: Einzelner gerader Schuss
- Stufe 2: Schnellerer Einzelschuss
- Stufe 3: Doppelschuss (gerade und leicht versetzt)
- Stufe 4: Dreifachschuss im Fächer
- Stufe 5: Vier Schüsse in breiterem Fächer
- Stufe 6: Fünf Schüsse mit maximaler Streuung und Schaden

### 3.4 Projektilsystem

Das Spiel implementiert ein flexibles Projektilsystem:

#### Bullet (src/entities/Bullet.ts)
Basisklasse für alle Projektile im Spiel.

**Haupteigenschaften:**
- `damage`: Schadenswert des Projektils
- `owner`: Besitzer des Projektils ('player' oder 'enemy')
- `speed`: Grundgeschwindigkeit des Projektils
- `shouldFlipX`: Flag für horizontale Spiegelung der Textur

**Wichtige Methoden:**
- `setVelocityWithRotation(x, y)`: Setzt Geschwindigkeit und aktualisiert die Rotation entsprechend
- `setDirectionAndSpeed(angleRadians)`: Setzt Richtung und Geschwindigkeit basierend auf einem Winkel
- `updateRotation()`: Aktualisiert die Rotation des Projektils basierend auf seiner Flugrichtung
- `update(time, delta)`: Aktualisiert den Zustand des Projektils, überprüft Grenzen und passt die Rotation an

```typescript
// Die updateRotation-Methode sorgt dafür, dass die Ausrichtung der Flugrichtung entspricht
protected updateRotation(): void {
  if (this.sprite && this.sprite.body) {
    const vx = this.sprite.body.velocity.x;
    const vy = this.sprite.body.velocity.y;
    
    // Nur rotieren, wenn es eine signifikante Geschwindigkeit gibt
    if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
      // Berechne den Winkel aus den Geschwindigkeitskomponenten
      const angle = Math.atan2(vy, vx);
      
      // Setze die Rotation des Sprites auf diesen Winkel
      this.sprite.setRotation(angle);
    }
  }
}
```

#### PlayerBullet (src/entities/PlayerBullet.ts)
Spezialisierte Projektilklasse für Spieler-Schüsse.

**Besonderheiten:**
- Standardrichtung nach rechts (0°)
- Zusätzliche `powerLevel`-Eigenschaft für Upgrade-System
- Originaltextur ohne Farbänderung

#### EnemyBullet (src/entities/EnemyBullet.ts)
Spezialisierte Projektilklasse für Gegner-Schüsse.

**Besonderheiten:**
- Standardrichtung nach links (180°)
- Registrierung für spezielle Kollisionserkennung
- Optimierung für Fallback, falls Geschwindigkeit zu niedrig ist
- Rotation wird immer der Flugrichtung des Projektils angepasst

#### BulletFactory (src/factories/BulletFactory.ts)
Factory-Klasse für das Erzeugen verschiedener Projektiltypen mit optimierten Einstellungen.

**Hauptmethoden:**
- `createPlayerBullet(x, y, angle, powerLevel)`: Erstellt ein Spieler-Projektil
- `createEnemyBullet(x, y, angle)`: Erstellt ein Gegner-Projektil
- `createTurretBullet(x, y, angle)`: Erstellt ein Projektil für Geschütztürme
- `create360Bullets(x, y, count)`: Erstellt mehrere Projektile in einer 360-Grad-Formation

### 3.5 Gegner-System

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
- **StandardEnemy**: Einfacher Standardgegner mit grundlegenden Bewegungs- und Angriffsmustern
- **AdvancedEnemy**: Fortgeschrittener Gegner mit komplexeren Verhaltensweisen und erhöhter Gesundheit
- **EliteEnemy**: Elitegegner mit Spezialangriffen und fortgeschrittenen Bewegungsmustern
- **TurretEnemy**: Stationärer Gegner, der den Spieler verfolgt und gezielt beschießt
- **BossEnemy**: Komplexer Bossgegner mit mehreren Angriffsphasen, erhöhter Gesundheit und speziellen Attacken

### 3.6 Gegner-Komponenten

Die Gegner verwenden ein modulares Komponentensystem für verschiedene Aspekte ihres Verhaltens:

#### WeaponComponent (src/entities/enemies/components/weaponComponent.ts)
Wiederverwendbare Waffenkomponente für Gegner, die verschiedene Schussmuster implementiert.

**Schussmuster:**
- `single`: Einzelne Schüsse direkt auf den Spieler
- `double`: Zwei Schüsse mit leichtem Versatz
- `triple`: Drei Schüsse in einem Fächer
- `spread`: Fächerförmige Schüsse mit konfigurierbarem Winkel
- `burst`: Schnelle Abfolge von Einzelschüssen

**Besonderheiten:**
- Unterstützt prädiktives Zielen auf den Spieler
- Konfigurierbare Feuerrate und Muster
- Automatische Berechnung der Schusswinkel

#### MovementComponent
Verwaltet die Bewegung der Gegner mit verschiedenen vordefinierten Mustern.

**Bewegungsmuster:**
- `linear`: Lineare Bewegung in eine Richtung
- `zigzag`: Zickzack-Bewegung mit konfigurierbarer Amplitude
- `sine`: Wellenförmige Bewegung
- `circle`: Kreisförmige Bewegung um einen Punkt
- `followPlayer`: Verfolgung des Spielers mit konfigurierbarer Geschwindigkeit
- `stationary`: Stationäre Position ohne Bewegung

#### VisualComponent
Verwaltet visuelle Effekte und Animationen für Gegner.

**Funktionen:**
- Farbeffekte (Tint) für verschiedene Zustände
- Blinkeffekte bei Schaden
- Spezielle Animationen für Angriffe und Zerstörung
- Skalierungseffekte

### 3.7 Manager-Systeme

#### EnemyManager (src/managers/enemyManager.ts)
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

#### LevelManager (src/managers/levelManager.ts)
Verwaltet die Level, deren Progression und Konfiguration.

**Hauptfunktionen:**
- Level-basierte Spielprogression mit dynamischen Schwierigkeitsgraden
- Management von Wellen und zeitgesteuerten Ereignissen
- Level-Intros und -Outros mit Textanzeigen
- Übergang zwischen Levels mit Fade-Effekten
- Level-Ende-Logik: Ein Level wird erst beendet, wenn alle Gegner zerstört wurden oder den Bildschirm verlassen haben

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

#### CollisionManager (src/managers/collisionManager.ts)
Verwaltet alle Kollisionen zwischen Spielobjekten.

**Hauptfunktionen:**
- Registrierung von Kollisionsgruppen
- Behandlung verschiedener Kollisionstypen
- Optimierte Kollisionserkennung
- Verbesserte Kollisionsverarbeitung zwischen Spieler, Gegnern und Projektilen

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

#### SpawnManager (src/managers/spawnManager.ts)
Koordiniert das Erscheinen von Gegnern, Powerups und Umgebungsobjekten.

**Hauptfunktionen:**
- Wellenbasierte Gegnererzeugung
- Zeitgesteuerte Spawns
- Zufällige Verteilung von Pickups und Objekten
- Dynamische Anpassung von Spawn-Raten basierend auf Schwierigkeit

### 3.8 Event-System

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
- `ENEMY_DESTROYED`: Gegner wurde zerstört (liefert Objektreferenz)
- `PLAYER_DESTROYED`: Spieler wurde zerstört
- `GAME_OVER`: Spiel ist beendet
- `GAME_RESUMED`: Spiel wurde wieder aufgenommen
- `PAUSE_GAME`: Spiel wurde pausiert
- `RESUME_GAME`: Spiel wurde fortgesetzt
- `PICKUP_COLLECTED`: Pickup wurde gesammelt
- `DIFFICULTY_CHANGED`: Schwierigkeitsgrad hat sich geändert
- `DEBUG_TOGGLED`: Debug-Modus wurde umgeschaltet
- `BOSS_SPAWNED`: Boss wurde erzeugt
- `LEVEL_STARTED`: Level wurde gestartet
- `LEVEL_ENDING`: Level geht zu Ende
- `LEVEL_ENEMIES_CLEARED`: Alle Gegner in einem Level sind besiegt
- `LEVEL_COMPLETED`: Level wurde abgeschlossen
- `NEXT_LEVEL_STARTING`: Nächstes Level wird gestartet
- `GAME_WON`: Spiel wurde gewonnen
- `ASTEROID_DESTROYED`: Asteroid wurde zerstört
- `POWER_PICKUP_COLLECTED`: Power-Pickup wurde gesammelt
- `BOSS_DESTROYED`: Boss wurde zerstört
- `ENEMY_KILLED`: Gegner wurde getötet
- `PLAYER_DAMAGED`: Spieler hat Schaden erhalten
- `PLAYER_HEALED`: Spieler wurde geheilt
- `SCORE_CHANGED`: Punktestand hat sich geändert
- `REGISTER_ENEMY_BULLET`: Registriert ein feindliches Projektil zur Kollisionsprüfung
- `CREATE_SMALL_ASTEROID`: Erzeugt einen kleinen Asteroiden, wenn ein größerer zerstört wird
- `CREATE_ENERGY_PICKUP`: Erzeugt ein Energie-Pickup an einer bestimmten Position
- `CREATE_POWER_PICKUP`: Erzeugt ein Power-Pickup an einer bestimmten Position
- `DESTROY_ASTEROID`: Signal zum Zerstören eines Asteroiden

### 3.9 Level- und Missionsystem

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

**Neues Attribut in LevelConfig:**
- `asteroidSpeedMultiplier`: Steuert die Geschwindigkeit von Asteroiden im Level

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
  asteroidSpeedMultiplier?: number; // Geschwindigkeitsmultiplikator für Asteroiden
  music?: string;                 // Musik für dieses Level
  background?: string;            // Hintergrund für dieses Level
  introText?: string;             // Einleitungstext für das Level
  outroText?: string;             // Text nach Abschluss des Levels
  
  waves: Wave[];                  // Gegnerwellen
  timedSpawns?: TimedSpawn[];     // Zeitbasierte Gegner-Spawns
  timedPickups?: TimedPickup[];   // Zeitbasierte Pickup-Spawns
}
```

### 3.10 Shader und visuelle Effekte

#### GlowPipeline (src/pipelines/glowPipeline.ts)
Implementiert einen WebGL-Shader für Glow-Effekte.

Die Shader-Dateien befinden sich im `/src/shaders/`-Verzeichnis als separate `.glsl`-Dateien.

## 4. Spielsteuerung und Interaktion

### 4.1 Spielersteuerung
- **Tastatur**: WASD oder Pfeiltasten für Bewegung, Leertaste zum Schießen
- **Touch**: Drag & Drop für Bewegung, Tippen zum Schießen
- **Geheime Tastenkombinationen**: Implementiert für Testzwecke während der Entwicklung

### 4.2 Touch-Steuerung für mobile Geräte
Die Spielerklasse enthält eine optimierte Touch-Steuerung für mobile Geräte:
- Touch-Erkennung mit automatischer Anpassung
- Dynamische Geschwindigkeitssteuerung basierend auf Touch-Position
- Separate Bereiche für Bewegung und Schießen

## 5. Level-System

### 5.1 Level-Konfiguration
Das Spiel verwendet ein flexibles Level-System mit konfigurierbaren Parametern.

### 5.2 Level-Progression
Der LevelManager steuert den Fortschritt durch die Level:
- Dynamische Schwierigkeitsanpassung
- Nahtloser Übergang zwischen Levels
- Ereignisbasierte Level-Abschlüsse

## 6. Performance-Optimierung

- **Objekt-Pools**: Für häufig erzeugte und zerstörte Objekte wie Projektile werden Objekt-Pools verwendet
- **Textur-Atlas**: Kombinieren von Sprites in Textur-Atlanten reduziert Draw-Calls
- **Effiziente Physik**: Beschränkung der Physikberechnungen auf aktive Objekte
- **Lazy Loading**: Laden von Assets nur in den Szenen, in denen sie benötigt werden
- **Automatische Bereinigung**: Projektile und andere Objekte werden außerhalb des sichtbaren Bereichs automatisch deaktiviert
- **Optimierte Kollisionserkennung**: Verbesserte Algorithmen für effizientere Kollisionserkennung

## 7. Technologien und Abhängigkeiten

- **Phaser 3**: JavaScript/TypeScript Spieleentwicklungsframework
- **TypeScript**: Typsicheres JavaScript für robustere Codebasis
- **Vite**: Modernes und schnelles Build-Tool und Entwicklungsserver
- **Node.js**: Entwicklungsumgebung für Build-Prozesse

## 8. Build und Deployment

### 8.1 Entwicklungsserver starten
```bash
npm run dev
```

### 8.2 Produktionsbuild erstellen
```bash
npm run build
```

### 8.3 Build-Vorschau anzeigen
```bash
npm run preview
```

## 9. Bekannte Probleme und Lösungen

### 9.1 Projektilrotation
Bei Projektilen von Gegnern kann es vorkommen, dass die Rotation nicht korrekt mit der Flugrichtung übereinstimmt. Dies wurde behoben, indem die `updateRotation()`-Methode in der `Bullet`-Klasse verbessert wurde, um die Rotation kontinuierlich zu aktualisieren.

### 9.2 Leistungseinbrüche bei vielen Objekten
Bei einer hohen Anzahl von Objekten auf dem Bildschirm kann es zu Leistungseinbrüchen kommen. Um dies zu minimieren, werden Objekt-Pools für Projektile verwendet, und inaktive Objekte werden außerhalb des sichtbaren Bereichs automatisch entfernt.

### 9.3 Mobile Steuerung
Die Touch-Steuerung auf mobilen Geräten wurde optimiert, um präzisere Kontrolle zu ermöglichen und ein besseres Spielerlebnis zu bieten.

## 10. Erweiterungen und zukünftige Funktionen

- Zusätzliche Gegnertypen mit komplexeren Verhaltensweisen
- Erweiterte Waffensysteme und Powerups
- Verbessertes Partikelsystem für Explosionen und Triebwerkseffekte
- Mehr Level und Missionen
- Speichern des Spielfortschritts