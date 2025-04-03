/**
 * CollisionManager.ts
 * Verwaltet die Kollisionserkennung und -behandlung im Spiel
 */

import { EventBus, EventType } from './utils/eventBus';
import { NewEnemyManager } from './managers/newEnemyManager';
import { SpawnManager } from './managers/spawnManager';
import { Player } from './entities/player/player';
import { Constants } from './utils/constants';

export class CollisionManager {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private enemyManager: NewEnemyManager | null = null;
  private spawnManager: SpawnManager | null = null;
  private isProcessingCollision: boolean = false;
  private player: Player | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    
    // Debug für die Parameteranforderung
    console.log('[COLLISION_MANAGER] Initialisiert mit 1 Parameter');
  }

  /**
   * Setzt die notwendigen Manager
   */
  public setManagers(enemyManager: NewEnemyManager, spawnManager: SpawnManager): void {
    this.enemyManager = enemyManager;
    this.spawnManager = spawnManager;
    
    // Initialisiere Kollisionsgruppen und Event-Listener
    this.setupCollisions();
    
    console.log('[COLLISION_MANAGER] Manager gesetzt und Kollisionen initialisiert');
  }
  
  /**
   * Setzt den Spieler für Kollisionserkennung
   */
  public setPlayer(player: Player): void {
    this.player = player;
    this.setupPlayerCollisions();
    
    console.log('[COLLISION_MANAGER] Spieler gesetzt und Kollisionen initialisiert');
  }

  /**
   * Richtet alle Kollisionsbehandlungen ein
   */
  private setupCollisions(): void {
    if (!this.enemyManager || !this.spawnManager) {
      console.error('[COLLISION_MANAGER] Kann Kollisionen nicht einrichten: Manager fehlen');
      return;
    }
    
    console.log('[COLLISION_MANAGER] Richte Spieler-Projektil zu Gegner-Kollisionen ein');
  }
  
  /**
   * Richtet Spieler-bezogene Kollisionen ein
   */
  private setupPlayerCollisions(): void {
    if (!this.player || !this.enemyManager) {
      console.error('[COLLISION_MANAGER] Kann Spielerkollisionen nicht einrichten: Spieler oder EnemyManager fehlt');
      return;
    }
    
    console.log('[COLLISION_MANAGER] Richte Gegner-Projektil zu Spieler-Kollisionen ein');
  }
} 