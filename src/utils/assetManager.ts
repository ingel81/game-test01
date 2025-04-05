/**
 * Asset-Manager Klasse für zentrale Verwaltung aller Spiel-Assets
 * Vereint sowohl die Definitionen als auch die Lade- und Zugriffsfunktionen
 */

import { Scene } from 'phaser';

/**
 * Unterstützte Asset-Typen
 */
export enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  SPRITESHEET = 'spritesheet',
  ANIMATION = 'animation'
}

/**
 * Asset-Kategorien für gruppiertes Laden
 */
export enum AssetCategory {
  PLAYER = 'player',
  ENEMY = 'enemy',
  BULLET = 'bullet',
  EXPLOSION = 'explosion',
  UI = 'ui',
  BACKGROUND = 'background',
  SOUND = 'sound',
  MUSIC = 'music',
  PICKUP = 'pickup',
  ASTEROID = 'asteroid',
  PLANET = 'planet'
}

/**
 * Alle verfügbaren Asset-Keys
 */
export enum AssetKey {
  // Player Assets
  PLAYER = 'player',
  PLAYER_UP = 'player-up',
  PLAYER_DOWN = 'player-down',
  
  // Enemy Assets
  ENEMY01 = 'enemy01',
  ENEMY02 = 'enemy02',
  ENEMY03 = 'enemy03',
  BOSS01 = 'boss01',
  TURRET_BASE = 'turret01_base',
  TURRET_TOP = 'turret01_top',
  
  // Bullet Assets
  BULLET = 'bullet',
  ENEMY_BULLET = 'enemyBullet',
  
  // Explosion Assets
  EXPLOSION1 = 'explosion1',
  EXPLOSION2 = 'explosion2',
  EXPLOSION3 = 'explosion3',
  EXPLOSION4 = 'explosion4',
  EXPLOSION5 = 'explosion5',
  
  // Pickup Assets
  ENERGY_DROP = 'energyDrop',
  POWER_DROP = 'powerDrop',
  
  // Background Assets
  BACKGROUND = 'background',
  BG_PLANET = 'bg-planet',
  
  // Asteroid Assets
  ASTEROID = 'asteroid',
  ASTEROID_SMALL = 'asteroid-small',
  
  // UI Assets
  LOGO = 'logo',
  
  // Sound Assets
  SOUND_CLICK = 'click',
  SOUND_SHOOT = 'shoot',
  SOUND_ENEMY_SHOOT = 'enemyShoot',
  SOUND_EXPLOSION = 'explosion',
  
  // Music Assets
  MUSIC_TITLE = 'title',
  MUSIC_BACKGROUND = 'music-background',
  MUSIC_00 = '00',
  MUSIC_01 = '01',
  MUSIC_02 = '02',
  
  // Planets (1-16)
  PLANET_1 = 'planet-1',
  PLANET_2 = 'planet-2',
  PLANET_3 = 'planet-3',
  PLANET_4 = 'planet-4',
  PLANET_5 = 'planet-5',
  PLANET_6 = 'planet-6',
  PLANET_7 = 'planet-7',
  PLANET_8 = 'planet-8',
  PLANET_9 = 'planet-9',
  PLANET_10 = 'planet-10',
  PLANET_11 = 'planet-11',
  PLANET_12 = 'planet-12',
  PLANET_13 = 'planet-13',
  PLANET_14 = 'planet-14',
  PLANET_15 = 'planet-15',
  PLANET_16 = 'planet-16'
}

/**
 * Definition für Animation
 */
export interface AnimationDefinition {
  key: string;
  frames: AssetKey[];
  frameRate: number;
  repeat: number;
}

/**
 * Asset-Definition-Interface
 */
export interface AssetDefinition {
  key: string;               // Der Phaser-Key für das Asset
  path: string;              // Der Dateipfad
  type: AssetType;           // Der Asset-Typ
  config?: any;              // Zusätzliche Konfiguration
  categories: AssetCategory[]; // Kategorien für gruppiertes Laden
}

/**
 * Zentraler Asset-Manager für das Spiel
 */
export class AssetManager {
  // Private Singleton-Instanz
  private static instance: AssetManager;
  
