import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 7: Elite Squadron
 * A tactical challenge focused on elite enemy units and coordinated attacks
 */
export const level7: LevelConfig = {
  id: 'level-7',
  name: 'Elite Squadron',
  description: 'Face the enemy elite fighter squadron in a series of tactical engagements.',
  difficulty: 7,
  duration: 180000, // 3 minutes (reduced from 3.5 minutes)
  minAsteroids: 20,
  maxAsteroids: 35,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID,
  asteroidSpeedMultiplier: 1.2,
  music: 'music-level7',
  background: 'bg-nebula2',
  introText: 'Intelligence reports that the enemy has deployed their elite fighter squadron to this sector. These are their best pilots with advanced weaponry. Defeat them at all costs.',
  outroText: 'Outstanding performance! The elite squadron has been decimated. The enemy will think twice before challenging us again.',
  
  waves: [
    // Initial scout wave
    {
      enemyType: EnemyType.ADVANCED,
      count: 6,
      formation: FormationType.V_FORMATION,
      delay: 2000, // Reduced from 3000
      speedMultiplier: 1.3
    },
    // First elite strike team
    {
      enemyType: EnemyType.ELITE,
      count: 4,
      formation: FormationType.SQUARE,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.2,
      speedMultiplier: 1.3
    },
    // Support turrets
    {
      enemyType: EnemyType.TURRET,
      count: 8,
      formation: FormationType.LINE,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.4
    },
    // Heavy elite assault team
    {
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.V_FORMATION,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.3,
      speedMultiplier: 1.2
    },
    // Standard diversionary force
    {
      enemyType: EnemyType.STANDARD,
      count: 15,
      formation: FormationType.RANDOM,
      delay: 15000, // Reduced from 25000
      speedMultiplier: 1.4
    },
    // Elite squadron commander
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 1.2,
      speedMultiplier: 1.1
    },
    // Final elite guard
    {
      enemyType: EnemyType.ELITE,
      count: 10,
      formation: FormationType.SQUARE,
      delay: 6000, // Reduced from 10000
      healthMultiplier: 1.3,
      speedMultiplier: 1.2,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Continuous tactical reinforcements
    {
      time: 30000, // Reduced from 40000
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.LINE,
      speedMultiplier: 1.3
    },
    {
      time: 60000, // Reduced from 80000
      enemyType: EnemyType.ELITE,
      count: 3,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.2
    },
    {
      time: 90000, // Reduced from 120000
      enemyType: EnemyType.TURRET,
      count: 6,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.3
    },
    {
      time: 120000, // Reduced from 160000
      enemyType: EnemyType.ELITE,
      count: 5,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    }
  ],
  
  timedPickups: [
    // Critical resource management for extended combat
    {
      time: 25000, // Reduced from 30000
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 50000, // Reduced from 60000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 75000, // Reduced from 90000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 100000, // Reduced from 120000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 125000, // Reduced from 150000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 150000, // Reduced from 180000
      type: PickupType.POWER,
      count: 3
    }
  ]
}; 