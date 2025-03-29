# Spielentwicklung mit Phaser 3 - Dokumentation

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
│   ├── managers/      # Manager-Klassen
│   ├── scenes/        # Spielszenen
│   ├── shaders/       # GLSL-Shader
│   ├── ui/            # Benutzeroberfläche
│   ├── utils/         # Hilfsfunktionen
│   ├── pipelines/     # Render-Pipelines
├── index.html         # Haupt-HTML-Datei
├── tsconfig.json      # TypeScript-Konfiguration
├── webpack.config.js  # Webpack-Konfiguration
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

### 3.2 Entity-System

Das Projekt verwendet ein hierarchisches Entity-System:

#### Entity (src/entities/entity.ts)
Abstrakte Basisklasse für alle Spielobjekte mit grundlegenden Funktionen für Position und Bewegung.

**Eigenschaften:**
- `sprite`: Phaser-Sprite für Rendering und Physik
- `scene`: Referenz auf die aktuelle Szene

**Methoden:**
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

**Methoden:**
- `takeDamage(amount)`: Verarbeitet eingehenden Schaden
- `getHealth()`: Gibt aktuelle Gesundheit zurück
- `getMaxHealth()`: Gibt maximale Gesundheit zurück
- `getHealthPercentage()`: Gibt Gesundheit als Prozentsatz zurück
- `heal(amount)`: Erhöht die Gesundheit
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

**Methoden:**
- `update(time, delta)`: Aktualisiert Spielerzustand
- `handleMovement(delta)`: Verarbeitet Bewegungseingaben
- `handleShooting(time)`: Verarbeitet Schusseingaben
- `takeDamage(amount)`: Überschriebene Methode für Spielerschaden
- `onPowerUpCollected()`: Verarbeitet Power-Up-Sammlungen
- `onEnergyPickupCollected(amount)`: Verarbeitet Energie-Sammlungen

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

**Methoden:**
- `shoot(x, y)`: Erzeugt Projektile
- `upgradePowerLevel()`: Verbessert Waffenstärke
- `update(delta)`: Aktualisiert aktive Projektile
- `getActiveBulletCount()`: Gibt Anzahl aktiver Projektile zurück
- `shootBackward()`: Spezialfunktion für rückwärtige Schüsse

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

**Methoden:**
- `update(time, delta)`: Aktualisiert alle Komponenten
- `takeDamage(amount)`: Verarbeitet Schaden
- `getRandomMovementPattern()`: Gibt ein zufälliges Bewegungsmuster zurück
- `getRandomShootingPattern()`: Gibt ein zufälliges Schussmuster zurück
- `initComponents(config)`: Initialisiert alle Komponenten
- `applyDifficulty(data)`: Passt Gegner an Schwierigkeitsgrad an

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

**Wichtige Methoden:**
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

**Wichtige Methoden:**
- `update(time, delta)`: Aktualisiert Waffensystem
- `setPattern(pattern)`: Setzt ein bestimmtes Schussmuster
- `fireBullet()`: Erzeugt ein einzelnes Projektil
- `fireSpread()`: Erzeugt einen Fächer aus Projektilen
- `adjustForDifficulty(difficulty)`: Passt Waffe an Schwierigkeit an

##### VisualComponent
Verwaltet visuelle Aspekte von Gegnern.

**Funktionen:**
- Farbeffekte und Tints
- Treffereffekte (Blinken, Farbwechsel)
- Todesanimationen
- Partikeleffekte
- Skalierung und Rotation

**Wichtige Methoden:**
- `update(time, delta)`: Aktualisiert visuelle Effekte
- `playHitEffect()`: Zeigt Treffereffekt
- `playDeathEffect()`: Zeigt Todeseffekt

#### Konkrete Gegnerklassen
- **StandardEnemy**: Einfacher Standardgegner
- **AdvancedEnemy**: Fortgeschrittener Gegner mit komplexeren Verhaltensweisen
- **EliteEnemy**: Elitegegner mit Spezialangriffen
- **BossEnemy**: Komplexer Bossgegner mit mehreren Phasen

### 3.5 Szenen-System

#### BaseScene (src/scenes/baseScene.ts)
Abstrakte Basisklasse für alle Spielszenen mit gemeinsamen Funktionen.

**Eigenschaften:**
- `eventBus`: Referenz auf das Event-System
- `stars`: Sternenhintergrund
- `planetsBackground`: Planetenhintergrund
- `fpsDisplay`: FPS-Anzeige

**Methoden:**
- `preload()`: Lädt gemeinsame Assets
- `create()`: Erstellt UI-Elemente und Hintergrund
- `update(time, delta)`: Standardupdates für alle Szenen
- `createButton(x, y, text, onClick)`: Erstellt UI-Buttons
- `createTextButton(x, y, text, callback)`: Erstellt Textbuttons
- `createFuturisticFrame(x, y, width, height)`: Erstellt UI-Rahmen
- `createStars()`: Erstellt Sternenhintergrund
- `updateStars(delta)`: Aktualisiert Sternenhintergrund
- `createPlanetsBackground()`: Erstellt Planetenhintergrund
- `createFpsDisplay()`: Erstellt FPS-Anzeige

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

**Methoden:**
- `getInstance()`: Gibt die Singleton-Instanz zurück
- `resetInstance()`: Setzt die EventBus-Instanz zurück
- `on(event, callback)`: Registriert einen Event-Listener
- `off(event, callback)`: Entfernt einen Event-Listener
- `emit(event, data)`: Löst ein Event aus
- `removeAllListeners(event)`: Entfernt alle Listener für ein Event
- `removeAllEvents()`: Entfernt alle Event-Listener

**Verfügbare Events (EventType):**
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
- `CREATE_SMALL_ASTEROID`: Erstellt einen kleinen Asteroiden
- `CREATE_ENERGY_PICKUP`: Erstellt ein Energie-Pickup
- `CREATE_POWER_PICKUP`: Erstellt ein Power-Pickup
- `REGISTER_ENEMY_BULLET`: Registriert ein Gegner-Projektil

```typescript
// Beispiel zur Verwendung
const eventBus = EventBus.getInstance();
eventBus.on(EventType.ENEMY_DESTROYED, this.handleEnemyDestroyed);
eventBus.emit(EventType.SCORE_UPDATED, points);
```

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
- **Webpack**: Bundling und Build-Toolchain
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

### 9.3 Assets konvertieren
```bash
node convert-assets.js
```

### 9.4 Sound-Assets generieren
```bash
node generate-sounds.js
```

## 10. Schlussfolgerung

Dieses Projekt bietet eine solide Grundlage für die Entwicklung von 2D-Spielen mit Phaser 3. Die komponentenbasierte Architektur ermöglicht einfache Erweiterbarkeit und Wartbarkeit. Die vorgeschlagenen Verbesserungen können als Fahrplan für die Weiterentwicklung des Projekts dienen. 