  // Liste aller verfügbaren Assets
  private static readonly assets: Record<AssetKey, AssetDefinition> = {
    // Spieler-Assets
    [AssetKey.PLAYER]: {
      key: 'player',
      path: 'player/sprites/player.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLAYER]
    },
    [AssetKey.PLAYER_UP]: {
      key: 'player-up',
      path: 'player/sprites/player_up.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLAYER]
    },
    [AssetKey.PLAYER_DOWN]: {
      key: 'player-down',
      path: 'player/sprites/player_down.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLAYER]
    },
    
    // Gegner-Assets
    [AssetKey.ENEMY01]: {
      key: 'enemy01',
      path: 'enemy/sprites/enemy01.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ENEMY]
    },
    [AssetKey.ENEMY02]: {
      key: 'enemy02',
      path: 'enemy/sprites/enemy02.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ENEMY]
    },
    [AssetKey.ENEMY03]: {
      key: 'enemy03',
      path: 'enemy/sprites/enemy03.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ENEMY]
    },
    [AssetKey.BOSS01]: {
      key: 'boss01',
      path: 'enemy/sprites/boss01.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ENEMY]
    },
    [AssetKey.TURRET_BASE]: {
      key: 'turret01_base',
      path: 'enemy/sprites/turret01_base.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ENEMY]
    },
    [AssetKey.TURRET_TOP]: {
      key: 'turret01_top',
      path: 'enemy/sprites/turret01_top.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ENEMY]
    },
    
    // Projektil-Assets
    [AssetKey.BULLET]: {
      key: 'bullet',
      path: 'shoot/shoot1.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.BULLET]
    },
    [AssetKey.ENEMY_BULLET]: {
      key: 'enemyBullet',
      path: 'shoot/shoot2.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.BULLET]
    },
    
    // Explosions-Assets
    [AssetKey.EXPLOSION1]: {
      key: 'explosion1',
      path: 'explosion/sprites/explosion1.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.EXPLOSION]
    },
    [AssetKey.EXPLOSION2]: {
      key: 'explosion2',
      path: 'explosion/sprites/explosion2.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.EXPLOSION]
    },
    [AssetKey.EXPLOSION3]: {
      key: 'explosion3',
      path: 'explosion/sprites/explosion3.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.EXPLOSION]
    },
    [AssetKey.EXPLOSION4]: {
      key: 'explosion4',
      path: 'explosion/sprites/explosion4.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.EXPLOSION]
    },
    [AssetKey.EXPLOSION5]: {
      key: 'explosion5',
      path: 'explosion/sprites/explosion5.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.EXPLOSION]
    },
    
    // Pickup-Assets
    [AssetKey.ENERGY_DROP]: {
      key: 'energyDrop',
      path: 'pickups/energy.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PICKUP]
    },
    [AssetKey.POWER_DROP]: {
      key: 'powerDrop',
      path: 'pickups/power.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PICKUP]
    },
    
    // Hintergrund-Assets
    [AssetKey.BACKGROUND]: {
      key: 'background',
      path: 'background/bg-preview-big.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.BACKGROUND]
    },
    [AssetKey.BG_PLANET]: {
      key: 'bg-planet',
      path: 'background/layered/bg-planet.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.BACKGROUND]
    },
    
    // Asteroiden-Assets
    [AssetKey.ASTEROID]: {
      key: 'asteroid',
      path: 'asteroids/asteroid.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ASTEROID]
    },
    [AssetKey.ASTEROID_SMALL]: {
      key: 'asteroid-small',
      path: 'asteroids/asteroid-small.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.ASTEROID]
    },
    
    // UI-Assets
    [AssetKey.LOGO]: {
      key: 'logo',
      path: 'logo/title4.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.UI]
    },
    
    // Sound-Assets
    [AssetKey.SOUND_CLICK]: {
      key: 'click',
      path: 'sounds/laser1.wav',
      type: AssetType.AUDIO,
      categories: [AssetCategory.SOUND]
    },
    [AssetKey.SOUND_SHOOT]: {
      key: 'shoot',
      path: 'sounds/shot 1.wav',
      type: AssetType.AUDIO,
      categories: [AssetCategory.SOUND]
    },
    [AssetKey.SOUND_ENEMY_SHOOT]: {
      key: 'enemyShoot',
      path: 'sounds/shot 2.wav',
      type: AssetType.AUDIO,
      categories: [AssetCategory.SOUND]
    },
    [AssetKey.SOUND_EXPLOSION]: {
      key: 'explosion',
      path: 'sounds/explosion.wav',
      type: AssetType.AUDIO,
      categories: [AssetCategory.SOUND]
    },
    
    // Musik-Assets
    [AssetKey.MUSIC_TITLE]: {
      key: 'title',
      path: 'music/title.mp3',
      type: AssetType.AUDIO,
      categories: [AssetCategory.MUSIC]
    },
    [AssetKey.MUSIC_BACKGROUND]: {
      key: 'background',
      path: 'music/01.mp3',
      type: AssetType.AUDIO,
      categories: [AssetCategory.MUSIC]
    },
    [AssetKey.MUSIC_00]: {
      key: '00',
      path: 'music/00.mp3',
      type: AssetType.AUDIO,
      categories: [AssetCategory.MUSIC]
    },
    [AssetKey.MUSIC_01]: {
      key: '01',
      path: 'music/01.mp3',
      type: AssetType.AUDIO,
      categories: [AssetCategory.MUSIC]
    },
    [AssetKey.MUSIC_02]: {
      key: '02',
      path: 'music/02.mp3',
      type: AssetType.AUDIO,
      categories: [AssetCategory.MUSIC]
    },
    
    // Planeten-Assets (1-16)
    [AssetKey.PLANET_1]: {
      key: 'planet-1',
      path: 'planets/planet-1.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_2]: {
      key: 'planet-2',
      path: 'planets/planet-2.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_3]: {
      key: 'planet-3',
      path: 'planets/planet-3.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_4]: {
      key: 'planet-4',
      path: 'planets/planet-4.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_5]: {
      key: 'planet-5',
      path: 'planets/planet-5.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_6]: {
      key: 'planet-6',
      path: 'planets/planet-6.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_7]: {
      key: 'planet-7',
      path: 'planets/planet-7.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_8]: {
      key: 'planet-8',
      path: 'planets/planet-8.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_9]: {
      key: 'planet-9',
      path: 'planets/planet-9.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_10]: {
      key: 'planet-10',
      path: 'planets/planet-10.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_11]: {
      key: 'planet-11',
      path: 'planets/planet-11.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_12]: {
      key: 'planet-12',
      path: 'planets/planet-12.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_13]: {
      key: 'planet-13',
      path: 'planets/planet-13.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_14]: {
      key: 'planet-14',
      path: 'planets/planet-14.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_15]: {
      key: 'planet-15',
      path: 'planets/planet-15.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    },
    [AssetKey.PLANET_16]: {
      key: 'planet-16',
      path: 'planets/planet-16.png',
      type: AssetType.IMAGE,
      categories: [AssetCategory.PLANET]
    }
  };
  
  // Vordefinierte Animationen
  private static readonly animations: Record<string, AnimationDefinition> = {
    explode: {
      key: 'explode',
      frames: [
        AssetKey.EXPLOSION1,
        AssetKey.EXPLOSION2,
        AssetKey.EXPLOSION3,
        AssetKey.EXPLOSION4,
        AssetKey.EXPLOSION5
      ],
      frameRate: 15,
      repeat: 0
    }
  };
  
  /**
   * Private Konstruktor für Singleton
   */
  private constructor() {}
  
  /**
   * Gibt die Singleton-Instanz zurück
   */
  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }
  
