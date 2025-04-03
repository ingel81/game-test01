/**
 * Asset-Manager Klasse für zentrale Verwaltung aller Spiel-Assets
 */

import { Constants } from './constants';

// Asset-Typen
export enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  SPRITESHEET = 'spritesheet',
  ANIMATION = 'animation'
}

// Interface für einzelne Asset-Definitionen
export interface AssetDefinition {
  key: string;
  path: string;
  type: AssetType;
  config?: any; // Für Spritesheets und Animationen
}

/**
 * Zentraler Asset-Manager für das Spiel
 * Enthält alle Asset-Definitionen und Methoden zum Laden
 */
export class AssetLoader {
  // Alle Spiel-Assets als zentrale Sammlung
  public static readonly ASSETS: Record<string, AssetDefinition> = {
    // Hintergrund-Assets
    BACKGROUND: { key: 'background', path: 'background/bg-preview-big.png', type: AssetType.IMAGE },
    BG_PLANET: { key: 'bg-planet', path: 'background/layered/bg-planet.png', type: AssetType.IMAGE },
    
    // Planeten (1-16)
    ...Array.from({ length: 16 }, (_, i) => ({ 
      [`PLANET_${i+1}`]: { 
        key: `planet-${i+1}`, 
        path: `planets/planet-${i+1}.png`, 
        type: AssetType.IMAGE 
      }
    })).reduce((acc, val) => ({ ...acc, ...val }), {}),
    
    // Spieler-Assets
    PLAYER: { key: Constants.ASSET_PLAYER, path: 'player/sprites/player.png', type: AssetType.IMAGE },
    PLAYER_UP: { key: Constants.ASSET_PLAYER_UP, path: 'player/sprites/player_up.png', type: AssetType.IMAGE },
    PLAYER_DOWN: { key: Constants.ASSET_PLAYER_DOWN, path: 'player/sprites/player_down.png', type: AssetType.IMAGE },    
    
    // Bullet-Assets
    BULLET: { key: Constants.ASSET_BULLET, path: 'shoot/shoot1.png', type: AssetType.IMAGE },
    ENEMY_BULLET: { key: Constants.ASSET_ENEMY_BULLET, path: 'shoot/shoot2.png', type: AssetType.IMAGE },
    
    // Gegner-Assets
    ENEMY01: { key: Constants.ASSET_ENEMY01, path: 'enemy/sprites/enemy01.png', type: AssetType.IMAGE },
    ENEMY02: { key: Constants.ASSET_ENEMY02, path: 'enemy/sprites/enemy02.png', type: AssetType.IMAGE },
    BOSS01: { key: Constants.ASSET_BOSS01, path: 'enemy/sprites/boss01.png', type: AssetType.IMAGE },
    TURRET_BASE: { key: Constants.ASSET_TURRET_BASE, path: 'enemy/sprites/turret01_base.png', type: AssetType.IMAGE },
    TURRET_TOP: { key: Constants.ASSET_TURRET_TOP, path: 'enemy/sprites/turret01_top.png', type: AssetType.IMAGE },
    
    // Asteroid-Assets
    ASTEROID: { key: Constants.ASSET_ASTEROID, path: 'asteroids/asteroid.png', type: AssetType.IMAGE },
    ASTEROID_SMALL: { key: Constants.ASSET_ASTEROID_SMALL, path: 'asteroids/asteroid-small.png', type: AssetType.IMAGE },
    
    // Explosions-Assets
    EXPLOSION_1: { key: Constants.ASSET_EXPLOSION_1, path: 'explosion/sprites/explosion1.png', type: AssetType.IMAGE },
    EXPLOSION_2: { key: Constants.ASSET_EXPLOSION_2, path: 'explosion/sprites/explosion2.png', type: AssetType.IMAGE },
    EXPLOSION_3: { key: Constants.ASSET_EXPLOSION_3, path: 'explosion/sprites/explosion3.png', type: AssetType.IMAGE },
    EXPLOSION_4: { key: Constants.ASSET_EXPLOSION_4, path: 'explosion/sprites/explosion4.png', type: AssetType.IMAGE },
    EXPLOSION_5: { key: Constants.ASSET_EXPLOSION_5, path: 'explosion/sprites/explosion5.png', type: AssetType.IMAGE },
    
    // Pickup-Assets
    ENERGY_DROP: { key: Constants.ASSET_ENERGY_DROP, path: 'pickups/energy.png', type: AssetType.IMAGE },
    POWER_DROP: { key: Constants.ASSET_POWER_DROP, path: 'pickups/power.png', type: AssetType.IMAGE },
    
    // Sound-Assets
    SOUND_CLICK: { key: 'click', path: 'sounds/laser1.wav', type: AssetType.AUDIO },
    SOUND_SHOOT: { key: Constants.SOUND_SHOOT, path: 'sounds/shot 1.wav', type: AssetType.AUDIO },
    SOUND_ENEMY_SHOOT: { key: Constants.SOUND_ENEMY_SHOOT, path: 'sounds/shot 2.wav', type: AssetType.AUDIO },
    SOUND_EXPLOSION: { key: Constants.SOUND_EXPLOSION, path: 'sounds/explosion.wav', type: AssetType.AUDIO },
    
    // Musik-Assets
    MUSIC_TITLE: { key: 'title', path: 'music/title.mp3', type: AssetType.AUDIO },
    MUSIC_BACKGROUND: { key: Constants.SOUND_BACKGROUND, path: 'music/01.mp3', type: AssetType.AUDIO },
    MUSIC_00: { key: '00', path: 'music/00.mp3', type: AssetType.AUDIO },
    MUSIC_01: { key: '01', path: 'music/01.mp3', type: AssetType.AUDIO },
    MUSIC_02: { key: '02', path: 'music/02.mp3', type: AssetType.AUDIO },
    
    // Logo-Assets
    LOGO: { key: 'logo', path: 'logo/title4.png', type: AssetType.IMAGE }
  };
  
