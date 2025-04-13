# Echoes From The Rift - Dokumentation

## 1. Übersicht

Dieses Projekt ist ein 2D-Weltraum-Shooter, entwickelt mit Phaser 3 und TypeScript. Das Spiel nutzt eine objektorientierte, komponentenbasierte Architektur für maximale Wiederverwendbarkeit und Erweiterbarkeit.

## 2. Projektstruktur

Die Anwendung ist wie folgt strukturiert:

```
/
├── assets/            # Spielressourcen (Grafiken, Audio, Daten)
├── dist/              # Kompilierte Dateien für die Produktion
├── node_modules/      # Projekt Abhängigkeiten
├── src/               # Quellcode
│   ├── config/        # Spielkonfigurationen (z.B. Level, Gegner)
│   ├── core/          # Kernfunktionalitäten und Basiselemente (z.B. Konfiguration)
│   ├── entities/      # Spielobjekte (Spieler, Gegner, Projektile, etc.)
│   │   ├── enemies/   # Gegner-Klassen und -Komponenten
│   │   ├── player/    # Spieler-Klasse und -Komponenten
│   │   ├── pickups/   # Sammelgegenstände
│   │   ├── environment/ # Umgebungsobjekte (z.B. Asteroiden)
│   │   ├── Bullet.ts       # Basisklasse für Projektile
│   │   ├── EnemyBullet.ts  # Gegner-Projektilklasse
│   │   ├── PlayerBullet.ts # Spieler-Projektilklasse
│   │   ├── entity.ts       # Abstrakte Basisklasse für alle Entitäten
│   │   └── gameObject.ts   # Basisklasse für Entitäten mit Lebenspunkten etc.
│   ├── factories/     # Fabriken zum Erstellen von Spielobjekten (z.B. Projektile)
│   │   └── BulletFactory.ts # Fabrik für Projektile
│   ├── managers/      # Manager-Klassen (Kollision, Level, Gegner, Spawning, Sound, Musik)
│   │   ├── collisionManager.ts # Verwaltung der Kollisionserkennung
│   │   ├── enemyManager.ts     # Verwaltung von Gegnern
│   │   ├── levelManager.ts     # Verwaltung des Level-Fortschritts und der Events
│   │   ├── musicManager.ts     # Verwaltung der Hintergrundmusik
│   │   ├── soundManager.ts     # Verwaltung der Soundeffekte
│   │   └── spawnManager.ts     # Verwaltung des Spawnen von Gegnern und Objekten
│   ├── pipelines/     # Benutzerdefinierte Render-Pipelines
│   ├── scenes/        # Spielszenen (Hauptmenü, Spiel, Game Over, etc.)
│   │   ├── baseScene.ts      # Basisklasse für alle Szenen
│   │   ├── finishedScene.ts  # Szene nach erfolgreichem Abschluss
│   │   ├── gameScene.ts      # Haupt-Spielszenene
│   │   ├── gameOverScene.ts  # Game-Over-Szene
│   │   ├── mainMenuScene.ts  # Hauptmenü-Szene
│   │   └── pauseScene.ts     # Pause-Menü-Szene
│   ├── shaders/       # GLSL-Shader für visuelle Effekte
│   ├── ui/            # Komponenten der Benutzeroberfläche (HUD, Buttons, etc.)
│   │   ├── fpsDisplay.ts       # Anzeige der Bilder pro Sekunde
│   │   ├── gameUI.ts         # Haupt-UI-Container im Spiel
│   │   ├── healthBar.ts      # Lebenspunkteanzeige
│   │   ├── planetsBackground.ts # Parallax-Hintergrund mit Planeten
│   │   ├── scoreDisplay.ts     # Punkteanzeige
│   │   └── touchControls.ts    # Steuerungselemente für Touch-Geräte
│   ├── utils/         # Hilfsfunktionen und Dienstprogramme
│   └── index.ts       # Haupteinstiegspunkt der Anwendung
├── .cursor/           # Cursor-spezifische Konfigurationen
├── .git/              # Git-Repository-Verzeichnis
├── .gitignore         # Von Git ignorierte Dateien und Ordner
├── index.html         # Haupt-HTML-Datei der Anwendung
├── package-lock.json  # Exakte Versionen der Abhängigkeiten
├── package.json       # Projektdefinition und Abhängigkeiten
├── README.md          # Diese Dokumentation
├── temp.txt           # Temporäre Datei (vermutlich nicht relevant)
├── tsconfig.json      # TypeScript-Compiler-Konfiguration
└── vite.config.ts     # Vite Build-Tool-Konfiguration
```

## 3. Architektur

### 3.1 Kernkomponenten

#### GameConfig (`src/core/config.ts`)
Zentrale Konfigurationsklasse für Phaser-Einstellungen, Spielparameter und Bildschirmanpassungen. Sie initialisiert die Phaser-Spielinstanz mit den notwendigen Szenen, Physik-Einstellungen und Skalierungsmodi.