  /**
   * Lädt Assets basierend auf Kategorien
   * @param scene Die Szene, in der die Assets geladen werden sollen
   * @param categories Kategorien der zu ladenden Assets
   */
  public loadAssetsByCategory(scene: Scene, categories: AssetCategory[]): void {
    if (!scene || !scene.load) {
      console.error('[ASSET_MANAGER] Ungültige Szene zum Laden von Assets');
      return;
    }
    
    console.log(`[ASSET_MANAGER] Lade Assets für Szene: ${scene.scene.key}, Kategorien:`, categories);
    
    // Filtere Assets nach Kategorien
    const assetsToLoad = Object.values(AssetManager.assets).filter(asset => 
      categories.some(category => asset.categories.includes(category))
    );
    
    this.loadAssets(scene, assetsToLoad);
  }
  
  /**
   * Lädt bestimmte Assets basierend auf ihren Keys
   * @param scene Die Szene, in der die Assets geladen werden sollen
   * @param keys Die Keys der zu ladenden Assets
   */
  public loadAssetsByKey(scene: Scene, keys: AssetKey[]): void {
    if (!scene || !scene.load) {
      console.error('[ASSET_MANAGER] Ungültige Szene zum Laden von Assets');
      return;
    }
    
    console.log(`[ASSET_MANAGER] Lade Assets für Szene: ${scene.scene.key}, Keys:`, keys);
    
    // Filtere Assets nach Keys
    const assetsToLoad = keys.map(key => AssetManager.assets[key])
      .filter(asset => asset !== undefined);
    
    this.loadAssets(scene, assetsToLoad);
  }
  
