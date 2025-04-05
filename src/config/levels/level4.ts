import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 4: Defense Network
 * A level focused on turrets and defensive structures
 */
export const level4: LevelConfig = {
  id: 'level-4',
  name: 'Defense Network',
  description: 'Breach an enemy defense network consisting of automated turrets and elite guard units.',
  difficulty: 4,
  duration: 180000, // 3 minutes (reduced from 3.5 minutes)
  minAsteroids: 10,
  maxAsteroids: 25,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 1.1,
  asteroidSpeedMultiplier: 1.2,
  music: 'music-level4',
  background: 'bg-spacestation',
  introText: 'Our intelligence has located a critical enemy defense network. The area is heavily guarded by automated turrets and elite units. Penetrate their defenses and disable the network.',
  outroText: 'Defense network neutralized! This will create a significant gap in the enemy defense grid that our fleet can exploit.',
  
  waves: [
    // Outer defense - turrets in square formation
    {
      enemyType: EnemyType.TURRET,
      count: 4,
      formation: FormationType.SQUARE,
      delay: 2000, // Reduced from 3000
      healthMultiplier: 1.1
    },
    // First elite guard patrol
    {
      enemyType: EnemyType.ELITE,
      count: 3,
      formation: FormationType.V_FORMATION,
      delay: 12000, // Reduced from 20000
      speedMultiplier: 1.1
    },
    // Standard reinforcements
    {
      enemyType: EnemyType.STANDARD,
      count: 12,
      formation: FormationType.RANDOM,
      delay: 12000, // Reduced from 20000
      speedMultiplier: 1.2
    },
    // Inner defense - advanced turrets
    {
      enemyType: EnemyType.TURRET,
      count: 6,
      formation: FormationType.LINE,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.2
    },
    // Advanced units in tactical formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.SQUARE,
      delay: 15000, // Reduced from 25000
    },
    // Elite commander squad
    {
      enemyType: EnemyType.ELITE,
      count: 5,
      formation: FormationType.V_FORMATION,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 1.1,
      speedMultiplier: 1.1,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    {
      time: 30000, // Reduced from 40000
      enemyType: EnemyType.TURRET,
      count: 3,
      formation: FormationType.LINE
    },
    {
      time: 70000, // Reduced from 90000
      enemyType: EnemyType.ELITE,
      count: 2,
      formation: FormationType.SINGLE,
      healthMultiplier: 1.1
    },
    {
      time: 120000, // Reduced from 150000
      enemyType: EnemyType.ADVANCED,
      count: 6,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.2
    },
    {
      time: 150000, // Reduced from 180000
      enemyType: EnemyType.TURRET,
      count: 4,
      formation: FormationType.SQUARE
    }
  ],
  
  timedPickups: [
    {
      time: 25000, // Reduced from 30000
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 60000, // Reduced from 75000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 100000, // Reduced from 120000
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 140000, // Reduced from 165000
      type: PickupType.POWER,
      count: 1
    }
  ]
}; 