**Wichtigste Funktionen:**
- `getConfig()`: Liefert die Phaser-Konfiguration, die Szenen, Physik-Engine (Arcade), Renderer-Typ (Auto), Skalierungsoptionen (Fit, Auto-Center) und den Eltern-DOM-Container (`#game`) definiert.
- `addGameStyles()`: Fügt CSS-Regeln hinzu, um das Spiel zentriert und bildschirmfüllend darzustellen.
- `addResizeListener()`: Richtet einen Event-Listener ein, der das Spiel bei Größenänderungen des Browserfensters neu skaliert.

```typescript
// Beispiel: Initialisierung des Spiels in src/index.ts
import { GameConfig } from './core/config';

const config = GameConfig.getConfig();
GameConfig.addGameStyles(); // Styles anwenden
GameConfig.addResizeListener(); // Listener für Größenänderung hinzufügen

const game = new Phaser.Game(config); // Spielinstanz erstellen
```

Die Konfiguration umfasst:
- Renderer-Typ: `Phaser.AUTO` (wählt automatisch WebGL oder Canvas).
- Fenstergröße und Skalierung: Definiert die Basisgröße und passt sie dynamisch an (`Phaser.Scale.FIT`).
- Physik-Engine: `arcade` mit globaler Schwerkraft (standardmäßig 0).
- Szenen-Management: Listet alle Spielszenen auf, die Phaser bekannt sein sollen.
- DOM-Integration: Legt fest, in welchem HTML-Element das Spiel gerendert wird (`parent: 'game'`).
- Hintergrundfarbe: Standardmäßig schwarz (`backgroundColor: '#000'`).

### 3.2 Entity-System

Das Projekt verwendet ein hierarchisches Entity-System zur Organisation von Spielobjekten.

#### Entity (`src/entities/entity.ts`)
Abstrakte Basisklasse für alle dynamischen Objekte im Spiel. Sie bietet grundlegende Eigenschaften und Methoden für Positionierung, Bewegung und Lebenszyklusmanagement.

**Eigenschaften:**
- `sprite`: Das `Phaser.Physics.Arcade.Sprite`-Objekt, das die visuelle Darstellung und die physikalische Interaktion der Entität handhabt.
- `scene`: Eine Referenz auf die `Phaser.Scene`, zu der die Entität gehört.

**Öffentliche Methoden:**
- `getSprite()`: Gibt das zugehörige Phaser-Sprite zurück.
- `update(time: number, delta: number)`: Abstrakte Methode, die in jeder Frame zur Aktualisierung der Entitätslogik aufgerufen wird. Muss von abgeleiteten Klassen implementiert werden.
- `destroy()`: Methode zum Aufräumen und Entfernen der Entität aus dem Spiel. Gibt Ressourcen frei und entfernt das Sprite.
- `setPosition(x: number, y: number)`: Setzt die Position der Entität im Spielweltkoordinatensystem.
- `setVelocity(x: number, y: number)`: Setzt die Geschwindigkeit der Entität für die Bewegung.

```typescript
export abstract class Entity {
  protected sprite: Phaser.Physics.Arcade.Sprite;
  protected scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    this.scene = scene;
    // Initialisiert das Sprite mit Physik-Body
    this.sprite = scene.physics.add.sprite(x, y, texture);
    this.sprite.setData('parentEntity', this); // Referenz zur Entity speichern
  }

  // ... weitere Methoden ...

  public abstract update(time: number, delta: number): void;
}
```

#### GameObject (`src/entities/gameObject.ts`)
Erweitert die `Entity`-Klasse um Konzepte wie Lebenspunkte (Health), Schaden und Zerstörung. Diese Klasse dient als Basis für alle interaktiven Objekte, die beschädigt oder zerstört werden können (z.B. Spieler, Gegner).

**Eigenschaften:**
- `health`: Aktueller Gesundheitswert des Objekts.
- `maxHealth`: Maximaler Gesundheitswert des Objekts.
- `isDestroyed`: Ein Flag, das anzeigt, ob das Objekt zerstört wurde.

**Öffentliche Methoden:**
- `takeDamage(amount: number)`: Reduziert die Lebenspunkte des Objekts um den angegebenen Betrag. Löst die `onDestroy`-Logik aus, wenn die Lebenspunkte auf 0 oder darunter fallen. Gibt zurück, ob das Objekt nach dem Schaden zerstört ist.
- `getHealth()`: Gibt die aktuellen Lebenspunkte zurück.
- `getMaxHealth()`: Gibt die maximalen Lebenspunkte zurück.
- `getHealthPercentage()`: Berechnet die aktuellen Lebenspunkte als Prozentsatz der maximalen Lebenspunkte.
- `heal(amount: number)`: Erhöht die Lebenspunkte, begrenzt durch `maxHealth`.
- `destroy()`: Überschreibt die `destroy`-Methode von `Entity`, um sicherzustellen, dass `onDestroy` aufgerufen wird, bevor das Objekt endgültig entfernt wird.

**Geschützte Methoden:**
- `onCollision(other: GameObject)`: Abstrakte Methode, die von abgeleiteten Klassen implementiert werden muss, um auf Kollisionen mit anderen `GameObject`-Instanzen zu reagieren. Wird typischerweise vom `CollisionManager` aufgerufen.
- `onDestroy()`: Abstrakte Methode, die aufgerufen wird, wenn das Objekt zerstört wird (z.B. Lebenspunkte <= 0). Hier kann spezifische Logik für Zerstörungseffekte, Punktvergabe etc. implementiert werden.

