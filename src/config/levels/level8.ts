import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 8: Overwhelming Force
 * A survival challenge with massive enemy numbers
 */
export const level8: LevelConfig = {
  id: 'level-8',
  name: 'Overwhelming Force',
  description: 'Survive against overwhelming enemy numbers in a desperate battle of attrition.',
  difficulty: 8,
  duration: 180000, // 3 minutes (reduced from 4 minutes)
  minAsteroids: 25,
  maxAsteroids: 40,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.9, // Slightly faster spawning
  asteroidSpeedMultiplier: 1.2,
  music: 'music-level8',
  background: 'bg-darkspace',
  introText: 'Our intelligence network has failed us. You have been ambushed by a massive enemy fleet. Your objective is survival - hold out until reinforcements arrive.',
  outroText: 'Impossible odds overcome! Your legendary stand against overwhelming force will be remembered in the annals of space warfare.',
  
  waves: [
    // Initial massive ambush
    {
      enemyType: EnemyType.STANDARD,
      count: 20,
      formation: FormationType.RANDOM,
      delay: 2000, // Reduced from 3000
      speedMultiplier: 1.3
    },
    // Heavy advanced formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 12,
      formation: FormationType.V_FORMATION,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.2,
      speedMultiplier: 1.2
    },
    // Defensive turret wall
    {
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.LINE,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.4
    },
    // Elite hunter-killer squadron
    {
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.SQUARE,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Flanking maneuver
    {
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.RANDOM,
      delay: 15000, // Reduced from 25000
      speedMultiplier: 1.4
    },
    // Enemy ace pilot
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 1.3,
      speedMultiplier: 1.2
    },
    // Last stand - elite force
    {
      enemyType: EnemyType.ELITE,
      count: 12,
      formation: FormationType.V_FORMATION,
      delay: 6000, // Reduced from 10000
      healthMultiplier: 1.3,
      speedMultiplier: 1.3,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Continual reinforcements from all sides
    {
      time: 25000, // Reduced from 30000
      enemyType: EnemyType.STANDARD,
      count: 15,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.3
    },
    {
      time: 50000, // Reduced from 60000
      enemyType: EnemyType.ADVANCED,
      count: 10,
      formation: FormationType.LINE,
      speedMultiplier: 1.3
    },
    {
      time: 75000, // Reduced from 90000
      enemyType: EnemyType.TURRET,
      count: 8,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.3
    },
    {
      time: 100000, // Reduced from 120000
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.3,
      speedMultiplier: 1.2
    },
    {
      time: 125000, // Reduced from 150000
      enemyType: EnemyType.STANDARD,
      count: 18,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.4
    },
    {
      time: 150000, // Reduced from 180000
      enemyType: EnemyType.ADVANCED,
      count: 12,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    {
      time: 165000, // Reduced from 210000
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.LINE,
      healthMultiplier: 1.4,
      speedMultiplier: 1.3
    }
  ],
  
  timedPickups: [
    // Frequent pickups to help with survival
    {
      time: 15000, // Reduced from 20000
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 30000, // Reduced from 40000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 45000, // Reduced from 60000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 60000, // Reduced from 80000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 75000, // Reduced from 100000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 90000, // Reduced from 120000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 105000, // Reduced from 140000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 120000, // Reduced from 160000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 135000, // Reduced from 180000
      type: PickupType.ENERGY,
      count: 5
    },
    {
      time: 150000, // Reduced from 200000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 165000, // Reduced from 220000
      type: PickupType.ENERGY,
      count: 4
    }
  ]
}; 