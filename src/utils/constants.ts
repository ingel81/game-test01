/**
 * Spielkonstanten
 * Zentrale Sammlung von Konstanten für das Spiel
 */
export class Constants {
  // Allgemeine Spielkonstanten
  public static readonly GAME_TITLE: string = 'Echoes from the Rift';
  public static readonly TOOLBAR_HEIGHT: number = 60;
  
  // Dynamische Werte für verschiedene Bildschirmgrößen
  public static getToolbarHeight(isMobile: boolean = false): number {
    return isMobile ? 50 : 60;
  }
  
  // Spieler
  public static readonly PLAYER_INITIAL_HEALTH: number = 100;
  public static readonly PLAYER_SPEED: number = 300;
  public static readonly PLAYER_SHOT_DELAY: number = 250;
  
  // Waffen
  public static readonly BULLET_SPEED: number = 500;
  public static readonly BULLET_DAMAGE: number = 25;
  public static readonly ENEMY_BULLET_SPEED: number = 300;
  public static readonly ENEMY_BULLET_DAMAGE: number = 10;
  public static readonly PLAYER_MAX_POWER_LEVEL: number = 7; // Maximales Power-Level für Spielerwaffe
  
  // Schaden und Heilung
  public static readonly DAMAGE = {
    ENEMY_COLLISION: 20,
    ENEMY_BULLET: 10
  };
  
  public static readonly HEAL = {
    ENERGY_PICKUP: 20
  };
  
  // Feinde
  public static readonly ENEMY_HEALTH: number = 30;
  public static readonly ENEMY_SPEED: number = 60;
  public static readonly ENEMY_SCORE: number = 100;
  
  // Bosse
  public static readonly BOSS_HEALTH: number = 200;
  public static readonly BOSS_SPEED: number = 30;
  public static readonly BOSS_SCORE: number = 1000;
  
  // Asteroiden
  public static readonly ASTEROID_HEALTH: number = 50;
  public static readonly ASTEROID_SPEED: number = 80;
  public static readonly ASTEROID_SCORE: number = 50;
  
  // Schwierigkeit
  public static readonly DIFFICULTY_INCREASE_INTERVAL: number = 20000; // 20 Sekunden
  public static readonly MAX_DIFFICULTY: number = 99;
  
  // Spawn-Raten (ms)
  public static readonly SPAWN_RATE_ENEMY: number = 2000;
  public static readonly SPAWN_RATE_BOSS: number = 2000;
  public static readonly SPAWN_RATE_ASTEROID: number = 5000;
  
  // Pickup-Werte
  public static readonly ENERGY_HEAL_AMOUNT: number = 20;
  public static readonly ENERGY_PICKUP_LIFETIME: number = 10000; // 10 Sekunden
  public static readonly ENERGY_PICKUP_SPAWN_CHANCE: number = 0.3; // 30% Chance bei regulärem Spawn
  public static readonly ENEMY_DROP_CHANCE: number = 0.1; // 10% Chance bei Zerstörung eines normalen Feindes 
  public static readonly BOSS_DROP_CHANCE: number = 0.5; // 50% Chance bei Zerstörung eines Bosses
  
  // Power-Pickup-Werte
  public static readonly POWER_PICKUP_LIFETIME: number = 10000; // 10 Sekunden
  public static readonly BOSS_POWER_DROP_CHANCE: number = 0.25; // 25% Chance bei Zerstörung eines Bosses
  
  // Szenenkeys
  public static readonly SCENE_MAIN_MENU: string = 'MainMenuScene';
  public static readonly SCENE_GAME: string = 'GameScene';
  public static readonly SCENE_GAME_OVER: string = 'GameOverScene';
  public static readonly SCENE_PAUSE: string = 'PauseScene';
  
  // Assettags
  public static readonly ASSET_PLAYER: string = 'player';
  public static readonly ASSET_BULLET: string = 'bullet';
  public static readonly ASSET_ENEMY: string = 'enemy';
  public static readonly ASSET_ENEMY_BULLET: string = 'enemyBullet';
  public static readonly ASSET_ASTEROID: string = 'asteroid';
  public static readonly ASSET_ASTEROID_SMALL: string = 'asteroid-small';
  public static readonly ASSET_BOSS: string = 'boss';
  public static readonly ASSET_EXPLOSION_1: string = 'explosion1';
  public static readonly ASSET_EXPLOSION_2: string = 'explosion2';
  public static readonly ASSET_EXPLOSION_3: string = 'explosion3';
  public static readonly ASSET_EXPLOSION_4: string = 'explosion4';
  public static readonly ASSET_EXPLOSION_5: string = 'explosion5';
  public static readonly ASSET_ENERGY_DROP: string = 'energyDrop';
  public static readonly ASSET_POWER_DROP: string = 'powerDrop';
  
  // Soundkeys
  public static readonly SOUND_SHOOT: string = 'shoot';
  public static readonly SOUND_ENEMY_SHOOT: string = 'enemyShoot';
  public static readonly SOUND_EXPLOSION: string = 'explosion';
  public static readonly SOUND_BACKGROUND: string = 'background';
} 