```typescript
export abstract class GameObject extends Entity {
  protected health: number;
  protected maxHealth: number;
  protected isDestroyed: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, maxHealth: number) {
    super(scene, x, y, texture);
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  public takeDamage(amount: number): boolean {
    // ... Logik zum Reduzieren der Lebenspunkte ...
    if (this.health <= 0 && !this.isDestroyed) {
      this.isDestroyed = true;
      this.onDestroy(); // Zerstörungslogik aufrufen
      super.destroy(); // Basis-destroy aufrufen
      return true; // Objekt ist zerstört
    }
    return false; // Objekt lebt noch
  }

  // ... weitere Methoden ...

  protected abstract onCollision(other: GameObject): void;
  protected abstract onDestroy(): void;
}
```

### 3.3 Spieler-System

#### Player (`src/entities/player/player.ts`)
Implementiert die Spielercharakter-Klasse, die von `GameObject` erbt. Sie steuert die Bewegung, das Schießen, die Interaktion mit Power-Ups und die Schadensaufnahme.

**Haupteigenschaften:**
- `speed`: Maximale Bewegungsgeschwindigkeit des Spielers.
- `acceleration`: Beschleunigungsrate für die Bewegung.
- `deceleration`: Rate, mit der der Spieler abbremst, wenn keine Eingabe erfolgt.
- `weapon`: Eine Instanz von `PlayerWeapon`, die für das Abfeuern von Projektilen verantwortlich ist.
- `touchControls`: Optionales Objekt zur Verwaltung der Touch-Steuerung auf mobilen Geräten.
- `isInvincible`: Flag für kurzzeitige Unverwundbarkeit nach Schaden.
- `invincibilityDuration`: Dauer der Unverwundbarkeit in Millisekunden.
- `invincibilityTimer`: Timer für die Unverwundbarkeit.
- `shootTimer`: Timer zur Kontrolle der Feuerrate.
- `lastMoveDir`: Speichert die letzte Bewegungsrichtung für Sprite-Animationen.

**Wichtige Methoden:**
- `handleMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number)`: Verarbeitet Tastatureingaben (Pfeiltasten oder WASD) zur Steuerung der Spielerbewegung mit Beschleunigung und Abbremsung. Begrenzt die Bewegung auf den Bildschirmbereich.
- `handleTouchMovement(joystick: Phaser.GameObjects.Sprite | null, delta: number)`: Verarbeitet Eingaben von einem virtuellen Joystick für die Touch-Steuerung.
- `handleShooting(time: number, input: Phaser.Input.InputPlugin)`: Prüft, ob die Schusstaste (Leertaste oder Touch) gedrückt ist und feuert die Waffe unter Berücksichtigung der Feuerrate (`shootDelay`).
- `setupInputHandling()`: Initialisiert die Verarbeitung von Tastatur- und Touch-Eingaben.
- `takeDamage(amount: number)`: Überschreibt die Methode von `GameObject`. Macht den Spieler nach Erhalt von Schaden kurzzeitig unverwundbar und löst einen visuellen Blinkeffekt aus.
- `heal(amount: number)`: Stellt Lebenspunkte wieder her.
- `collectPowerUp()`: Erhöht die Waffenstufe des Spielers durch Aufrufen von `weapon.increasePower()`.
- `update(time: number, delta: number)`: Haupt-Update-Schleife für den Spieler. Ruft Bewegungs-, Schieß- und Unverwundbarkeitslogik auf.
- `onDestroy()`: Wird aufgerufen, wenn der Spieler zerstört wird. Löst normalerweise den Übergang zur "Game Over"-Szene aus.

**Besonderheiten:**
- **Flüssige Bewegung:** Verwendet Beschleunigung und Abbremsung anstelle von sofortiger Geschwindigkeitsänderung.
- **Touch-Steuerung:** Integriert optionale Touch-Steuerung über `TouchControls`.
- **Unverwundbarkeit:** Bietet kurzes Zeitfenster nach Schaden, um sofortige Mehrfachtreffer zu vermeiden.
- **Dynamische Sprites:** Ändert das Spieler-Sprite basierend auf der vertikalen Bewegung (Auf/Ab).

#### PlayerWeapon (`src/entities/player/playerWeapon.ts`)
Verwaltet das Waffensystem des Spielers, einschließlich verschiedener Leistungsstufen und Schussmuster. Nutzt einen Objektpool (`BulletFactory`) für effizientes Projektilmanagement.

**Haupteigenschaften:**
- `powerLevel`: Aktuelle Leistungsstufe der Waffe (beginnt bei 1, maximal 6). Beeinflusst Schussmuster und Feuerrate.
- `maxPowerLevel`: Maximale erreichbare Leistungsstufe.
- `bulletFactory`: Eine Instanz der `BulletFactory` zum Erzeugen von `PlayerBullet`-Objekten.
- `shotDelay`: Zeitintervall (in Millisekunden) zwischen den Schüssen. Verringert sich mit höherem `powerLevel`.
- `shotPatterns`: Eine Map, die für jede Leistungsstufe das entsprechende Schussmuster (Anzahl, Winkel der Projektile) definiert.

