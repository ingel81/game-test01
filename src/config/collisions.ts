/**
 * Kollisions-Konfigurationen
 * Zentrale Verwaltung von Kollisionseinstellungen für alle Entitäten im Spiel
 */

export class BulletTypes {
  public static readonly PLAYER = 'player';
  public static readonly ENEMY = 'enemy';
  public static readonly BOSS = 'boss';
  public static readonly TURRET = 'turret';
}

export class CollisionGroups {
  public static readonly PLAYER = 'player';
  public static readonly PLAYER_BULLET = 'playerBullet';
  public static readonly ENEMY = 'enemy';
  public static readonly ENEMY_BULLET = 'enemyBullet';
  public static readonly ASTEROID = 'asteroid';
  public static readonly PICKUP = 'pickup';
  public static readonly WALL = 'wall';
}

export interface CollisionConfig {
  bulletConfig: {
    [BulletTypes.PLAYER]: {
      damage: number;
      speed: number;
      texture: string;
    };
    [BulletTypes.ENEMY]: {
      damage: number;
      speed: number;
      texture: string;
    };
    [BulletTypes.BOSS]: {
      damage: number;
      speed: number;
      texture: string;
    };
    [BulletTypes.TURRET]: {
      damage: number;
      speed: number;
      texture: string;
    };
  };
}

/**
 * Standardkonfiguration für Kollisionen und Projektile
 */
export const DefaultCollisionConfig: CollisionConfig = {
  bulletConfig: {
    [BulletTypes.PLAYER]: {
      damage: 25,
      speed: 800,
      texture: 'bullet'
    },
    [BulletTypes.ENEMY]: {
      damage: 10,
      speed: 300,
      texture: 'enemyBullet'
    },
    [BulletTypes.BOSS]: {
      damage: 15,
      speed: 250,
      texture: 'enemyBullet'
    },
    [BulletTypes.TURRET]: {
      damage: 12,
      speed: 350,
      texture: 'enemyBullet'
    }
  }
}; 