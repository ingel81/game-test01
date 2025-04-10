import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

// Log to verify enums are correctly imported
console.log('Level1 importing - EnemyType values:', EnemyType);
console.log('Level1 importing - FormationType values:', FormationType);

/**
 * Level 1: First Contact
 * An introductory level with basic enemies to learn the game mechanics
 */
export const level1: LevelConfig = {
  id: 'level-1',
  name: 'First Contact',
  description: 'Your first encounter with enemy scouts. Stay focused and learn the controls.',
  minAsteroids: 15,
  maxAsteroids: 25,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 1.2, // Slightly faster asteroid spawn rate
  asteroidSpeedMultiplier: 0.9, // Slightly faster asteroids
  background: 'bg-nebula1',
  introText: 'Enemy scouts detected in this sector. Eliminate them while avoiding asteroids. This is your first real mission, pilot.',
  outroText: 'Well done! You have successfully repelled the first wave of scouts.',
  
  waves: [
    // Tutorial wave - single enemies with pauses
    {
      enemyType: EnemyType.STANDARD,
      count: 4,
      formation: FormationType.SINGLE,
      delay: 1200,
      healthMultiplier: 0.9,
      speedMultiplier: 0.8
    },
    // Small line formation
    {
      enemyType: EnemyType.STANDARD,
      count: 6,
      formation: FormationType.LINE,
      delay: 6000
    },
    // Introduce advanced enemy type
    {
      enemyType: EnemyType.ADVANCED,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 6000,
      healthMultiplier: 1.0
    },
    // Final wave - mixed formation
    {
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 8000
    }
  ],
  
  timedPickups: [
    {
      time: 15000,
      type: PickupType.ENERGY,
      count: 1
    },
    {
      time: 35000,
      type: PickupType.POWER,
      count: 1
    },
    {
      time: 55000,
      type: PickupType.ENERGY,
      count: 2
    }
  ]
};

// Log the created level to check for issues
console.log("Level 1 created:", level1);
console.log("Level 1 waves:", level1.waves); 