  /**
   * Lädt Assets basierend auf Legacy-Asset-Namen
   * Für Kompatibilität mit älterem Code
   */
  public loadLegacyAssets(scene: Scene, legacyKeys: string[]): void {
    if (!scene || !scene.load) {
      console.error('[ASSET_MANAGER] Ungültige Szene zum Laden von Assets');
      return;
    }
    
    console.log(`[ASSET_MANAGER] Lade Legacy-Assets für Szene: ${scene.scene.key}, Keys:`, legacyKeys);
    
    // Filtere Assets nach Legacy-Keys (für Kompatibilität)
    const assetsToLoad = Object.values(AssetManager.assets).filter(asset => 
      legacyKeys.includes(this.getLegacyKey(asset.key))
    );
    
    this.loadAssets(scene, assetsToLoad);
  }
  
  /**
   * Lädt Assets basierend auf Liste von Asset-Definitionen
   * @param scene Die Szene, in der die Assets geladen werden sollen
   * @param assets Die zu ladenden Assets
   */
  private loadAssets(scene: Scene, assets: AssetDefinition[]): void {
    try {
      if (assets.length === 0) {
        console.warn('[ASSET_MANAGER] Keine Assets zum Laden gefunden');
        return;
      }
      
      // Ladeprozess für jedes Asset starten
      for (const asset of assets) {
        const assetPath = this.getAssetPath(asset.path);
        
        try {
          switch (asset.type) {
            case AssetType.IMAGE:
              console.log(`[ASSET_MANAGER] Lade Bild: ${asset.key} von ${assetPath}`);
              scene.load.image(asset.key, assetPath);
              break;
              
            case AssetType.AUDIO:
              console.log(`[ASSET_MANAGER] Lade Audio: ${asset.key} von ${assetPath}`);
              scene.load.audio(asset.key, assetPath);
              break;
              
            case AssetType.SPRITESHEET:
              console.log(`[ASSET_MANAGER] Lade Spritesheet: ${asset.key} von ${assetPath}`);
              scene.load.spritesheet(asset.key, assetPath, asset.config);
              break;
              
            default:
              console.warn(`[ASSET_MANAGER] Unbekannter Asset-Typ für ${asset.key}: ${asset.type}`);
          }
        } catch (assetError) {
          console.error(`[ASSET_MANAGER] Fehler beim Laden von Asset ${asset.key}:`, assetError);
        }
      }
      
      // Event-Handler für Ladefortschritt
      scene.load.on('progress', (value: number) => {
        console.log(`[ASSET_MANAGER] Ladefortschritt: ${Math.round(value * 100)}%`);
      });
      
      // Event-Handler für Ladefehler
      scene.load.on('loaderror', (file: any) => {
        console.error(`[ASSET_MANAGER] Fehler beim Laden von: ${file.src || file.key}`);
      });
      
      // Event-Handler für erfolgreichen Ladevorgang
      scene.load.on('complete', () => {
        console.log(`[ASSET_MANAGER] Alle Assets für Szene ${scene.scene.key} wurden erfolgreich geladen`);
        
        // Wenn im Hauptmenü, überspringe Animations-Erstellung
        if (scene.scene.key === 'MainMenuScene') {
          return;
        }
        
        // Prüfen, ob alle benötigten Textures für Animationen geladen wurden
        const explosion = AssetManager.animations.explode;
        const allFramesLoaded = explosion.frames.every(frameKey => {
          const asset = AssetManager.assets[frameKey];
          return scene.textures.exists(asset.key);
        });
        
        if (!allFramesLoaded) {
          console.warn(`[ASSET_MANAGER] Nicht alle benötigten Frames für Animationen sind geladen!`);
          return;
        }
        
        // Erstelle die Animations-Konfiguration
        this.createAnimations(scene);
      });
      
    } catch (error) {
      console.error(`[ASSET_MANAGER] Fehler beim Laden der Assets:`, error);
    }
  }
  