**Wichtige Methoden:**
- `shoot(x: number, y: number)`: Erzeugt Projektile entsprechend der aktuellen `powerLevel` und dem zugehörigen `shotPattern`. Nutzt die `bulletFactory`, um Projektile aus dem Pool zu holen oder neu zu erstellen.
- `update(time: number, delta: number)`: (Aktuell nicht implementiert, könnte für Waffen-spezifische Updates genutzt werden).
- `increasePower()`: Erhöht die `powerLevel`, wenn das Maximum noch nicht erreicht ist. Passt `shotDelay` entsprechend an.
- `getShotDelay()`: Gibt die aktuelle Feuerrate zurück.
- `getCurrentPowerLevel()`: Gibt die aktuelle Waffenstufe zurück.

**Schussmuster nach Leistungsstufe (Beispiele):**
- Stufe 1: Ein einzelner gerader Schuss.
- Stufe 2: Schnellerer Einzelschuss.
- Stufe 3: Doppelschuss (zwei parallele Projektile).
- Stufe 4: Dreifachschuss (ein gerader, zwei leicht abgewinkelte).
- Stufe 5 & 6: Breitere Fächer mit mehr Projektilen und höherer Feuerrate.

### 3.4 Projektilsystem

Das Spiel nutzt ein wiederverwendbares System für verschiedene Arten von Projektilen.

#### Bullet (`src/entities/Bullet.ts`)
Abstrakte Basisklasse für alle Projektile (Spieler und Gegner). Definiert grundlegende Eigenschaften und Verhalten.

**Haupteigenschaften:**
- `damage`: Der Schadenswert, den das Projektil bei einem Treffer verursacht.
- `speed`: Die Geschwindigkeit, mit der sich das Projektil bewegt.
- `owner`: Ein String ('player' oder 'enemy'), der angibt, wer das Projektil abgefeuert hat. Wichtig für die Kollisionserkennung (damit Spieler nicht ihre eigenen Kugeln treffen).
- `lifespan`: Maximale Lebensdauer des Projektils in Millisekunden, bevor es automatisch entfernt wird.

**Wichtige Methoden:**
- `fire(x: number, y: number, angle: number, speed: number)`: Aktiviert und positioniert ein Projektil aus dem Pool. Setzt seine Geschwindigkeit basierend auf dem Winkel.
- `update(time: number, delta: number)`: Aktualisiert die Position des Projektils. Überprüft, ob es die Bildschirmgrenzen verlassen hat oder seine `lifespan` abgelaufen ist, und deaktiviert es gegebenenfalls.
- `deactivate()`: Deaktiviert das Projektil und gibt es an den Objektpool zurück (falls Pooling verwendet wird).
- `setOwner(owner: 'player' | 'enemy')`: Legt den Besitzer des Projektils fest.

#### PlayerBullet (`src/entities/PlayerBullet.ts`)
Spezifische Implementierung für Projektile, die vom Spieler abgefeuert werden. Erbt von `Bullet`.

**Besonderheiten:**
- Wird typischerweise mit `owner = 'player'` initialisiert.
- Verwendet eine spezifische Textur ('player-bullet').
- Kann zusätzliche Logik für Spieler-spezifische Effekte oder Upgrades enthalten (obwohl Upgrades meist in `PlayerWeapon` gehandhabt werden).

#### EnemyBullet (`src/entities/EnemyBullet.ts`)
Spezifische Implementierung für Projektile, die von Gegnern abgefeuert werden. Erbt von `Bullet`.

**Besonderheiten:**
- Wird typischerweise mit `owner = 'enemy'` initialisiert.
- Verwendet eine spezifische Textur ('enemy-bullet').
- Kann komplexere Bewegungs- oder Zielmuster implementieren (z.B. zielsuchend, sinusförmig).

#### BulletFactory (`src/factories/BulletFactory.ts`)
Eine Factory-Klasse, die für die effiziente Erstellung und Verwaltung von Projektil-Objekten verantwortlich ist. Sie verwendet **Objekt-Pooling**, um die Performance zu verbessern, indem sie deaktivierte Projektile wiederverwendet, anstatt ständig neue zu erstellen und zu zerstören.

**Hauptmethoden:**
- `constructor(scene: Phaser.Scene)`: Initialisiert Pools für verschiedene Projektiltypen (`PlayerBullet`, `EnemyBullet`).
- `getBullet<T extends Bullet>(type: { new(...args: any[]): T }, owner: 'player' | 'enemy')`: Holt ein inaktives Projektil des angeforderten Typs aus dem entsprechenden Pool oder erstellt ein neues, falls der Pool leer ist. Setzt den Besitzer.
- `createPlayerBullet(x: number, y: number, angle: number, speed: number)`: Holt ein `PlayerBullet`-Objekt, aktiviert und konfiguriert es mit den gegebenen Parametern.
- `createEnemyBullet(x: number, y: number, angle: number, speed: number)`: Holt ein `EnemyBullet`-Objekt, aktiviert und konfiguriert es.
- `releaseBullet(bullet: Bullet)`: Deaktiviert ein Projektil und gibt es an seinen Pool zurück, damit es wiederverwendet werden kann. Diese Methode wird normalerweise von der `update`- oder `deactivate`-Methode des `Bullet` selbst aufgerufen.

