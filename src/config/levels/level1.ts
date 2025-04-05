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
  difficulty: 1,
  duration: 90000, // 1.5 minutes (reduced from 2 minutes)
  minAsteroids: 10,
  maxAsteroids: 20,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 1.5, // Slower asteroid spawn rate for beginners
  asteroidSpeedMultiplier: 0.8, // Slower asteroids for beginners
  background: 'bg-nebula1',
  introText: 'Enemy scouts detected in this sector. Eliminate them while avoiding asteroids. This is your first real mission, pilot.',
  outroText: 'Well done! You have successfully repelled the first wave of scouts.',
  
  waves: [
    // Tutorial wave - single enemies with pauses
    {
      enemyType: EnemyType.STANDARD,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 1500, // Reduced from 2000
      healthMultiplier: 0.8, // Weaker enemies for the first level
      speedMultiplier: 0.7 // Slower enemies for beginners
    },
    // Small line formation
    {
      enemyType: EnemyType.STANDARD,
      count: 5,
      formation: FormationType.LINE,
      delay: 8000 // Reduced from 15000
    },
    // Introduce advanced enemy type
    {
      enemyType: EnemyType.ADVANCED,
      count: 2,
      formation: FormationType.SINGLE,
      delay: 8000, // Reduced from 15000
      healthMultiplier: 0.9
    },
    // Final wave - mixed formation
    {
      enemyType: EnemyType.STANDARD,
      count: 8,
      formation: FormationType.V_FORMATION,
      delay: 10000, // Reduced from 20000
      isLevelEndTrigger: true
    }
  ],
  
  timedPickups: [
    {
      time: 20000, // Reduced from 30000
      type: PickupType.ENERGY,
      count: 1
    },
    {
      time: 45000, // Reduced from 60000
      type: PickupType.POWER,
      count: 1
    },
    {
      time: 70000, // Reduced from 90000
      type: PickupType.ENERGY,
      count: 2
    }
  ]
};

// Log the created level to check for issues
console.log("Level 1 created:", level1);
console.log("Level 1 waves:", level1.waves); 