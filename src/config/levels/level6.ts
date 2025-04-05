import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 6: Asteroid Storm
 * A high-intensity level with dense asteroid fields and aggressive enemy formations
 */
export const level6: LevelConfig = {
  id: 'level-6',
  name: 'Asteroid Storm',
  description: 'Navigate through a massive asteroid storm while repelling coordinated enemy assaults.',
  difficulty: 6,
  duration: 180000, // 3 minutes (reduced from 4 minutes)
  minAsteroids: 40,
  maxAsteroids: 60,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.7, // Much faster asteroid spawning
  asteroidSpeedMultiplier: 1.3, // Faster asteroids
  music: 'music-level6',
  background: 'bg-deepspace',
  introText: 'You are entering a severe asteroid storm. The enemy is using this natural hazard to launch ambush attacks. Maintain focus and navigate carefully.',
  outroText: 'Outstanding piloting! You have survived the asteroid storm and eliminated all enemy threats.',
  
  waves: [
    // Initial ambush from multiple directions
    {
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.RANDOM,
      delay: 2000, // Reduced from 3000
      speedMultiplier: 1.3
    },
    // Advanced fighters in formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.V_FORMATION,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.2,
      speedMultiplier: 1.2
    },
    // Turrets hidden among asteroids
    {
      enemyType: EnemyType.TURRET,
      count: 8,
      formation: FormationType.RANDOM,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.3
    },
    // Elite strike team
    {
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.SQUARE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 1.2,
      speedMultiplier: 1.2
    },
    // Asteroid field guardian
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 20000, // Reduced from 35000
      healthMultiplier: 1.0,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Continuous asteroid field patrols
    {
      time: 25000, // Reduced from 30000
      enemyType: EnemyType.STANDARD,
      count: 8,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.3
    },
    {
      time: 50000, // Reduced from 60000
      enemyType: EnemyType.ADVANCED,
      count: 6,
      formation: FormationType.LINE,
      speedMultiplier: 1.2
    },
    {
      time: 75000, // Reduced from 90000
      enemyType: EnemyType.TURRET,
      count: 5,
      formation: FormationType.RANDOM
    },
    {
      time: 100000, // Reduced from 120000
      enemyType: EnemyType.ELITE,
      count: 4,
      formation: FormationType.V_FORMATION
    },
    {
      time: 125000, // Reduced from 150000
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.4
    },
    {
      time: 150000, // Reduced from 180000
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.3
    }
  ],
  
  timedPickups: [
    // Strategic pickups - more needed due to intense combat
    {
      time: 25000, // Reduced from 30000
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 50000, // Reduced from 60000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 75000, // Reduced from 90000
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 100000, // Reduced from 120000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 125000, // Reduced from 150000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 150000, // Reduced from 180000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 165000, // Reduced from 210000
      type: PickupType.ENERGY,
      count: 3
    }
  ]
}; 