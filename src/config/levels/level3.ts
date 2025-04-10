import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 3: Enemy Outpost
 * A level featuring enemy outpost defense systems and elite units
 */
export const level3: LevelConfig = {
  id: 'level-3',
  name: 'Enemy Outpost',
  description: 'Infiltrate an enemy outpost protected by advanced defense systems and elite guard units.',
  minAsteroids: 20,
  maxAsteroids: 35,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.8, // Even faster asteroid spawn rate
  asteroidSpeedMultiplier: 1.2, // Faster asteroids
  music: 'music-level3',
  background: 'bg-outpost',
  introText: 'We have detected an enemy outpost in this sector. It is heavily defended with advanced turrets and elite guard units. Proceed with caution.',
  outroText: 'Outpost neutralized! The enemy forces have been driven out of this sector.',
  
  waves: [
    // Patrol wave - standard enemies in V formation
    {
      enemyType: EnemyType.STANDARD,
      count: 9,
      formation: FormationType.V_FORMATION,
      delay: 1500,
      speedMultiplier: 1.1
    },
    // Outpost defense - turrets in line formation
    {
      enemyType: EnemyType.TURRET,
      count: 4,
      formation: FormationType.LINE,
      delay: 8000,
      healthMultiplier: 1.2
    },
    // Elite guard squad
    {
      enemyType: EnemyType.ADVANCED,
      count: 6,
      formation: FormationType.SQUARE,
      delay: 10000,
      speedMultiplier: 1.2,
      healthMultiplier: 1.1
    },
    // Reinforcements - mixed types
    {
      enemyType: EnemyType.STANDARD,
      count: 12,
      formation: FormationType.RANDOM,
      delay: 10000,
      speedMultiplier: 1.1
    },
    // Elite enemy introduction
    {
      enemyType: EnemyType.ELITE,
      count: 3,
      formation: FormationType.SINGLE,
      delay: 12000,
      healthMultiplier: 1.0,
      speedMultiplier: 1.0
    },
    // Final wave - advanced enemies in V formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.V_FORMATION,
      delay: 15000,
      healthMultiplier: 1.2,
      speedMultiplier: 1.2
    }
  ],
  
  timedSpawns: [
    {
      time: 25000,
      enemyType: EnemyType.TURRET,
      count: 3,
      formation: FormationType.SINGLE,
      healthMultiplier: 1.1
    },
    {
      time: 45000,
      enemyType: EnemyType.ADVANCED,
      count: 5,
      formation: FormationType.LINE,
      speedMultiplier: 1.2
    },
    {
      time: 75000,
      enemyType: EnemyType.STANDARD,
      count: 8,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.1
    }
  ],
  
  timedPickups: [
    {
      time: 20000,
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 45000,
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 70000,
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 100000,
      type: PickupType.POWER,
      count: 1
    }
  ]
}; 