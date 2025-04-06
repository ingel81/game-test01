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
  delay?: number;             // Verzögerung zwischen einzelnen Gegnern in der Welle
  startDelay?: number;        // Verzögerung vor dem Start der Welle
  healthMultiplier?: number;  // Multiplikator für Gegner-Gesundheit
  speedMultiplier?: number;   // Multiplikator für Gegner-Geschwindigkeit
  isLevelEndTrigger?: boolean;// Ob diese Welle als Level-Ende-Auslöser dient
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
}

/**
 * Standard-Level-1-Konfiguration
 */
export const debugLevel: LevelConfig = {
  id: 'level-1',
  name: 'First Encounters',
  description: 'The first enemies appear. Be careful and test your weapons.',
  difficulty: 3,
  duration: 600000,
  minAsteroids: 20,
  maxAsteroids: 50,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID,
  introText: 'Enemy ships have been spotted in this sector. Eliminate them to protect our territory.',
  outroText: 'Well done! The first wave has been repelled.',
  
  waves: [    
    {
      enemyType: EnemyType.STANDARD,
      count: 1,
      formation: FormationType.LINE,
      delay: 1000,      
    }/*,    
    {
      enemyType: EnemyType.ADVANCED,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 1000
    },
    {
      enemyType: EnemyType.ELITE,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 1000
    },
    {
      enemyType: EnemyType.TURRET,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 1000
    },
    {
      enemyType: EnemyType.BOSS,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 1000,
      isLevelEndTrigger: true
    },*/    
    /*
    {
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 3000
    },
    {
      enemyType: EnemyType.BOSS,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 0,
      isLevelEndTrigger: true
    }*/
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
  ]
};

/**
 * Alle verfügbaren Level
 */
export const Levels: LevelConfig[] = [
  //debugLevel
  // Hier können später weitere Level hinzugefügt werden
]; 

// Die Level werden in gameManager.ts oder einem anderen geeigneten Ort importiert und eingesetzt 