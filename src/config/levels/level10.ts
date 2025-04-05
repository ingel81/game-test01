import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 10: Final Confrontation
 * The ultimate challenge - face the supreme enemy commander and their elite forces
 */
export const level10: LevelConfig = {
  id: 'level-10',
  name: 'Final Confrontation',
  description: 'Face the supreme commander of the enemy forces in the ultimate battle for galactic dominance.',
  difficulty: 10,
  duration: 180000, // 3 minutes (reduced from 4 minutes)
  minAsteroids: 30,
  maxAsteroids: 45,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.8, // Faster asteroid spawning
  asteroidSpeedMultiplier: 1.4, // Much faster asteroids
  music: 'music-finalboss',
  background: 'bg-commandship',
  introText: 'This is it. You have reached the enemy command ship where the supreme commander is orchestrating the invasion. Defeat them, and the enemy forces will crumble. The fate of the galaxy rests on this battle.',
  outroText: 'Victory! The supreme commander has been defeated and the invasion thwarted. Your name will go down in history as the hero who saved the galaxy from certain doom.',
  
  waves: [
    // Initial perimeter defense
    {
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.V_FORMATION,
      delay: 2000, // Reduced from 3000
      speedMultiplier: 1.4,
      healthMultiplier: 1.3
    },
    // Command ship defense turrets
    {
      enemyType: EnemyType.TURRET,
      count: 15,
      formation: FormationType.SQUARE,
      delay: 10000, // Reduced from 15000
      healthMultiplier: 1.5
    },
    // Elite guard - first wave
    {
      enemyType: EnemyType.ELITE,
      count: 10,
      formation: FormationType.LINE,
      delay: 10000, // Reduced from 15000
      healthMultiplier: 1.4,
      speedMultiplier: 1.3
    },
    // Elite guard - second wave
    {
      enemyType: EnemyType.ELITE,
      count: 12,
      formation: FormationType.V_FORMATION,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.5,
      speedMultiplier: 1.4
    },
    // Command ship lieutenants (mini-bosses)
    {
      enemyType: EnemyType.BOSS,
      count: 2,
      formation: FormationType.LINE,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.4,
      speedMultiplier: 1.2
    },
    // Final perimeter security
    {
      enemyType: EnemyType.TURRET,
      count: 20,
      formation: FormationType.RANDOM,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.6
    },
    // Personal guard of the Supreme Commander
    {
      enemyType: EnemyType.ELITE,
      count: 15,
      formation: FormationType.SQUARE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 1.6,
      speedMultiplier: 1.4
    },
    // Supreme Commander - Final Boss
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 2.0, // Double health
      speedMultiplier: 1.5, // Very fast
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Continuous reinforcements from the command ship
    {
      time: 25000, // Reduced from 30000
      enemyType: EnemyType.ADVANCED,
      count: 12,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.4,
      healthMultiplier: 1.3
    },
    {
      time: 50000, // Reduced from 60000
      enemyType: EnemyType.ELITE,
      count: 8,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.4,
      speedMultiplier: 1.3
    },
    {
      time: 75000, // Reduced from 90000
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.LINE,
      healthMultiplier: 1.5
    },
    {
      time: 100000, // Reduced from 120000
      enemyType: EnemyType.ADVANCED,
      count: 15,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.5,
      healthMultiplier: 1.4
    },
    {
      time: 125000, // Reduced from 150000
      enemyType: EnemyType.ELITE,
      count: 10,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.5,
      speedMultiplier: 1.4
    },
    // Last-ditch reinforcements
    {
      time: 150000, // Reduced from 180000
      enemyType: EnemyType.TURRET,
      count: 15,
      formation: FormationType.RANDOM,
      healthMultiplier: 1.6
    },
    {
      time: 165000, // Reduced from 210000
      enemyType: EnemyType.ELITE,
      count: 12,
      formation: FormationType.V_FORMATION,
      healthMultiplier: 1.6,
      speedMultiplier: 1.5
    }
  ],
  
  timedPickups: [
    // Critical resource management for the final battle
    {
      time: 15000, // Reduced from 20000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 30000, // Reduced from 40000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 45000, // Reduced from 60000
      type: PickupType.ENERGY,
      count: 4
    },
    {
      time: 60000, // Reduced from 80000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 75000, // Reduced from 100000
      type: PickupType.ENERGY,
      count: 5
    },
    {
      time: 90000, // Reduced from 120000
      type: PickupType.POWER,
      count: 3
    },
    {
      time: 105000, // Reduced from 140000
      type: PickupType.ENERGY,
      count: 5
    },
    {
      time: 120000, // Reduced from 160000
      type: PickupType.POWER,
      count: 4
    },
    // Final push resources
    {
      time: 135000, // Reduced from 180000
      type: PickupType.ENERGY,
      count: 6
    },
    {
      time: 150000, // Reduced from 200000
      type: PickupType.POWER,
      count: 4
    },
    {
      time: 165000, // Reduced from 220000
      type: PickupType.ENERGY,
      count: 6
    }
  ]
}; 