```typescript
// Beispiel: Verwendung der BulletFactory in PlayerWeapon
this.bulletFactory.createPlayerBullet(startX, startY, angle, bulletSpeed);

// Beispiel: Internes Pooling in BulletFactory
private playerBulletPool: Phaser.GameObjects.Group;
// ...
const bullet = this.playerBulletPool.get(undefined, undefined, 'player-bullet') as PlayerBullet;
if (bullet) {
  // Konfiguriere wiederverwendetes Projektil
  bullet.setActive(true).setVisible(true);
  bullet.setOwner(owner);
  // ...
  return bullet;
} else {
  // Erstelle neues Projektil, falls Pool leer ist
  const newBullet = new type(this.scene, 0, 0, 'player-bullet', owner);
  // ...
  this.playerBulletPool.add(newBullet);
  return newBullet;
}
```

### 3.5 Gegner-System

Das Gegnersystem ist modular aufgebaut und nutzt Komponenten für Verhalten und Waffen.

#### BaseEnemy (`src/entities/enemies/baseEnemy.ts`)
Abstrakte Basisklasse für alle Gegner im Spiel. Erbt von `GameObject`. Definiert gemeinsame Eigenschaften und Methoden für Gegner.

**Eigenschaften:**
- `scoreValue`: Punkte, die der Spieler erhält, wenn dieser Gegner zerstört wird.
- `movementComponent`: Eine Instanz einer Bewegungskomponente (z.B. `LinearMovement`, `SineMovement`), die das Bewegungsmuster des Gegners definiert.
- `weaponComponent`: Eine Instanz einer Waffenkomponente (z.B. `BasicEnemyWeapon`), die das Schussverhalten des Gegners steuert.
- `visualComponent`: Optional, für spezielle visuelle Effekte (z.B. Animationen bei Schaden).

**Wichtige Methoden:**
- `constructor(...)`: Initialisiert den Gegner, setzt Lebenspunkte, Punktwert und weist die erforderlichen Komponenten (Bewegung, Waffe) zu.
- `update(time: number, delta: number)`: Ruft die `update`-Methoden der zugewiesenen Komponenten auf (Bewegung, Waffe, Visuals). Überprüft auch, ob der Gegner den Bildschirm verlassen hat und zerstört ihn ggf.
- `onCollision(other: GameObject)`: Implementiert die Kollisionslogik. Prüft, ob die Kollision mit einem `PlayerBullet` stattgefunden hat und nimmt entsprechend Schaden.
- `onDestroy()`: Wird aufgerufen, wenn der Gegner zerstört wird. Vergibt Punkte an den Spieler (`ScoreManager.addScore`), löst möglicherweise eine Explosion aus und gibt Ressourcen frei.
- `setMovement(component: MovementComponent)`: Weist eine neue Bewegungskomponente zu.
- `setWeapon(component: WeaponComponent)`: Weist eine neue Waffenkomponente zu.

#### Gegner-Typen (Beispiele in `src/entities/enemies/`)
Spezifische Gegnerklassen erben von `BaseEnemy` und konfigurieren dieses mit spezifischen Texturen, Lebenspunkten, Punktwerten sowie konkreten Bewegungs- und Waffenkomponenten.

- **`ScoutEnemy`**: Einfacher Gegner, bewegt sich linear, schießt selten.
- **`FighterEnemy`**: Bewegt sich in einem Sinusmuster, schießt häufiger.
- **`CruiserEnemy`**: Größerer, langsamerer Gegner mit mehr Lebenspunkten, schießt Salven.
- **`Asteroid`**: Kein traditioneller Gegner, sondern ein Umgebungshindernis. Erbt möglicherweise direkt von `GameObject`, hat keine Waffe, zerbricht bei Zerstörung in kleinere Teile.

#### Komponenten (`src/entities/enemies/components/`)

Das Komponentensystem ermöglicht flexibles Gegnerdesign:

- **Movement Components (`movement/`)**:
    - `LinearMovement`: Einfache geradlinige Bewegung mit konstanter Geschwindigkeit.
    - `SineMovement`: Bewegung entlang einer Sinuskurve für ausweichendes Verhalten.
    - `PathMovement`: Folgt einem vordefinierten Pfad (Sequenz von Punkten).
    - `TargetedMovement`: Bewegt sich auf den Spieler zu (ggf. mit Begrenzungen).
- **Weapon Components (`weapon/`)**:
    - `NoWeapon`: Feuert keine Projektile.
    - `SingleShotWeapon`: Feuert einzelne Projektile in Intervallen.
    - `SpreadShotWeapon`: Feuert mehrere Projektile in einem Fächer.
    - `BurstFireWeapon`: Feuert kurze Salven von Projektilen.