  // Vordefinierte Animationen
  public static readonly ANIMATIONS = {
    EXPLODE: {
      key: 'explode',
      frames: [
        Constants.ASSET_EXPLOSION_1,
        Constants.ASSET_EXPLOSION_2,
        Constants.ASSET_EXPLOSION_3,
        Constants.ASSET_EXPLOSION_4,
        Constants.ASSET_EXPLOSION_5
      ],
      frameRate: 15,
      repeat: 0
    }
  };

  /**
   * Lädt alle Assets für eine bestimmte Szene
   * @param scene Die Phaser-Szene, in der die Assets geladen werden sollen
   * @param assetKeys Array von Asset-Schlüsseln, die geladen werden sollen (optional)
   */
  public static loadAssets(scene: Phaser.Scene, assetKeys?: string[]): void {
    try {
      if (!scene || !scene.load) {
        console.error(`[ASSET_LOADER] Ungültige Szene zum Laden von Assets`);
        return;
      }
      
      console.log(`[ASSET_LOADER] Lade Assets für Szene: ${scene.scene.key}`);
      
      // Bestimme, welche Assets geladen werden sollen
      const assetsToLoad = assetKeys 
        ? Object.entries(this.ASSETS).filter(([key]) => assetKeys.includes(key))
        : Object.entries(this.ASSETS);
      
      if (assetsToLoad.length === 0) {
        console.warn(`[ASSET_LOADER] Keine Assets zum Laden gefunden für Schlüssel:`, assetKeys);
        return;
      }
      
      // Ladeprozess für jedes Asset starten
      for (const [key, asset] of assetsToLoad) {
        const assetPath = Constants.getAssetPath(asset.path);
        
        try {
          switch (asset.type) {
            case AssetType.IMAGE:
              console.log(`[ASSET_LOADER] Lade Bild: ${asset.key} von ${assetPath}`);
              scene.load.image(asset.key, assetPath);
              break;
              
            case AssetType.AUDIO:
              console.log(`[ASSET_LOADER] Lade Audio: ${asset.key} von ${assetPath}`);
              scene.load.audio(asset.key, assetPath);
              break;
              
            case AssetType.SPRITESHEET:
              console.log(`[ASSET_LOADER] Lade Spritesheet: ${asset.key} von ${assetPath}`);
              scene.load.spritesheet(asset.key, assetPath, asset.config);
              break;
              
            default:
              console.warn(`[ASSET_LOADER] Unbekannter Asset-Typ für ${key}: ${asset.type}`);
          }
        } catch (assetError) {
          console.error(`[ASSET_LOADER] Fehler beim Laden von Asset ${key}:`, assetError);
        }
      }
      
      // Event-Handler für Ladefortschritt
      scene.load.on('progress', (value: number) => {
        console.log(`[ASSET_LOADER] Ladefortschritt: ${Math.round(value * 100)}%`);
      });
      
      // Event-Handler für Ladefehler
      scene.load.on('loaderror', (file: any) => {
        console.error(`[ASSET_LOADER] Fehler beim Laden von: ${file.src || file.key}`);
      });
      
      // Event-Handler für erfolgreichen Ladevorgang
      scene.load.on('complete', () => {
        console.log(`[ASSET_LOADER] Alle Assets für Szene ${scene.scene.key} wurden erfolgreich geladen`);
        
        // Prüfen, ob alle benötigten Textures für Animationen geladen wurden
        // Überspringe die Prüfung im Hauptmenü, da dort die Explosion-Assets nicht benötigt werden
        if (scene.scene.key !== Constants.SCENE_MAIN_MENU) {
          const explosionFrames = this.ANIMATIONS.EXPLODE.frames;
          const allFramesLoaded = explosionFrames.every(frameKey => scene.textures.exists(frameKey));
          
          if (!allFramesLoaded) {
            console.warn(`[ASSET_LOADER] Nicht alle benötigten Frames für Animationen sind geladen!`);
            // Liste der fehlenden Frames ausgeben
            explosionFrames.forEach(frameKey => {
              if (!scene.textures.exists(frameKey)) {
                console.warn(`[ASSET_LOADER] Frame fehlt: ${frameKey}`);
              }
            });
          }
        }
        
        // Erst nach vollständigem Laden die Animationen erstellen
        this.createAnimations(scene);
      });
      
    } catch (error) {
      console.error(`[ASSET_LOADER] Fehler beim Laden der Assets:`, error);
    }
  }
  
