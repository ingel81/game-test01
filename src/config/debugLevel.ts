import { LevelConfig, EnemyType, FormationType, PickupType } from './levelConfig';

/**
 * Standard-Level-1-Konfiguration
 */

export const debugLevel: LevelConfig = {
  id: 'level-1',
  name: 'First Encounters',
  description: 'The first enemies appear. Be careful and test your weapons.',
  difficulty: 3,
  duration: 20000,
  minAsteroids: 20,
  maxAsteroids: 20,
  asteroidSpawnRate: 500,  
  introText: 'Enemy ships have been spotted in this sector. Eliminate them to protect our territory.',
  outroText: 'Well done! The first wave has been repelled.',

  waves: [
    {
      startDelay: 0,
      enemyType: EnemyType.STANDARD,
      count: 10,
      formation: FormationType.LINE,
      delay: 0,
      speedMultiplier: 10,
      isLevelEndTrigger: true
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