- **Visual Components (`visual/`)**:
    - `BlinkOnHit`: Lässt den Gegner kurz aufblitzen, wenn er getroffen wird.
    - `EngineTrail`: Fügt einen Partikeleffekt als Antriebsspur hinzu.

### 3.6 Manager-Klassen (`src/managers/`)

Manager koordinieren übergreifende Spielsysteme. Sie werden oft in der Haupt-Spielszene (`GameScene`) instanziiert und aktualisiert.

#### CollisionManager (`src/managers/collisionManager.ts`)
Verwaltet die Kollisionserkennung und -behandlung zwischen verschiedenen Spielobjektgruppen.

**Aufgaben:**
- Definiert Kollisionsregeln zwischen Gruppen (z.B. Spieler vs. Gegner-Projektile, Spieler-Projektile vs. Gegner).
- Nutzt die Arcade-Physik von Phaser (`this.scene.physics.add.collider` und `this.scene.physics.add.overlap`), um Kollisionen zu erkennen.
- Ruft die `onCollision`-Methode der beteiligten `GameObject`-Instanzen auf, wenn eine Kollision auftritt.
- Verwaltet Gruppen von Spielobjekten (z.B. `playerGroup`, `enemyGroup`, `playerBulletGroup`, `enemyBulletGroup`).

```typescript
// Beispiel: Kollision zwischen Spieler-Projektilen und Gegnern
this.scene.physics.add.overlap(
  this.playerBulletGroup,
  this.enemyGroup,
  (bulletSprite, enemySprite) => {
    const bullet = bulletSprite.getData('parentEntity') as Bullet;
    const enemy = enemySprite.getData('parentEntity') as BaseEnemy;

    if (bullet && enemy && !bullet.getData('collided')) {
      bullet.setData('collided', true); // Verhindert Mehrfachkollisionen derselben Kugel
      enemy.onCollision(bullet); // Ruft die Kollisionsbehandlung des Gegners auf
      bullet.deactivate(); // Deaktiviert das Projektil nach dem Treffer
    }
  }
);
```

#### EnemyManager (`src/managers/enemyManager.ts`)
Verantwortlich für die Verwaltung aller aktiven Gegner im Spiel.

**Aufgaben:**
- Hält eine Liste oder Gruppe (`enemyGroup`) aller aktiven Gegner.
- Fügt neue Gegner hinzu (oft in Zusammenarbeit mit `SpawnManager` oder `LevelManager`).
- Entfernt zerstörte oder außerhalb des Bildschirms befindliche Gegner.
- Ruft die `update`-Methode für jeden aktiven Gegner in der Spiel-Schleife auf.
- Stellt Methoden bereit, um Informationen über Gegner abzurufen (z.B. Anzahl, Positionen).

#### LevelManager (`src/managers/levelManager.ts`)
Steuert den Ablauf des Spiellevels, einschließlich des Timings von Events wie Gegnerwellen, Bosskämpfen und dem Levelende.

**Aufgaben:**
- Lädt Leveldaten (z.B. aus einer JSON-Datei), die definieren, wann welche Gegner oder Events auftreten sollen.
- Verfolgt den Fortschritt im Level (z.B. basierend auf Zeit oder besiegten Gegnern).
- Löst Events aus, indem es den `SpawnManager` anweist, bestimmte Gegner oder Wellen zu spawnen.
- Kann den Schwierigkeitsgrad im Laufe des Levels anpassen.
- Löst das Ende des Levels aus und startet möglicherweise den Übergang zur nächsten Szene (`FinishedScene`).

#### MusicManager (`src/managers/musicManager.ts`)
Verwaltet die Hintergrundmusik des Spiels.

**Aufgaben:**
- Lädt und spielt Hintergrundmusik-Tracks ab.
- Sorgt für nahtlose Übergänge zwischen Tracks oder Loops.
- Steuert die Lautstärke der Musik.
- Kann die Musik je nach Spielzustand ändern (z.B. Bosskampf-Musik).

#### SoundManager (`src/managers/soundManager.ts`)
Verwaltet alle Soundeffekte im Spiel.

**Aufgaben:**
- Lädt Soundeffekt-Dateien (z.B. Schüsse, Explosionen, Power-Ups).
- Spielt Soundeffekte auf Anfrage ab (z.B. `soundManager.play('explosion')`).
- Verwendet möglicherweise Sound-Pooling oder steuert die Anzahl gleichzeitig spielender Sounds, um Performance-Probleme oder Überlagerungen zu vermeiden.
- Steuert die globale Lautstärke der Soundeffekte.

#### SpawnManager (`src/managers/spawnManager.ts`)
Zuständig für das tatsächliche Erzeugen (Spawnen) von Gegnern, Power-Ups und anderen Objekten in der Spielwelt. Arbeitet oft eng mit dem `LevelManager` und `EnemyManager` zusammen.

**Aufgaben:**
- Enthält Logik zum Erstellen spezifischer Gegnertypen an bestimmten Positionen (oft außerhalb des sichtbaren Bereichs).
- Nutzt möglicherweise Factories (wie `EnemyFactory`, falls vorhanden), um Objekte zu erstellen.
- Fügt neu erzeugte Objekte den relevanten Gruppen im `EnemyManager` und `CollisionManager` hinzu.
- Kann zufällige Spawn-Positionen oder Muster implementieren.
- Verwaltet das Spawnen von Power-Ups nach Zerstörung von Gegnern oder nach Zeitintervallen.

