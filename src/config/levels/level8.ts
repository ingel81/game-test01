import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 8: Enemy Ace Pilot
 * A challenging level featuring an enemy ace pilot and their elite squadron
 */
export const level8: LevelConfig = {
  id: 'level-8',
  name: 'Enemy Ace Pilot',
  description: 'Face the legendary enemy ace pilot and their elite squadron in an epic battle.',
  duration: 180000, // 3 minutes
  minAsteroids: 45,
  maxAsteroids: 60,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.3, // Extremely fast asteroid spawn rate
  asteroidSpeedMultiplier: 1.7, // Extremely fast asteroids
  background: 'bg-acepilot',
  introText: 'The legendary enemy ace pilot has been spotted in this sector. They command an elite squadron of the most skilled pilots. This will be a battle for the ages.',
  outroText: 'The legendary ace pilot has been defeated! Their elite squadron is in disarray. This victory will be remembered throughout the galaxy.',
  
  waves: [
    // Initial massive ambush
    {
      enemyType: EnemyType.STANDARD,
      count: 25,
      formation: FormationType.RANDOM,
      delay: 1500,
      speedMultiplier: 1.5
    },
    // Heavy advanced formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.V_FORMATION,
      delay: 8000,
      healthMultiplier: 1.3,
      speedMultiplier: 1.3
    },
    // Defensive turret wall
    {
      enemyType: EnemyType.TURRET,
      count: 12,
      formation: FormationType.LINE,
      delay: 8000,
      healthMultiplier: 1.5
    },
    // Elite hunter-killer squadron
    {
      enemyType: EnemyType.ELITE,
      count: 10,
      formation: FormationType.SQUARE,
      delay: 10000,
      healthMultiplier: 1.4,
      speedMultiplier: 1.4
    },
    // Flanking maneuver
    {
      enemyType: EnemyType.ADVANCED,
      count: 18,
      formation: FormationType.RANDOM,
      delay: 10000,
      speedMultiplier: 1.5
    },
    // Enemy ace pilot
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 12000,
      healthMultiplier: 1.4,
      speedMultiplier: 1.3
    },
    // Last stand - elite force
    {
      enemyType: EnemyType.ELITE,
      count: 15,
      formation: FormationType.V_FORMATION,
      delay: 4000,
      healthMultiplier: 1.4,
      speedMultiplier: 1.4,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Continuous reinforcements
    {
      time: 20000,
      enemyType: EnemyType.STANDARD,
      count: 12,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.5
    },
    {
      time: 40000,
      enemyType: EnemyType.ADVANCED,
      count: 10,
      formation: FormationType.LINE,
      healthMultiplier: 1.3
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
      count: 12,
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