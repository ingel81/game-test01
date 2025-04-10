import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 10: Final Stand
 * The ultimate challenge against the enemy's most powerful forces
 */
export const level10: LevelConfig = {
  id: 'level-10',
  name: 'Final Stand',
  description: 'Face the enemy\'s ultimate weapon and their most elite forces in a battle for survival.',
  duration: 240000, // 4 minutes
  minAsteroids: 60,
  maxAsteroids: 75,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.15, // Extremely fast asteroid spawn rate
  asteroidSpeedMultiplier: 2.0, // Extremely fast asteroids
  background: 'bg-finalstand',
  introText: 'The enemy has deployed their ultimate weapon. This is the final battle that will determine the fate of our forces.',
  outroText: 'Victory! The enemy\'s ultimate weapon has been destroyed, and their forces are in retreat.',
  
  waves: [
    // Initial elite defense
    {
      enemyType: EnemyType.ELITE,
      count: 20,
      formation: FormationType.V_FORMATION,
      delay: 1000,
      healthMultiplier: 1.5,
      speedMultiplier: 1.5
    },
    // Advanced support
    {
      enemyType: EnemyType.ADVANCED,
      count: 25,
      formation: FormationType.SQUARE,
      delay: 5000,
      healthMultiplier: 1.4,
      speedMultiplier: 1.4
    },
    // Turret grid
    {
      enemyType: EnemyType.TURRET,
      count: 20,
      formation: FormationType.SQUARE,
      delay: 5000,
      healthMultiplier: 1.6
    },
    // Elite guardian force
    {
      enemyType: EnemyType.ELITE,
      count: 15,
      formation: FormationType.V_FORMATION,
      delay: 8000,
      healthMultiplier: 1.6,
      speedMultiplier: 1.6
    },
    // First phase of ultimate weapon
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 10000,
      healthMultiplier: 2.0,
      speedMultiplier: 1.5
    },
    // Elite reinforcements
    {
      enemyType: EnemyType.ELITE,
      count: 12,
      formation: FormationType.SQUARE,
      delay: 2000,
      healthMultiplier: 1.5,
      speedMultiplier: 1.5
    },
    // Second phase of ultimate weapon
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 12000,
      healthMultiplier: 2.2,
      speedMultiplier: 1.6
    },
    // Final phase of ultimate weapon
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 15000,
      healthMultiplier: 2.5,
      speedMultiplier: 1.7,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Continuous elite reinforcements
    {
      time: 20000,
      enemyType: EnemyType.ELITE,
      count: 15,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.5,
      speedMultiplier: 1.5
    },
    {
      time: 40000,
      enemyType: EnemyType.ADVANCED,
      count: 20,
      formation: FormationType.LINE,
      healthMultiplier: 1.4,
      speedMultiplier: 1.4
    },
    {
      time: 60000,
      enemyType: EnemyType.TURRET,
      count: 15,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.6
    },
    {
      time: 80000,
      enemyType: EnemyType.ELITE,
      count: 18,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.6,
      speedMultiplier: 1.6
    },
    {
      time: 100000,
      enemyType: EnemyType.ADVANCED,
      count: 25,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.5,
      speedMultiplier: 1.5
    },
    {
      time: 120000,
      enemyType: EnemyType.TURRET,
      count: 20,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.7
    },
    {
      time: 140000,
      enemyType: EnemyType.ELITE,
      count: 20,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.7,
      speedMultiplier: 1.7
    },
    {
      time: 160000,
      enemyType: EnemyType.ADVANCED,
      count: 30,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.6,
      speedMultiplier: 1.6
    },
    {
      time: 180000,
      enemyType: EnemyType.TURRET,
      count: 25,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.8
    },
    {
      time: 200000,
      enemyType: EnemyType.ELITE,
      count: 25,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.8,
      speedMultiplier: 1.8
    }
  ],
  
  timedPickups: [
    // Strategic pickups for the intense battle
    {
      time: 20000,
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 40000,
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 60000,
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 80000,
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 100000,
      type: PickupType.ENERGY,
      count: 5
    },
    {
      time: 120000,
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 140000,
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 160000,
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 180000,
      type: PickupType.ENERGY,
      count: 5
    },
    {
      time: 200000,
      type: PickupType.POWER,
      count: 4
    },
    {
      time: 220000,
      type: PickupType.ENERGY,
      count: 5
    }
  ]
}; 