### 3.7 Szenen (`src/scenes/`)

Phaser-Spiele sind in Szenen unterteilt. Jede Szene repräsentiert einen bestimmten Zustand oder Bildschirm des Spiels (z.B. Hauptmenü, Spiel selbst, Game Over).

#### BaseScene (`src/scenes/baseScene.ts`)
Eine benutzerdefinierte Basisklasse, von der alle anderen Szenen erben können. Sie kann gemeinsame Funktionalitäten enthalten, wie z.B.:
- Zugriff auf globale Manager (Sound, Musik).
- Gemeinsame UI-Elemente (z.B. Hintergrund).
- Standardmethoden für `preload`, `create`, `update`.

#### MainMenuScene (`src/scenes/mainMenuScene.ts`)
Zeigt das Hauptmenü an.
- Lädt Menü-Assets (Hintergrund, Logo, Buttons).
- Zeigt Spieltitel und Buttons (z.B. "Start Game", "Options").
- Verarbeitet Benutzereingaben (Klicks auf Buttons).
- Startet die `GameScene`, wenn der "Start Game"-Button gedrückt wird.

#### GameScene (`src/scenes/gameScene.ts`)
Die Hauptszene, in der das eigentliche Gameplay stattfindet.
- `preload()`: Lädt alle für das Spiel notwendigen Assets (Spieler, Gegner, Projektile, Hintergründe, Sounds, Musik).
- `create()`: Initialisiert das Spiel:
    - Erstellt den Spieler.
    - Instanziiert alle Manager (`CollisionManager`, `EnemyManager`, `LevelManager`, `SpawnManager`, `SoundManager`, `MusicManager`).
    - Richtet die Benutzeroberfläche (`GameUI`) ein.
    - Startet die Hintergrundmusik (`MusicManager`).
    - Richtet Kollisionsregeln im `CollisionManager` ein.
    - Startet den `LevelManager`.
- `update(time: number, delta: number)`: Die Haupt-Spiel-Schleife:
    - Aktualisiert den Spieler (Bewegung, Schießen).
    - Aktualisiert alle Manager (`EnemyManager.update()`, `LevelManager.update()`).
    - Aktualisiert die UI (`GameUI.update()`).
    - Verarbeitet Pausierung (`PauseScene`).

#### GameOverScene (`src/scenes/gameOverScene.ts`)
Wird angezeigt, wenn der Spieler verliert (Lebenspunkte <= 0).
- Zeigt "Game Over"-Text an.
- Zeigt den erreichten Punktestand an.
- Bietet Optionen zum Neustarten (`GameScene`) oder Zurückkehren zum Hauptmenü (`MainMenuScene`).

#### FinishedScene (`src/scenes/finishedScene.ts`)
Wird angezeigt, wenn der Spieler das Level erfolgreich abgeschlossen hat.
- Zeigt "Level Complete" oder "Congratulations"-Text an.
- Zeigt den finalen Punktestand an.
- Bietet Optionen zum Fortfahren (falls es mehrere Level gibt) oder Zurückkehren zum Hauptmenü.

#### PauseScene (`src/scenes/pauseScene.ts`)
Eine überlagernde Szene, die angezeigt wird, wenn das Spiel pausiert wird.
- Zeigt "Paused"-Text und Optionen wie "Resume", "Restart", "Main Menu" an.
- Stoppt die Aktualisierung der `GameScene`, während sie aktiv ist.
- Nimmt das Spiel wieder auf (`this.scene.resume('GameScene')`) oder wechselt zu anderen Szenen.

### 3.8 Benutzeroberfläche (UI) (`src/ui/`)

Komponenten zur Anzeige von Informationen und zur Interaktion mit dem Spieler.

#### GameUI (`src/ui/gameUI.ts`)
Ein Container oder eine Klasse, die alle HUD-Elemente (Heads-Up Display) während des Spiels verwaltet.
- Erstellt und positioniert Elemente wie `HealthBar`, `ScoreDisplay`, `FPSDisplay`.
- Aktualisiert diese Elemente regelmäßig mit Daten aus dem Spiel (z.B. `player.getHealthPercentage()`, `scoreManager.getScore()`).
- Kann auch Pausen-Buttons oder andere interaktive UI-Elemente enthalten.

#### HealthBar (`src/ui/healthBar.ts`)
Zeigt die Lebenspunkte des Spielers an, oft als Balken, der sich leert.
- Nimmt einen Wert (typischerweise zwischen 0 und 1) entgegen und stellt ihn grafisch dar.
- Kann Farbänderungen verwenden (z.B. grün bei voll, rot bei niedrig).

#### ScoreDisplay (`src/ui/scoreDisplay.ts`)
Zeigt den aktuellen Punktestand des Spielers an.
- Aktualisiert einen Textwert basierend auf den Daten vom `ScoreManager` (oder direkt aus der `GameScene`).

