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
