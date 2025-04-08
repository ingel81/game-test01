/**
 * NewEnemyManager
 * Verwaltet die Erstellung, Aktualisierung und Zerstörung von Gegnern mit dem neuen komponentenbasierten System
 */

import { BaseEnemy } from '../entities/enemies/baseEnemy';
import { StandardEnemy } from '../entities/enemies/standardEnemy';
import { AdvancedEnemy } from '../entities/enemies/advancedEnemy';
import { EliteEnemy } from '../entities/enemies/eliteEnemy';
import { BossEnemy } from '../entities/enemies/bossEnemy';
import { TurretEnemy } from '../entities/enemies/turretEnemy';
import { Constants } from '../utils/constants';
import { Player } from '../entities/player/player';
import { EventBus, EventType } from '../utils/eventBus';
import { DebugMode } from '../scenes/baseScene';
import { EnemyType } from '../config/levelConfig';

// Optionen für die Gegnererzeugung
export interface EnemySpawnOptions {
  healthMultiplier?: number;
  speedMultiplier?: number;
  fireRateMultiplier?: number;
}

export class NewEnemyManager {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: BaseEnemy[] = [];
  private difficulty: number = 1;
  private eventBus: EventBus;
  private isPaused: boolean = false;
  private turretActive: boolean = false;
  private allEnemyBullets: Phaser.Physics.Arcade.Group;
  private currentDebugMode: DebugMode = DebugMode.OFF;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.eventBus = EventBus.getInstance();
    
    // Zentrale Gruppe für alle feindlichen Projektile (ohne Pooling)
    this.allEnemyBullets = this.scene.physics.add.group();
    