#### FPSDisplay (`src/ui/fpsDisplay.ts`)
Zeigt die aktuelle Bildrate (Frames Per Second) an. Nützlich für die Leistungsüberwachung während der Entwicklung.
- Greift auf `this.game.loop.actualFps` zu und zeigt den Wert an.

#### TouchControls (`src/ui/touchControls.ts`)
Implementiert Steuerelemente für Touch-Geräte, typischerweise einen virtuellen Joystick für die Bewegung und einen Button zum Schießen.
- Erstellt sichtbare Steuerelemente auf dem Bildschirm.
- Verarbeitet Touch-Events (Start, Bewegung, Ende) auf diesen Elementen.
- Stellt den aktuellen Status der Steuerung (z.B. Bewegungsrichtung, Schusstaste gedrückt) für die `Player`-Klasse bereit.

#### PlanetsBackground (`src/ui/planetsBackground.ts`)
Implementiert einen scrollenden Parallax-Hintergrund mit mehreren Ebenen (z.B. Sterne, ferne Planeten, nahe Planeten), die sich mit unterschiedlichen Geschwindigkeiten bewegen, um einen Tiefeneffekt zu erzeugen.
- Verwendet `Phaser.GameObjects.TileSprite`, um nahtlos scrollende Texturen zu erstellen.
- Aktualisiert die `tilePositionX` der TileSprites in jeder Frame, um den Scrolleffekt zu erzielen.

### 3.9 Hilfsfunktionen (`src/utils/`)

Ein Verzeichnis für allgemeine Hilfsfunktionen oder Klassen, die an verschiedenen Stellen im Code verwendet werden können. Beispiele:
- **Mathematische Funktionen:** Berechnungen für Winkel, Distanzen, Vektoren.
- **Zufallsgeneratoren:** Erzeugung von Zufallszahlen innerhalb bestimmter Bereiche.
- **String-Formatierung:** Funktionen zur Formatierung von Text (z.B. für die Punkteanzeige).
- **Konstanten:** Definition globaler Konstanten (z.B. `MAX_PLAYER_SPEED`).

## 4. Technologien

- **Engine:** Phaser 3 (Version 3.70.0 oder neuer) - Ein beliebtes HTML5-Spieleframework.
- **Sprache:** TypeScript (Version 5.3.3 oder neuer) - Fügt statische Typisierung zu JavaScript hinzu.
- **Build-Tool:** Vite (Version 5.0.0 oder neuer) - Ein schnelles Frontend-Build-Tool, das Hot Module Replacement (HMR) für eine schnelle Entwicklung bietet.
- **Physik:** Phaser Arcade Physics - Die integrierte 2D-Physik-Engine von Phaser.

## 5. Setup und Start

### Voraussetzungen

- Node.js und npm (oder yarn) müssen installiert sein.

### Installation

1. Klone das Repository:
   ```bash
   git clone <repository-url>
   cd <projekt-verzeichnis>
   ```
2. Installiere die Abhängigkeiten:
   ```bash
   npm install
   ```

### Entwicklungsserver starten

Starte den Vite-Entwicklungsserver mit Hot Reloading:
```bash
npm run dev
```
Das Spiel sollte sich automatisch in deinem Standardbrowser öffnen (standardmäßig auf `http://localhost:3000`).

### Produktion Build erstellen

Erstellt optimierte Dateien im `dist/`-Verzeichnis für das Deployment:
```bash
npm run build
```

### Build-Vorschau

Startet einen lokalen Server, um den Produktions-Build zu testen:
```bash
npm run preview
```

## 6. Wichtige Konzepte

- **Objektorientierung:** Verwendung von Klassen und Vererbung zur Strukturierung des Codes (`Entity`, `GameObject`, `Player`, `BaseEnemy`).
- **Komponenten:** Zerlegung von komplexem Verhalten (Bewegung, Waffen) in wiederverwendbare Komponenten, insbesondere im Gegner-System.
- **Szenenmanagement:** Aufteilung des Spiels in logische Zustände (`MainMenuScene`, `GameScene`, `GameOverScene`).
- **Physik:** Nutzung der Arcade-Physik für Bewegung und Kollisionserkennung.
- **Objekt-Pooling:** Wiederverwendung von Objekten (insbesondere `Bullet`) zur Verbesserung der Performance durch Reduzierung von Garbage Collection (`BulletFactory`).
- **Manager-Klassen:** Zentralisierung der Logik für übergreifende Systeme (Kollision, Level, Sound).
- **TypeScript:** Nutzung von Typen zur Verbesserung der Codequalität und Wartbarkeit.
- **Vite:** Schneller Entwicklungszyklus durch HMR und optimierte Builds.

## 7. Zukünftige Erweiterungen (Ideen)

- Mehr Gegnertypen und Bosskämpfe.
- Zusätzliche Waffen und Power-Ups.
- Unterschiedliche Level mit variierenden Umgebungen und Herausforderungen.
- Online-Highscore-Tabelle.
- Verbesserte visuelle Effekte und Partikelsysteme.
- Controller-Unterstützung.
- Detailliertere Konfigurationsdateien für Level und Gegner.