  /**
   * Erstellt Animationen für die Szene
   * @param scene Die Szene, in der die Animationen erstellt werden sollen
   */
  private createAnimations(scene: Scene): void {
    try {
      // Prüfe, ob die Szene gültig ist
      if (!scene || !scene.anims) {
        console.error(`[ASSET_MANAGER] Animations-Objekt nicht verfügbar`);
        return;
      }

      // Erstelle die Explosions-Animation wenn sie noch nicht existiert
      if (!scene.anims.exists('explode')) {
        try {
          const explosion = AssetManager.animations.explode;
          const frames = explosion.frames.map(frameKey => ({ 
            key: AssetManager.assets[frameKey].key 
          }));
          
          scene.anims.create({
            key: explosion.key,
            frames: frames,
            frameRate: explosion.frameRate,
            repeat: explosion.repeat
          });
          
          console.log(`[ASSET_MANAGER] Animation 'explode' wurde erfolgreich erstellt`);
        } catch (animError) {
          console.error(`[ASSET_MANAGER] Fehler beim Erstellen der Animation:`, animError);
        }
      }
    } catch (error) {
      console.error(`[ASSET_MANAGER] Fehler beim Erstellen der Animationen:`, error);
    }
  }
  
  /**
   * Gibt den richtigen Asset-Pfad abhängig vom Modus zurück
   * @param path Der relative Pfad zum Asset
   * @returns Der vollständige Pfad zum Asset
   */
  private getAssetPath(path: string): string {
    // Mit 'publicDir: assets' sind alle Assets direkt im Root-Verzeichnis verfügbar
    if (path.startsWith('/assets/')) {
      return path.substring('/assets/'.length);
    }
    
    // Wenn der Pfad mit einem Slash beginnt, entferne ihn
    if (path.startsWith('/')) {
      return path.substring(1);
    }
    
    return path;
  }
  
  /**
   * Gibt den Key für ein Asset zurück
   * @param key Der Asset-Key
   * @returns Der Asset-Key für Phaser-Verwendung
   */
  public getKey(key: AssetKey): string {
    const asset = AssetManager.assets[key];
    return asset ? asset.key : '';
  }
  
  /**
   * Gibt den Legacy-Key für ein Asset zurück (für Kompatibilität)
   */
  private getLegacyKey(key: string): string {
    // Konvertiere z.B. 'explosion1' zu 'EXPLOSION_1'
    return key.toUpperCase().replace(/-/g, '_');
  }
  
  /**
   * Konvertiert einen alten Constants.ASSET_* Key zu einem AssetKey
   * Für Kompatibilität mit bestehendem Code
   */
  public getLegacyAssetKey(legacyKey: string): AssetKey | undefined {
    const foundKey = Object.entries(AssetManager.assets).find(
      ([, asset]) => this.getLegacyKey(asset.key) === legacyKey
    );
    
    return foundKey ? foundKey[0] as AssetKey : undefined;
  }
  
  /**
   * Gibt den vollständigen Asset zurück
   * @param key Der Asset-Key
   * @returns Das vollständige Asset oder undefined
   */
  public getAsset(key: AssetKey): AssetDefinition | undefined {
    return AssetManager.assets[key];
  }
} 