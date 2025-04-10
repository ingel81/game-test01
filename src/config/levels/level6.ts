import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 6: Asteroid Field Guardian
 * A challenging level with a powerful guardian boss and elite forces
 */
export const level6: LevelConfig = {
  id: 'level-6',
  name: 'Enemy Commander',
  description: 'Face off against an enemy commander and their elite forces.',
  minAsteroids: 35,
  maxAsteroids: 50,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.5, // Very fast asteroid spawn rate
  asteroidSpeedMultiplier: 1.5, // Very fast asteroids
  background: 'bg-commander',
  introText: 'An enemy commander has been spotted in this sector. They command a formidable force of elite units. This will be a challenging battle.',
  outroText: 'The enemy commander has been defeated! Their forces are in disarray.',
  
  waves: [
    // Initial ambush from multiple directions
    {
      enemyType: EnemyType.STANDARD,
      count: 15,
      formation: FormationType.RANDOM,
      delay: 1500,
      speedMultiplier: 1.4
    },
    // Advanced fighters in formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 8000,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Turrets hidden among asteroids
    {
      enemyType: EnemyType.TURRET,
      count: 12,
      formation: FormationType.RANDOM,
      delay: 10000,
      healthMultiplier: 1.4
    },
    // Elite strike team
    {
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.SQUARE,
      delay: 12000,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Asteroid field guardian
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 15000,
      healthMultiplier: 1.6,
      speedMultiplier: 1.2
    }
  ],
  
  timedSpawns: [
    // Continuous asteroid field patrols
    {
      time: 20000,
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.4
    },
    {
      time: 40000,
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.LINE,
      speedMultiplier: 1.3
    },
    {
      time: 60000,
      enemyType: EnemyType.TURRET,
      count: 6,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.3
    },
    {
      time: 80000,
      enemyType: EnemyType.ELITE,
      count: 5,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.3
    },
    {
      time: 100000,
      enemyType: EnemyType.STANDARD,
      count: 12,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.5
    },
    {
      time: 120000,
      enemyType: EnemyType.ADVANCED,
      count: 10,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.4
    }
  ],
  
  timedPickups: [
    // Strategic pickups - more needed due to intense combat
    {
      time: 20000,
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 40000,
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 60000,
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 80000,
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 100000,
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 120000,
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 140000,
      type: PickupType.ENERGY,
      count: 3
    }
  ]
}; 