    // Event-Listener für Spielevents
    this.eventBus.on(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.on(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.on(EventType.GAME_OVER, this.stopSpawning);
    this.eventBus.on('REGISTER_ENEMY_BULLET', this.registerEnemyBullet);
    this.eventBus.on(EventType.DEBUG_TOGGLED, this.onDebugModeChanged);
    this.eventBus.on(EventType.ENEMY_REMOVED, this.handleEnemyRemoved);
  }
  
  /**
   * Spawnt einen Gegner des angegebenen Typs
   */
  public spawnEnemyOfType(type: string, x: number, y: number, options?: EnemySpawnOptions): BaseEnemy {
    let enemy: BaseEnemy;
    
    console.log(`[ENEMY_MANAGER] Spawne neuen Gegner vom Typ '${type}' an Position (${x}, ${y})`);
    console.log(`[ENEMY_MANAGER] Aktuelle Schwierigkeit: ${this.difficulty}`);
    console.log(`[ENEMY_MANAGER] EnemyType Enum Check - STANDARD = ${EnemyType.STANDARD}, Gleichheit: ${type === EnemyType.STANDARD}`);
    console.log(`[ENEMY_MANAGER] EnemyType direkt als String: ${type}`);
    console.log(`[ENEMY_MANAGER] Typ-Vergleich: type === 'standard': ${type === 'standard'}`);
    console.log(`[ENEMY_MANAGER] Typ nach toLowerCase: ${type.toLowerCase()}`);
    
    const spawnStartTime = performance.now();
    
    switch (type.toLowerCase()) {
      case 'standard':
        console.log(`[ENEMY_MANAGER] Case 'standard' getroffen`);
        enemy = new StandardEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] StandardEnemy erstellt mit ${enemy.getHealth()} HP`);
        break;
      case 'advanced':
        console.log(`[ENEMY_MANAGER] Case 'advanced' getroffen`);
        enemy = new AdvancedEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] AdvancedEnemy erstellt mit ${enemy.getHealth()} HP`);
        break;
      case 'elite':
        console.log(`[ENEMY_MANAGER] Case 'elite' getroffen`);
        enemy = new EliteEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] EliteEnemy erstellt mit ${enemy.getHealth()} HP`);
        break;
      case 'boss':
        console.log(`[ENEMY_MANAGER] Case 'boss' getroffen`);
        enemy = new BossEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] *** BOSS SPAWNED *** mit ${enemy.getHealth()} HP`);
        // Boss-Spawned-Event auslösen
        this.eventBus.emit(EventType.BOSS_SPAWNED, enemy);
        break;
      case 'turret':
        console.log(`[ENEMY_MANAGER] Case 'turret' getroffen`);
        enemy = new TurretEnemy(this.scene, x, y, this.player);
        this.turretActive = true;
        console.log(`[ENEMY_MANAGER] TurretEnemy erstellt mit ${enemy.getHealth()} HP`);
        console.log(`[ENEMY_MANAGER] TurretActive-Flag gesetzt auf ${this.turretActive}`);
        break;
      default:
        console.warn(`[ENEMY_MANAGER] Unbekannter Gegnertyp '${type}', erstelle StandardEnemy`);
        enemy = new StandardEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] Fallback: StandardEnemy erstellt mit ${enemy.getHealth()} HP`);
    }
    
    // Spawn-Zeit protokollieren
    const spawnEndTime = performance.now();
    console.log(`[ENEMY_MANAGER] Gegner erzeugt in ${(spawnEndTime - spawnStartTime).toFixed(2)}ms`);
    
    // Gegner zur Liste hinzufügen
    this.enemies.push(enemy);
    
    // Wende Multiplikatoren an (falls angegeben)
    if (options) {
      this.applyEnemyOptions(enemy, options);
    }
    
    return enemy;
  }
  
  /**
   * Wendet Optionen und Multiplikatoren auf einen Gegner an
   */
  private applyEnemyOptions(enemy: BaseEnemy, options: EnemySpawnOptions): void {
    // Nur Optionen anwenden, die tatsächlich gesetzt sind
    const difficultyOptions = {
      difficulty: this.difficulty,
      factor: 1.0 + (this.difficulty - 1) * 0.1
    };
    
    // Modifiziere die Faktoren basierend auf den übergebenen Optionen
    if (options.healthMultiplier) {
      difficultyOptions.factor *= options.healthMultiplier;
    }
    
    enemy.applyDifficulty(difficultyOptions);
    
    console.log(`[ENEMY_MANAGER] Multiplikatoren angewendet: health=${options.healthMultiplier || 1}, speed=${options.speedMultiplier || 1}, fireRate=${options.fireRateMultiplier || 1}`);
  }
  
  /**
   * Aktualisiert alle Gegner und Projektile
   */
  public update(time: number, delta: number): void {
    if (this.isPaused) return;
    
    // Debug-Informationen anzeigen, wenn aktiviert
    if (this.currentDebugMode !== DebugMode.OFF && time % 1000 < 20) {
      const activeEnemies = this.enemies.length;
      const activeBullets = this.allEnemyBullets.getChildren().filter(bullet => bullet.active).length;
    }
    
    // Aktualisiere alle Gegner
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Überprüfe ob der Gegner noch existiert
      if (!enemy || !enemy.getSprite) {
        console.log(`[ENEMY_MANAGER] Ungültiger Gegner an Index ${i} gefunden, wird entfernt.`);
        this.enemies.splice(i, 1);
        continue;
      }
      
      const sprite = enemy.getSprite();
      
      // Überspringe, wenn der Gegner inaktiv ist
      if (!sprite || !sprite.active) {
        console.log(`[ENEMY_MANAGER] Gegner mit inaktivem Sprite entfernt.`);
        this.enemies.splice(i, 1);
        continue;
      }
      
      // Aktualisiere aktive Gegner
      try {
        enemy.update(time, delta);
      } catch (error) {
        console.error(`[ENEMY_MANAGER] Fehler beim Aktualisieren des Gegners: ${error}`);
        // Im Fehlerfall Gegner entfernen
        this.enemies.splice(i, 1);
      }
    }
    
    // Aktualisiere alle Projektile
    this.updateBullets();
  }
  
  /**
   * Aktualisiert alle Projektile und entfernt inaktive
   */
  private updateBullets(): void {
    this.allEnemyBullets.getChildren().forEach((bullet) => {
        const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
        
        // Prüfe auf Bullets außerhalb des Bildschirms
        if (bulletSprite.x < -50 || bulletSprite.x > this.scene.scale.width + 50 || 
            bulletSprite.y < -50 || bulletSprite.y > this.scene.scale.height + 50) {
            bulletSprite.destroy();
            return;
        }
        
        // Prüfe auf steckengebliebene Bullets
        if (bulletSprite.body && (Math.abs(bulletSprite.body.velocity.x) < 1 && Math.abs(bulletSprite.body.velocity.y) < 1)) {
            bulletSprite.destroy();
            return;
        }
    });
  }
  
  /**
   * Registriert ein Projektil im zentralen Manager
   */
  private registerEnemyBullet = (bullet: Phaser.Physics.Arcade.Sprite): void => {
    // Füge zur Gruppe hinzu
    this.allEnemyBullets.add(bullet);
    
    // Debug-Logging
    console.log(`[ENEMY_MANAGER] Neues Projektil registriert, ID: ${bullet.getData('bulletId')}, Aktive Bullets: ${this.allEnemyBullets.getChildren().length}`);

    // Stelle sicher, dass Projektil in die richtige Richtung fliegt (zum Spieler)
    if (bullet.body && bullet.body.velocity.x > 0) {
        console.error(`[ENEMY_MANAGER] FEHLER: Projektil fliegt in falsche Richtung! Korrigiere Richtung`);
        bullet.body.velocity.x = -Math.abs(bullet.body.velocity.x); // Nach links fliegen lassen
    }
  }
    
  /**
   * Reagiert auf Änderungen des Debug-Modus
   */
  private onDebugModeChanged = (mode: DebugMode): void => {
    this.currentDebugMode = mode;
    console.log(`[ENEMY_MANAGER] Debug-Modus geändert auf: ${mode}`);
  }
    
  /**
   * Gibt alle aktiven Gegner zurück
   */
  public getAllEnemies(): BaseEnemy[] {
    return this.enemies;
  }
  
  /**
   * Gibt alle Projektile der Gegner zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.allEnemyBullets;
  }
  
  /**
   * Pausiert das Spawnen und die Bewegung
   */
  private pauseSpawning = (): void => {
    this.isPaused = true;
  }
  
  /**
   * Setzt das Spawnen und die Bewegung fort
   */
  private resumeSpawning = (): void => {
    this.isPaused = false;
  }
  
  /**
   * Stoppt das Spawnen vollständig
   */
  private stopSpawning = (): void => {
    this.isPaused = true;
  }
  
  /**
   * Zerstört alle aktiven Gegner
   */
  public destroyAllEnemies(): void {
    console.log(`[ENEMY_MANAGER] Zerstöre alle ${this.enemies.length} Gegner`);
    
    // Kopiere das Array, um Probleme beim Entfernen zu vermeiden
    const enemiesToDestroy = [...this.enemies];
    
    // Zerstöre alle Gegner
    enemiesToDestroy.forEach(enemy => {
      enemy.destroy();
    });
    
    // Leere das Array
    this.enemies = [];
    this.turretActive = false;
  }
  
  /**
   * Zerstört einen Gegner basierend auf dem Sprite
   */
  public destroyEnemy(enemySprite: Phaser.GameObjects.GameObject): void {
    // Finde den passenden Gegner zur Sprite-Referenz
    const index = this.enemies.findIndex(enemy => enemy.getSprite() === enemySprite);
    
    if (index !== -1) {
      const enemy = this.enemies[index];
      const enemyType = enemy.constructor.name;
      
      console.log(`[ENEMY_MANAGER] Zerstöre Gegner vom Typ ${enemyType}`);
      
      // Wenn es ein Turret war, setze turretActive zurück
      if (enemyType === 'TurretEnemy') {
        this.turretActive = false;
        console.log(`[ENEMY_MANAGER] TurretActive auf false gesetzt nach Turret-Zerstörung`);
      }
      
      // BUGFIX: Zuerst die destroy-Methode des Gegners aufrufen, um die visuellen Effekte zu starten
      enemy.destroy();
      console.log(`[ENEMY_MANAGER] Enemy.destroy() wurde aufgerufen für ${enemyType}`);
      
      // Entferne den Gegner aus dem Array
      this.enemies.splice(index, 1);
      console.log(`[ENEMY_MANAGER] Gegner aus der Liste entfernt. Verbleibende Anzahl: ${this.enemies.length}`);
    } else {
      console.warn(`[ENEMY_MANAGER] destroyEnemy: Gegner nicht in der Liste gefunden.`);
    }
  }
  
  /**
   * Bereinigt alle Ressourcen
   */
  public destroy(): void {
    console.log(`[ENEMY_MANAGER] Manager wird zerstört`);
    
    // Zerstöre alle Gegner
    this.destroyAllEnemies();
        
    // Entferne Event-Listener
    this.eventBus.off(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.off(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.off(EventType.GAME_OVER, this.stopSpawning);
    this.eventBus.off('REGISTER_ENEMY_BULLET', this.registerEnemyBullet);
    this.eventBus.off(EventType.DEBUG_TOGGLED, this.onDebugModeChanged);
    this.eventBus.off(EventType.ENEMY_REMOVED, this.handleEnemyRemoved);
  }
  
  /**
   * Bereitet den Manager auf das Level-Ende vor
   * - Stoppt alle automatischen Spawns
   * - Entfernt Gegner, die außerhalb des Bildschirms sind
   * - Gibt ein Promise zurück, das aufgelöst wird, wenn alle Gegner den Bildschirm verlassen haben
   */
  public prepareForLevelEnd(): Promise<void> {
    console.log('[ENEMY_MANAGER] Bereite Manager auf Level-Ende vor');
    
    // Stoppe alle Spawn-Prozesse
    this.stopSpawning();
    
    // Entferne sofort alle Gegner, die den Bildschirm bereits verlassen haben
    this.removeOffscreenEnemies();
    
    // Gib ein Promise zurück, das aufgelöst wird, wenn alle Gegner weg sind
    return new Promise<void>((resolve) => {
      this.checkRemainingEnemies(resolve);
    });
  }
  
  /**
   * Ruft update() für alle Gegner auf, um die Selbstzerstörungslogik auszulösen
   * @returns Die Anzahl der aktualisierten Gegner
   */
  private removeOffscreenEnemies(): number {
    const enemyCount = this.enemies.length;
    
    // Aktualisiere alle Gegner, um deren Selbstzerstörungslogik auszulösen
    const time = this.scene.time.now;
    const delta = this.scene.game.loop.delta;
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      try {
        const enemy = this.enemies[i];
        if (enemy) {
          enemy.update(time, delta);
        }
      } catch (error) {
        console.error(`[ENEMY_MANAGER] Fehler beim Prüfen auf Gegner außerhalb des Bildschirms: ${error}`);
      }
    }
    
    // Gib die Anzahl der Gegner vor der Aktualisierung zurück
    return enemyCount;
  }
  
  /**
   * Überprüft, ob noch Gegner vorhanden sind und ruft die Callback-Funktion auf, wenn alle weg sind
   * @param callback Die Funktion, die aufgerufen wird, wenn alle Gegner weg sind
   */
  private checkRemainingEnemies(callback: () => void): void {
    // Entferne nochmals Gegner außerhalb des Bildschirms
    this.removeOffscreenEnemies();
    
    const remainingEnemies = this.enemies.length;
    console.log(`[ENEMY_MANAGER] Prüfe verbleibende Gegner: ${remainingEnemies}`);
    
    if (remainingEnemies === 0) {
      // Alle Gegner sind weg, löse das Promise auf
      console.log('[ENEMY_MANAGER] Alle Gegner wurden entfernt.');
      callback();
    } else {
      // Es sind noch Gegner da, warte 100ms und prüfe erneut
      this.scene.time.delayedCall(100, () => this.checkRemainingEnemies(callback));
    }
  }
  
  /**
   * Reagiert auf das ENEMY_REMOVED Event
   */
  private handleEnemyRemoved = (data: any): void => {
    if (data && data.enemy) {
      // Finde den Gegner im Array
      const index = this.enemies.findIndex(e => e === data.enemy);
      if (index !== -1) {
        // Entferne nur aus der Liste, ohne weitere Effekte
        this.enemies.splice(index, 1);
        console.log(`[ENEMY_MANAGER] Gegner still entfernt. Verbleibende Anzahl: ${this.enemies.length}`);
      }
    }
  }
} 