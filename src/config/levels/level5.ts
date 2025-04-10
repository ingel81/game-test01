import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 5: Command Center
 * A challenging level with a boss encounter and elite forces
 */
export const level5: LevelConfig = {
  id: 'level-5',
  name: 'Command Center',
  description: 'Infiltrate an enemy command center protected by elite forces and a powerful commander.',
  minAsteroids: 30,
  maxAsteroids: 45,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.6, // Very fast asteroid spawn rate
  asteroidSpeedMultiplier: 1.4, // Very fast asteroids
  background: 'bg-command',
  introText: 'We have located an enemy command center. It is heavily defended by elite forces and commanded by a powerful leader. This is a critical target.',
  outroText: 'The command center has been neutralized! The enemy leadership has been dealt a significant blow.',
  
  waves: [
    // Initial perimeter defense
    {
      enemyType: EnemyType.STANDARD,
      count: 12,
      formation: FormationType.V_FORMATION,
      delay: 1500,
      speedMultiplier: 1.2
    },
    // Advanced guard units
    {
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.SQUARE,
      delay: 8000,
      healthMultiplier: 1.2,
      speedMultiplier: 1.2
    },
    // Elite patrol squad
    {
      enemyType: EnemyType.ELITE,
      count: 4,
      formation: FormationType.LINE,
      delay: 10000,
      healthMultiplier: 1.2,
      speedMultiplier: 1.2
    },
    // Command center turrets
    {
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.RANDOM,
      delay: 10000,
      healthMultiplier: 1.3
    },
    // Commander's personal guard
    {
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.V_FORMATION,
      delay: 12000,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Final boss - Command Center Commander
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 12000,
      healthMultiplier: 1.5,
      speedMultiplier: 1.2
    }
  ],
  
  timedSpawns: [
    // Continuous reinforcements
    {
      time: 15000,
      enemyType: EnemyType.STANDARD,
      count: 8,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.2
    },
    {
      time: 35000,
      enemyType: EnemyType.ADVANCED,
      count: 6,
      formation: FormationType.LINE,
      healthMultiplier: 1.2
    },
    {
      time: 55000,
      enemyType: EnemyType.ELITE,
      count: 3,
      formation: FormationType.SINGLE,
      healthMultiplier: 1.2,
      speedMultiplier: 1.2
    },
    // Emergency defense when boss appears
    {
      time: 75000,
      enemyType: EnemyType.TURRET,
      count: 6,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.3
    }
  ],
  
  timedPickups: [
    // Strategic pickups to help with boss fight
    {
      time: 15000,
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 35000,
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 65000,
      type: PickupType.ENERGY,
      count: 3
    },
    // Final power boost before boss
    {
      time: 85000,
      type: PickupType.POWER,
      count: 2
    }
  ]
}; 