import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 9: Command and Control
 * A high-level challenge with multiple boss encounters and tactical battlefield control
 */
export const level9: LevelConfig = {
  id: 'level-9',
  name: 'Command and Control',
  description: 'Defeat the enemy command structure - multiple commanders coordinate their forces against you.',
  difficulty: 9,
  duration: 180000, // 3 minutes (reduced from 4 minutes)
  minAsteroids: 15,
  maxAsteroids: 30,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID,
  asteroidSpeedMultiplier: 1.1,
  music: 'music-level9',
  background: 'bg-battlestation',
  introText: 'We have located the enemy command center. Three battlefield commanders are coordinating attacks against our forces. Take them out one by one to dismantle their command structure.',
  outroText: 'Command structure eliminated! This is a decisive victory that will cripple enemy operations throughout this sector for months.',
  
  waves: [
    // Initial defense screen
    {
      enemyType: EnemyType.ADVANCED,
      count: 10,
      formation: FormationType.V_FORMATION,
      delay: 2000, // Reduced from 3000
      speedMultiplier: 1.3
    },
    // Turret defense grid
    {
      enemyType: EnemyType.TURRET,
      count: 12,
      formation: FormationType.SQUARE,
      delay: 10000, // Reduced from 15000
      healthMultiplier: 1.4
    },
    // Elite guardian force
    {
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.V_FORMATION,
      delay: 10000, // Reduced from 15000
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // First Commander (Tactical)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.4,
      speedMultiplier: 1.2
    },
    // Commander's Guard
    {
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.SQUARE,
      delay: 3000, // Reduced from 5000
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Second Commander (Defense)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.5,
      speedMultiplier: 1.1
    },
    // Commander's Support
    {
      enemyType: EnemyType.TURRET,
      count: 8,
      formation: FormationType.RANDOM,
      delay: 3000, // Reduced from 5000
      healthMultiplier: 1.5
    },
    // Final Commander (Fleet Admiral)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 1.6,
      speedMultiplier: 1.3,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Coordinated reinforcements
    {
      time: 25000, // Reduced from 30000
      enemyType: EnemyType.ADVANCED,
      count: 12,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.4
    },
    {
      time: 50000, // Reduced from 60000
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    {
      time: 75000, // Reduced from 90000
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.LINE,
      healthMultiplier: 1.4
    },
    {
      time: 100000, // Reduced from 120000
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.4
    },
    {
      time: 125000, // Reduced from 150000
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.4,
      speedMultiplier: 1.3
    },
    {
      time: 150000, // Reduced from 180000
      enemyType: EnemyType.TURRET,
      count: 12,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.5
    },
    {
      time: 165000, // Reduced from 210000
      enemyType: EnemyType.ELITE,
      count: 10,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.5,
      speedMultiplier: 1.4
    }
  ],
  
  timedPickups: [
    // Strategic resource distribution for multiple boss fights
    {
      time: 20000, // Reduced from 25000
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 35000, // Reduced from 45000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 50000, // Reduced from 65000
      type: PickupType.ENERGY,
      count: 4
    },
    // Before second boss
    {
      time: 65000, // Reduced from 85000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 80000, // Reduced from 105000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 95000, // Reduced from 125000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 110000, // Reduced from 145000
      type: PickupType.ENERGY,
      count: 5
    },
    // Before final boss
    {
      time: 125000, // Reduced from 165000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 140000, // Reduced from 185000
      type: PickupType.ENERGY,
      count: 5
    },
    {
      time: 155000, // Reduced from 205000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 170000, // Reduced from 225000
      type: PickupType.ENERGY,
      count: 5
    }
  ]
}; 