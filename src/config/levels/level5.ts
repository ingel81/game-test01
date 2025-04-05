import { EnemyType, FormationType, LevelConfig, PickupType } from '../levelConfig';
import { Constants } from '../../utils/constants';

/**
 * Level 5: Fleet Commander
 * The first boss encounter, featuring a fleet commander with support units
 */
export const level5: LevelConfig = {
  id: 'level-5',
  name: 'Fleet Commander',
  description: 'Face your first major enemy commander and defeat their elite fighter squadron.',
  difficulty: 5,
  duration: 150000, // 2.5 minutes (reduced from 3 minutes)
  minAsteroids: 15,
  maxAsteroids: 25,
  asteroidSpawnRate: Constants.SPAWN_RATE_ASTEROID,
  asteroidSpeedMultiplier: 1.0,
  music: 'music-boss1',
  background: 'bg-redspace',
  introText: 'We have tracked down the commander of the enemy fleet. Eliminating this high-value target will significantly weaken their operations in this sector. Prepare for heavy resistance.',
  outroText: 'Commander eliminated! This is a significant victory for our forces. The enemy will be in disarray without their leadership.',
  
  waves: [
    // Guardian patrol
    {
      enemyType: EnemyType.ADVANCED,
      count: 8,
      formation: FormationType.V_FORMATION,
      delay: 3000, // Reduced from 5000
      speedMultiplier: 1.2
    },
    // Elite squadron - commander's personal guard
    {
      enemyType: EnemyType.ELITE,
      count: 6,
      formation: FormationType.SQUARE,
      delay: 12000, // Reduced from 20000
      healthMultiplier: 1.2,
      speedMultiplier: 1.1
    },
    // Defense turrets
    {
      enemyType: EnemyType.TURRET,
      count: 6,
      formation: FormationType.LINE,
      delay: 15000, // Reduced from 25000
      healthMultiplier: 1.2
    },
    // Final wave - The Commander (Boss)
    {
      enemyType: EnemyType.BOSS,
      count: 1,
      formation: FormationType.SINGLE,
      delay: 18000, // Reduced from 30000
      healthMultiplier: 0.9, // First boss, slightly easier
      isLevelEndTrigger: true
    }
  ],
  
  timedSpawns: [
    // Continuous reinforcements
    {
      time: 20000, // Reduced from 30000
      enemyType: EnemyType.STANDARD,
      count: 6,
      formation: FormationType.RANDOM
    },
    {
      time: 45000, // Reduced from 60000
      enemyType: EnemyType.ADVANCED,
      count: 4,
      formation: FormationType.LINE
    },
    {
      time: 70000, // Reduced from 90000
      enemyType: EnemyType.ELITE,
      count: 2,
      formation: FormationType.SINGLE
    },
    // Emergency defense when boss appears
    {
      time: 95000, // Reduced from 120000
      enemyType: EnemyType.TURRET,
      count: 4,
      formation: FormationType.SQUARE
    }
  ],
  
  timedPickups: [
    // Strategic pickups to help with boss fight
    {
      time: 18000, // Reduced from 25000
      type: PickupType.ENERGY,
      count: 2
    },
    {
      time: 50000, // Reduced from 70000
      type: PickupType.POWER,
      count: 2
    },
    {
      time: 85000, // Reduced from 115000
      type: PickupType.ENERGY,
      count: 3
    },
    // Final power boost before boss
    {
      time: 115000, // Reduced from 145000
      type: PickupType.POWER,
      count: 2
    }
  ]
}; 