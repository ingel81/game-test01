import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 2: Asteroid Field
 * A level with increased asteroid presence and more enemy variety
 */
export const level2: LevelConfig = {
  id: 'level-2',
  name: 'Asteroid Field',
  description: 'Navigate through a dense asteroid field while fighting enemy forces.',
  minAsteroids: 450,
  maxAsteroids: 450,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.3, // Faster asteroid spawn rate
  asteroidSpeedMultiplier: 1.1, // Faster asteroids
  // music: 'music-level2',
  background: 'bg-asteroidfield',
  introText: 'You are now entering a dense asteroid field. Enemy forces are using the cover of the asteroids to launch surprise attacks.',
  outroText: 'Excellent navigation skills! You have successfully cleared the asteroid field of enemy presence.',
  
  waves: [
    // Initial wave - standard enemies in asteroid field
    {
      enemyType: EnemyType.STANDARD,
      count: 8,
      formation: FormationType.RANDOM,
      delay: 2000,
      speedMultiplier: 1.0
    },
    // Advanced enemies in line formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 6,
      formation: FormationType.LINE,
      delay: 8000,
      healthMultiplier: 1.1
    },
    // Mixed wave
    {
      enemyType: EnemyType.STANDARD,
      count: 8,
      formation: FormationType.V_FORMATION,
      delay: 8000,
      speedMultiplier: 1.1
    },
    // First turret encounter
    {
      enemyType: EnemyType.TURRET,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 10000,
      healthMultiplier: 1.0
    },
    // Final wave - Mixed advanced enemies
    {
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.SQUARE,
      delay: 12000,
      healthMultiplier: 1.2,
      speedMultiplier: 1.1,
      //isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    {
      time: 25000,
      enemyType: EnemyType.STANDARD,
      count: 4,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.1
    },
    {
      time: 45000,
      enemyType: EnemyType.ADVANCED,
      count: 3,
      formation: FormationType.SINGLE,
      healthMultiplier: 1.1
    }
  ],
  
  timedPickups: [
    {
      time: 20000,
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 40000,
      type: PickupType.POWER,
      count: 1
    },
    {
      time: 70000,
      type: PickupType.ENERGY,
      count: 2
    }
  ]
}; 