  /**
   * Erstellt alle Animationen für die Szene
   * @param scene Die Phaser-Szene, in der die Animationen erstellt werden sollen
   */
  private static createAnimations(scene: Phaser.Scene): void {
    try {
      // Prüfe, ob die Szene gültig ist
      if (!scene || !scene.anims) {
        console.error(`[ASSET_LOADER] Animations-Objekt nicht verfügbar`);
        return;
      }

      // Im Hauptmenü wird die Explosion-Animation nicht benötigt
      if (scene.scene.key === Constants.SCENE_MAIN_MENU) {
        return;
      }

      // Prüfe, ob die erforderlichen Frames vorhanden sind
      const allFramesLoaded = this.ANIMATIONS.EXPLODE.frames.every(frameKey => 
        scene.textures.exists(frameKey)
      );

      if (!allFramesLoaded) {
        console.error(`[ASSET_LOADER] Nicht alle erforderlichen Frames für die Explosion-Animation sind geladen`);
        console.log(`[ASSET_LOADER] Verfügbare Texturen:`, scene.textures.list);
        return;
      }

      // Erstelle die Explosions-Animation
      if (!scene.anims.exists('explode')) {
        try {
          const frames = this.ANIMATIONS.EXPLODE.frames.map(frameKey => ({ key: frameKey }));
          const config = {
            key: this.ANIMATIONS.EXPLODE.key,
            frames: frames,
            frameRate: this.ANIMATIONS.EXPLODE.frameRate,
            repeat: this.ANIMATIONS.EXPLODE.repeat
          };
          
          console.log(`[ASSET_LOADER] Erstelle Animations-Konfiguration:`, config);
          scene.anims.create(config);
          console.log(`[ASSET_LOADER] Animation 'explode' wurde erfolgreich erstellt`);
        } catch (animError) {
          console.error(`[ASSET_LOADER] Fehler beim Erstellen der Animation:`, animError);
        }
      } else {
        console.log(`[ASSET_LOADER] Animation 'explode' existiert bereits`);
      }
    } catch (error) {
      console.error(`[ASSET_LOADER] Fehler beim Erstellen der Animationen:`, error);
    }
  }
} 