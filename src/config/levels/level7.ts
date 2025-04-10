import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 7: Elite Command Fleet
 * A challenging level with multiple elite commanders and their forces
 */
export const level7: LevelConfig = {
  id: 'level-7',
  name: 'Elite Command Fleet',
  description: 'Face multiple elite commanders and their combined forces in a decisive battle.',
  minAsteroids: 40,
  maxAsteroids: 55,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.4, // Extremely fast asteroid spawn rate
  asteroidSpeedMultiplier: 1.6, // Extremely fast asteroids
  background: 'bg-elitefleet',
  introText: 'Multiple elite commanders have gathered their forces. This will be a battle of skill and strategy against overwhelming odds.',
  outroText: 'The elite command fleet has been defeated! Their combined forces are no match for your skill.',
  
  waves: [
    // Initial defense screen
    {
      enemyType: EnemyType.STANDARD,
      count: 20,
      formation: FormationType.V_FORMATION,
      delay: 1500,
      speedMultiplier: 1.4
    },
    // Advanced fighter squadron
    {
      enemyType: EnemyType.ADVANCED,
      count: 12,
      formation: FormationType.SQUARE,
      delay: 8000,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Elite guard force
    {
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.LINE,
      delay: 10000,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // First Commander (Tactical)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 12000,
      healthMultiplier: 1.4,
      speedMultiplier: 1.2
    },
    // Commander's Guard
    {
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.SQUARE,
      delay: 2000,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Second Commander (Defense)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 12000,
      healthMultiplier: 1.5,
      speedMultiplier: 1.1
    },
    // Commander's Support
    {
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.RANDOM,
      delay: 2000,
      healthMultiplier: 1.4
    },
    // Final Commander (Fleet Admiral)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 15000,
      healthMultiplier: 1.6,
      speedMultiplier: 1.3
    }
  ],
  
  timedSpawns: [
    // Continuous reinforcements
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
      healthMultiplier: 1.3
    },
    {
      time: 60000,
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.3
    },
    {
      time: 80000,
      enemyType: EnemyType.TURRET,
      count: 8,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.4
    },
    {
      time: 100000,
      enemyType: EnemyType.STANDARD,
      count: 15,
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
    // Strategic pickups for the intense battle
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