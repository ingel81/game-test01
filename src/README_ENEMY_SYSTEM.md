# Neue Komponentenbasierte Gegner-Architektur

## Übersicht

Die neue Gegner-Architektur verwendet ein komponentenbasiertes Design, um Code-Duplikation zu minimieren, Wiederverwendbarkeit zu maximieren und die Erstellung neuer Gegnertypen zu vereinfachen. Es besteht aus folgenden Hauptkomponenten:

1. **Basisklassen und Komponenten**
   - `BaseEnemy`: Neue Hauptklasse für alle Gegner, die Komponenten verwendet
   - `MovementComponent`: Verwaltet die Bewegungsmuster und -logik
   - `WeaponComponent`: Verwaltet Schussmuster und Projektilerzeugung
   - `VisualComponent`: Verwaltet Animationen und visuelle Effekte

2. **Konkrete Gegnerklassen**
   - `StandardEnemy`: Einfacher Gegnertyp für Standardgegner
   - `AdvancedEnemy`: Fortgeschrittener Gegnertyp mit komplexeren Verhaltensweisen
   - `EliteEnemy`: Elitegegner mit Spezialangriffen
   - `BossEnemy`: Komplexer Bossgegner mit mehreren Phasen

3. **Manager**
   - `NewEnemyManager`: Zentraler Manager für alle Gegner mit verbesserter Kontrolle

## Komponenten

### MovementComponent

Verwaltet alle Bewegungsmuster für Gegner. Unterstützt verschiedene Muster wie:
- Linear: Einfache lineare Bewegung
- Zigzag: Zickzack-Bewegung
- Circular: Kreisförmige Bewegung
- Tracking: Verfolgt den Spieler
- Evasive: Weicht dem Spieler aus
- Sinusoidal: Wellenförmige Bewegung
- Random: Zufällige Bewegung

Alle Bewegungsmuster sind vollständig konfigurierbar über Eigenschaften wie Geschwindigkeit, Amplitude, Frequenz, etc.

### WeaponComponent

Verwaltet alle Schussmuster und die Erstellung von Projektilen. Unterstützt verschiedene Muster:
- Single: Einfacher Schuss
- Double: Doppelschuss
- Burst: Serie von schnellen Schüssen
- Spread: Fächerschuss
- Random: Zufällige Kombination aus verschiedenen Schussmustern

Funktionen sind konfigurierbar über Parameter wie Feuerrate, Schussgeschwindigkeit, Zielverfolgung, etc.

### VisualComponent

Verwaltet visuelle Aspekte wie:
- Farbe und Tint-Effekte
- Treffereffekte (Blinken, Farbwechsel)
- Todesanimationen
- Partikeleffekte
- Glühen und andere visuelle Signale

## Verwendung

### Erstellen eines neuen Gegnertyps

Um einen neuen Gegnertyp zu erstellen:

1. Importiere die benötigten Klassen:
```typescript
import { BaseEnemy, EnemyConfig } from './baseEnemy';
import { Player } from '../player/player';
import { Constants } from '../../utils/constants';
```

2. Erstelle eine neue Klasse, die von BaseEnemy erbt:
```typescript
export class MyNewEnemy extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    // Konfiguriere mit einem EnemyConfig-Objekt
    const config: EnemyConfig = {
      texture: Constants.ASSET_ENEMY,
      health: 150,
      speed: 120,
      scoreValue: 75,
      fireRate: 900,
      
      // Optional: Bewegungseinstellungen
      movement: {
        pattern: 'zigzag',
        speed: 120,
        zigzagAmplitude: 100
      },
      
      // Optional: Waffeneinstellungen
      weapon: {
        pattern: 'double',
        fireRate: 900
      },
      
      // Optional: Visuelle Einstellungen
      visual: {
        tint: 0x00FF00,
        scale: 1.1
      }
    };
    
    super(scene, x, y, player, config);
  }
  
  // Überschreibe Methoden nur bei Bedarf
  public applyDifficulty(data: { difficulty: number, factor: number }): void {
    super.applyDifficulty(data);
    
    // Spezifische Anpassungen für diesen Gegnertyp
  }
}
```

### Integration in den EnemyManager

Um einen neuen Gegnertyp im EnemyManager zu verwenden:

1. Importiere den neuen Gegnertyp im NewEnemyManager
2. Füge ihn zur EnemyType-Definition hinzu
3. Aktualisiere die spawnEnemyOfType-Methode

```typescript
// Füge neuen Typ hinzu
type EnemyType = 'standard' | 'advanced' | 'elite' | 'boss' | 'myNewType';

// In spawnEnemyOfType:
case 'myNewType':
  enemy = new MyNewEnemy(this.scene, x, y, this.player);
  break;
```

## Vorteile des neuen Systems

1. **Modulares Design**: Komponenten können unabhängig voneinander geändert werden.
2. **Reduzierte Codeduplikation**: Gemeinsame Funktionalität ist in Komponenten ausgelagert.
3. **Einfachere Erweiterbarkeit**: Neue Gegnertypen erfordern nur minimale Konfiguration.
4. **Bessere Wartbarkeit**: Klare Trennung von Verantwortlichkeiten.
5. **Datengetriebene Erstellung**: Gegner werden über Konfigurationsobjekte definiert.
6. **Flexible Anpassung**: Jeder Aspekt ist individuell anpassbar.

## Schwierigkeitsanpassung

Das System unterstützt dynamische Schwierigkeitsanpassungen:

1. Jede Komponente hat eine `adjustForDifficulty`-Methode
2. Der Manager passt die Spawn-Raten je nach Schwierigkeit an
3. Gegner können dynamisch ihre Verhaltensweisen ändern

## Erweiterungsmöglichkeiten

- **Neue Bewegungsmuster**: Erweitere MovementComponent um neue Muster.
- **Neue Schussmuster**: Füge weitere Schussmuster in WeaponComponent hinzu.
- **KI-Verhaltensweisen**: Implementiere komplexere Verhaltensweisen durch Zustandsmaschinen.
- **Fähigkeitsbäume**: Erstelle Fähigkeitssystem für fortgeschrittene Gegner.
- **Gegner-Fraktionen**: Füge Interaktionen zwischen verschiedenen Gegnertypen hinzu.

## Tipps für die Implementierung neuer Gegner

1. **Beginne einfach**: Starte mit der BaseEnemy-Klasse und einem Konfigurationsobjekt.
2. **Nutze vorhandene Komponenten**: Verwende existierende Bewegungs- und Schussmuster.
3. **Teste früh**: Überprüfe das Verhalten des Gegners frühzeitig.
4. **Füge Spezialfähigkeiten hinzu**: Überschreibe Methoden nur, wenn spezielle Verhaltensweisen benötigt werden.
5. **Optimiere für Performance**: Achte auf effiziente Implementierung bei komplexen Verhaltensweisen. 