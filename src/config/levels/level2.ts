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
  difficulty: 2,
  duration: 120000, // 2 minutes (reduced from 2.5 minutes)
  minAsteroids: 25,
  maxAsteroids: 40,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID, // Standard asteroid spawn rate
  asteroidSpeedMultiplier: 1.0, // Standard asteroid speed
  // music: 'music-level2',
  background: 'bg-asteroidfield',
  introText: 'You are now entering a dense asteroid field. Enemy forces are using the cover of the asteroids to launch surprise attacks.',
  outroText: 'Excellent navigation skills! You have successfully cleared the asteroid field of enemy presence.',
  
  waves: [
    // Initial wave - standard enemies in asteroid field
    {
      enemyType: EnemyType.STANDARD,
      count: 6,
      formation: FormationType.RANDOM,
      delay: 3000, // Reduced from 5000
      speedMultiplier: 0.9
    },
    // Advanced enemies in line formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 4,
      formation: FormationType.LINE,
      delay: 12000 // Reduced from 20000
    },
    // Mixed wave
    {
      enemyType: EnemyType.STANDARD,
      count: 6,
      formation: FormationType.V_FORMATION,
      delay: 12000 // Reduced from 20000
    },
    // First turret encounter
    {
      enemyType: EnemyType.TURRET,
      count: 2,
      formation: FormationType.SINGLE,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 0.9
    },
    // Final wave - Mixed advanced enemies
    {
      enemyType: EnemyType.ADVANCED,
      count: 6,
      formation: FormationType.SQUARE,
      delay: 15000, // Reduced from 25000
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    {
      time: 30000, // Reduced from 40000
      enemyType: EnemyType.STANDARD,
      count: 3,
      formation: FormationType.RANDOM
    },
    {
      time: 60000, // Reduced from 80000
      enemyType: EnemyType.ADVANCED,
      count: 2,
      formation: FormationType.SINGLE
    }
  ],
  
  timedPickups: [
    {
      time: 25000, // Reduced from 35000
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 55000, // Reduced from 75000
      type: PickupType.POWER,
      count: 1
    },
    {
      time: 85000, // Reduced from 115000
      type: PickupType.ENERGY,
      count: 2
    }
  ]
}; 