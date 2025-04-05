import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 3: Enemy Outpost
 * A challenging level with more advanced enemies and coordinated attacks
 */
export const level3: LevelConfig = {
  id: 'level-3',
  name: 'Enemy Outpost',
  description: 'Attack an enemy outpost guarded by coordinated forces and defense turrets.',
  difficulty: 3,
  duration: 150000, // 2.5 minutes (reduced from 3 minutes)
  minAsteroids: 15,
  maxAsteroids: 30,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 1.2, // Moderate asteroid presence
  asteroidSpeedMultiplier: 1.1, // Slightly faster asteroids
  music: 'music-level3',
  background: 'bg-outpost',
  introText: 'We have detected an enemy outpost in this sector. It is heavily defended with turrets and patrol ships. Eliminate all threats.',
  outroText: 'The outpost has been neutralized! The enemy will be forced to fall back and regroup.',
  
  waves: [
    // Patrol wave - standard enemies in V formation
    {
      enemyType: EnemyType.STANDARD,
      count: 7,
      formation: FormationType.V_FORMATION,
      delay: 2000 // Reduced from 3000
    },
    // Outpost defense - turrets in line formation
    {
      enemyType: EnemyType.TURRET,
      count: 3,
      formation: FormationType.LINE,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.1
    },
    // Elite guard squad
    {
      enemyType: EnemyType.ADVANCED,
      count: 5,
      formation: FormationType.SQUARE,
      delay: 15000, // Reduced from 25000
      speedMultiplier: 1.1
    },
    // Reinforcements - mixed types
    {
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.RANDOM,
      delay: 15000 // Reduced from 25000
    },
    // Elite enemy introduction
    {
      enemyType: EnemyType.ELITE,
      count: 2,
      formation: FormationType.SINGLE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 0.9, // Slightly weaker as introduction
      speedMultiplier: 0.9
    },
    // Final wave - Outpost commander with guards
    {
      enemyType: EnemyType.ELITE,
      count: 4,
      formation: FormationType.V_FORMATION,
      delay: 18000, // Reduced from 30000
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    {
      time: 30000, // Reduced from 45000
      enemyType: EnemyType.TURRET,
      count: 2,
      formation: FormationType.SINGLE
    },
    {
      time: 60000, // Reduced from 90000
      enemyType: EnemyType.ADVANCED,
      count: 4,
      formation: FormationType.LINE
    },
    {
      time: 90000, // Reduced from 135000
      enemyType: EnemyType.STANDARD,
      count: 6,
      formation: FormationType.RANDOM
    }
  ],
  
  timedPickups: [
    {
      time: 30000, // Reduced from 40000
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 60000, // Reduced from 80000
      type: PickupType.POWER,
      count: 1
    },
    {
      time: 90000, // Reduced from 120000
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 120000, // Reduced from 160000
      type: PickupType.POWER,
      count: 1
    }
  ]
}; 