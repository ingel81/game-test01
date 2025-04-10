import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 4: Elite Defense
 * A challenging level with elite enemies and advanced defense systems
 */
export const level4: LevelConfig = {
  id: 'level-4',
  name: 'Elite Defense',
  description: 'Face off against elite enemy forces and their advanced defense systems.',
  duration: 180000, // 3 minutes
  minAsteroids: 25,
  maxAsteroids: 40,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID * 0.7, // Even faster asteroid spawn rate
  asteroidSpeedMultiplier: 1.3, // Much faster asteroids
  background: 'bg-elite',
  introText: 'Elite enemy forces have established a stronghold in this sector. Their advanced defense systems and elite units make this a formidable challenge.',
  outroText: 'The elite defense has been breached! The enemy forces are retreating.',
  
  waves: [
    // Outer defense - turrets in square formation
    {
      enemyType: EnemyType.TURRET,
      count: 6,
      formation: FormationType.SQUARE,
      delay: 1500,
      healthMultiplier: 1.2
    },
    // First elite guard patrol
    {
      enemyType: EnemyType.ELITE,
      count: 4,
      formation: FormationType.V_FORMATION,
      delay: 8000,
      speedMultiplier: 1.2,
      healthMultiplier: 1.1
    },
    // Standard reinforcements
    {
      enemyType: EnemyType.STANDARD,
      count: 15,
      formation: FormationType.RANDOM,
      delay: 8000,
      speedMultiplier: 1.3
    },
    // Inner defense - advanced turrets
    {
      enemyType: EnemyType.TURRET,
      count: 8,
      formation: FormationType.LINE,
      delay: 10000,
      healthMultiplier: 1.3
    },
    // Advanced units in tactical formation
    {
      enemyType: EnemyType.ADVANCED,
      count: 10,
      formation: FormationType.SQUARE,
      delay: 10000,
      speedMultiplier: 1.2,
      healthMultiplier: 1.1
    },
    // Elite commander squad
    {
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.V_FORMATION,
      delay: 12000,
      healthMultiplier: 1.2,
      speedMultiplier: 1.2,
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    {
      time: 20000,
      enemyType: EnemyType.TURRET,
      count: 4,
      formation: FormationType.LINE,
      healthMultiplier: 1.2
    },
    {
      time: 45000,
      enemyType: EnemyType.ELITE,
      count: 3,
      formation: FormationType.SINGLE,
      healthMultiplier: 1.2,
      speedMultiplier: 1.1
    },
    {
      time: 90000,
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.RANDOM,
      speedMultiplier: 1.3
    },
    {
      time: 120000,
      enemyType: EnemyType.TURRET,
      count: 5,
      formation: FormationType.SQUARE,
      healthMultiplier: 1.3
    }
  ],
  
  timedPickups: [
    {
      time: 20000,
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 45000,
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 80000,
      type: PickupType.ENERGY,
      count: 3
    },
    {
      time: 120000,
      type: PickupType.POWER,
      count: 2
    }
  ]
}; 