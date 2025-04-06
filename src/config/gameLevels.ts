/**
 * Game Levels Import
 * Importiert alle Level und stellt sie für das Spiel bereit
 */

import { LevelConfig, debugLevel } from './levelConfig';
import { level1 } from './levels/level1';
import { level2 } from './levels/level2';
import { level3 } from './levels/level3';
import { level4 } from './levels/level4';
import { level5 } from './levels/level5';
import { level6 } from './levels/level6';
import { level7 } from './levels/level7';
import { level8 } from './levels/level8';
import { level9 } from './levels/level9';
import { level10 } from './levels/level10';

/**
 * Array aller Level für das Spiel, in aufsteigender Schwierigkeit sortiert
 */
export const GameLevels: LevelConfig[] = [
  // Debug Level ist auskommentiert und wird nur für Testzwecke verwendet
  //debugLevel,
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
  level10
];

/**
 * Exportiere alle Level einzeln
 */
export {
  debugLevel,
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
  level10  
}; 