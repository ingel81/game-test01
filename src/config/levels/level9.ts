import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 9: Command Fleet
 * A challenging level with multiple commanders and their elite forces
 */
export const level9: LevelConfig = {
  id: 'level-9',
  name: 'Command Fleet',
  description: 'Face multiple enemy commanders and their combined elite forces in a decisive battle.',
  minAsteroids: 50,
  maxAsteroids: 65,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.2, // Extremely fast asteroid spawn rate
  asteroidSpeedMultiplier: 1.8, // Extremely fast asteroids
  background: 'bg-commandfleet',
  introText: 'Multiple enemy commanders have gathered their elite forces. This will be a battle of skill and strategy against overwhelming odds.',
  outroText: 'The command fleet has been defeated! Their combined forces are no match for your skill.',
  
  waves: [
    // Initial defense screen
    {
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.V_FORMATION,
      delay: 1500,
      speedMultiplier: 1.5
    },
    // Turret defense grid
    {
      enemyType: EnemyType.TURRET,
      count: 15,
      formation: FormationType.SQUARE,
      delay: 8000,
      healthMultiplier: 1.5
    },
    // Elite guardian force
    {
      enemyType: EnemyType.ELITE,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 8000,
      healthMultiplier: 1.4,
      speedMultiplier: 1.4
    },
    // First Commander (Tactical)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 10000,
      healthMultiplier: 1.5,
      speedMultiplier: 1.3
    },
    // Commander's Guard
    {
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.SQUARE,
      delay: 2000,
      healthMultiplier: 1.4,
      speedMultiplier: 1.4
    },
    // Second Commander (Defense)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 12000,
      healthMultiplier: 1.6,
      speedMultiplier: 1.2
    },
    // Commander's Support
    {
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.RANDOM,
      delay: 2000,
      healthMultiplier: 1.5
    },
    // Final Commander (Fleet Admiral)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 15000,
      healthMultiplier: 1.7,
      speedMultiplier: 1.4
    }
  ],
  
  timedSpawns: [
    // Continuous reinforcements
    {
      time: 20000,
      enemyType: EnemyType.STANDARD,
      count: 15,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.5
    },
    {
      time: 40000,
      enemyType: EnemyType.ADVANCED,
      count: 12,
      formation: FormationType.LINE,
      healthMultiplier: 1.4
    },
    {
      time: 60000,
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.4
    },
    {
      time: 80000,
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.5
    },
    {
      time: 100000,
      enemyType: EnemyType.STANDARD,
      count: 20,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.6
    },
    {
      time: 120000,
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.5
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