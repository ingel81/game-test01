/**
 * Level-Konfiguration
 * Enthält Struktur und Definitionen für Game-Level
 */

import { Constants } from '../utils/constants';

/**
 * Gegnertypen für Level-Konfiguration
 */
export enum EnemyType {
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  ELITE = 'elite',
  TURRET = 'turret',
  BOSS = 'boss'
}

/**
 * Formationstypen für Gegner
 */
export enum FormationType {
  SINGLE = 'single',        // Einzelner Gegner
  LINE = 'line',            // Gegner in einer Linie
  V_FORMATION = 'vFormation', // V-Formation
  SQUARE = 'square',        // Quadratische Formation
  RANDOM = 'random'         // Zufällige Positionen
}

/**
 * Pickup-Typen für Level-Konfiguration
 */
export enum PickupType {
  ENERGY = 'energy',
  POWER = 'power'
}

/**
 * Definiert eine Welle von Gegnern
 */
export interface Wave {
  enemyType: EnemyType;       // Typ der Gegner
  count: number;              // Anzahl der Gegner
  formation: FormationType;   // Formation der Gegner
  delay?: number;             // Verzögerung vor dieser Welle (ms)
  healthMultiplier?: number;  // Multiplikator für Gegner-Gesundheit
  speedMultiplier?: number;   // Multiplikator für Gegner-Geschwindigkeit
}

/**
 * Zeitbasierte Gegner-Spawns
 */
export interface TimedSpawn {
  time: number;               // Zeit nach Levelstart (ms)
  enemyType: EnemyType;       // Typ der Gegner
  count: number;              // Anzahl der Gegner
  formation: FormationType;   // Formation der Gegner
  healthMultiplier?: number;  // Multiplikator für Gegner-Gesundheit
  speedMultiplier?: number;   // Multiplikator für Gegner-Geschwindigkeit
}

/**
 * Zeitbasierte Pickup-Spawns
 */
export interface TimedPickup {
  time: number;               // Zeit nach Levelstart (ms)
  type: PickupType;           // Typ des Pickups
  count: number;              // Anzahl der Pickups
}

/**
 * Bosseinstellungen für Level
 */
export interface BossSettings {
  enabled: boolean;           // Ob ein Boss in diesem Level erscheint
  time?: number;              // Zeit nach Levelstart (ms), optional wenn timeToSpawn verwendet wird
  healthMultiplier?: number;  // Multiplikator für Boss-Gesundheit
  speedMultiplier?: number;   // Multiplikator für Boss-Geschwindigkeit
  timeToSpawn?: number;       // Zeit nach Wellen-Ende (ms), optional wenn time verwendet wird
}

/**
 * Levelkonfiguration
 */
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
  boss?: BossSettings;            // Boss-Einstellungen
}

/**
 * Standard-Level-1-Konfiguration
 */
export const Level1: LevelConfig = {
  id: 'level-1',
  name: 'Die ersten Begegnungen',
  description: 'Die ersten Feinde erscheinen. Sei vorsichtig und teste deine Waffen.',
  difficulty: 1,
  duration: 40000, // 2 Minuten
  minAsteroids: 2,
  maxAsteroids: 5,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID,
  introText: 'Die ersten feindlichen Schiffe wurden gesichtet. Eliminiere sie, um unseren Sektor zu schützen.',
  outroText: 'Gut gemacht! Die erste Welle wurde abgewehrt.',
  
  waves: [
    /*
    {
      enemyType: EnemyType.STANDARD,
      count: 3,
      formation: FormationType.LINE,
      delay: 5000
    },
    {
      enemyType: EnemyType.ADVANCED,
      count: 2,
      formation: FormationType.SINGLE,
      delay: 20000
    },
    {
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 3000
    },*/
    {
      enemyType: EnemyType.BOSS,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 0
    }
  ],
  
  timedPickups: [
    {
      time: 20000,
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 50000,
      type: PickupType.POWER,
      count: 1
    }
  ],
  
  boss: {
    enabled: true,    
    timeToSpawn: 5000, // 10 Sekunden nach Ende der letzten Welle,
    //time: 1 // 10 Sekunden nach Ende der letzten Welle
  }
};

/**
 * Alle verfügbaren Level
 */
export const Levels: LevelConfig[] = [
  Level1
  // Hier können später weitere Level hinzugefügt werden
]; 