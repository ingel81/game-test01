import { LevelConfig, EnemyType, FormationType, PickupType } from './levelConfig';

/**
 * Standard-Level-1-Konfiguration
 */

export const debugLevel: LevelConfig = {
  id: 'level-1',
  name: 'First Encounters',
  description: 'The first enemies appear. Be careful and test your weapons.',
  duration: 5000,
  minAsteroids: 20,
  maxAsteroids: 20,
  asteroidSpawnRate: 500,  
  introText: 'Enemy ships have been spotted in this sector. Eliminate them to protect our territory.',
  outroText: 'Well done! The first wave has been repelled.',

  waves: [
/*     {
      startDelay: 0,
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.LINE,
      delay: 0,
      speedMultiplier: 1,
      healthMultiplier: 5,
      isLevelEndTrigger: true
    }, */
    {
      startDelay: 0,
      enemyType: EnemyType.TURRET,
      count: 10,
      formation: FormationType.LINE,
      delay: 0,
      speedMultiplier: 1,
      healthMultiplier: 1,
      isLevelEndTrigger: false
    },
    {
      startDelay: 0,
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.SQUARE,
      delay: 0,
      speedMultiplier: 1,
      healthMultiplier: 1,
      isLevelEndTrigger: false
    }
  ],

  timedPickups: [
    {
      time: 1000,
      type: PickupType.ENERGY,
      count: 1
    },
    {
      time: 1000,
      type: PickupType.POWER,
      count: 1
    }
  ]
};
