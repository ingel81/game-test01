/**
 * NewEnemyManager
 * Verwaltet die Erstellung, Aktualisierung und Zerstörung von Gegnern mit dem neuen komponentenbasierten System
 */

import { BaseEnemy } from '../entities/enemies/baseEnemy';
import { StandardEnemy } from '../entities/enemies/standardEnemy';
import { AdvancedEnemy } from '../entities/enemies/advancedEnemy';
import { EliteEnemy } from '../entities/enemies/eliteEnemy';
import { BossEnemy } from '../entities/enemies/newBossEnemy';
import { TurretEnemy } from '../entities/enemies/turretEnemy';
import { Constants } from '../utils/constants';
import { Player } from '../entities/player/player';
import { EventBus, EventType } from '../utils/eventBus';
import { DebugMode } from '../scenes/baseScene';

// Gegnertypen für die Erzeugung
type EnemyType = 'standard' | 'advanced' | 'elite' | 'boss' | 'turret';

export class NewEnemyManager {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: BaseEnemy[] = [];
  private maxEnemies: number = 15;
  private enemySpawnTimer: Phaser.Time.TimerEvent;
  private bossSpawnTimer: Phaser.Time.TimerEvent;
  private difficulty: number = 1;
  private eventBus: EventBus;
  private isPaused: boolean = false;
  private bossActive: boolean = false;
  private allEnemyBullets: Phaser.Physics.Arcade.Group;
  private currentDebugMode: DebugMode = DebugMode.OFF;
  
  // Wahrscheinlichkeiten für das Spawn verschiedener Gegnertypen
  private enemySpawnChance: Record<EnemyType, number> = {
    standard: 0.1,
    advanced: 0.0,
    elite: 0.0,
    boss: 0, // Boss wird über einen Timer gespawnt
    turret: 0.9 // 90% Chance für Turrets
  };

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.eventBus = EventBus.getInstance();
    
    // Zentrale Gruppe für alle feindlichen Projektile
    this.allEnemyBullets = this.scene.physics.add.group({
      defaultKey: Constants.ASSET_ENEMY_BULLET,
      maxSize: 300,
      active: false,
      visible: false
    });
    
    // Event-Listener für Spielevents
    this.eventBus.on(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);
    this.eventBus.on(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.on(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.on(EventType.GAME_OVER, this.stopSpawning);
    this.eventBus.on('REGISTER_ENEMY_BULLET', this.registerEnemyBullet);
    this.eventBus.on('BOSS_DESTROYED', this.onBossDestroyed);
    this.eventBus.on(EventType.DEBUG_TOGGLED, this.onDebugModeChanged);
    
    // Starte Spawn-Timer
    this.startSpawnTimers();
  }
  
  /**
   * Starte die Timer für das Spawnen von Gegnern
   */
  private startSpawnTimers(): void {
    // Normaler Gegner-Spawn-Timer
    this.enemySpawnTimer = this.scene.time.addEvent({
      delay: Constants.SPAWN_RATE_ENEMY,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    
    // Boss-Spawn-Timer
    this.bossSpawnTimer = this.scene.time.addEvent({
      delay: Constants.SPAWN_RATE_BOSS,
      callback: this.spawnBoss,
      callbackScope: this,
      loop: true
    });
  }
  
  /**
   * Spawnt einen zufälligen Gegner basierend auf den Wahrscheinlichkeiten
   */
  private spawnEnemy = (): void => {
    if (this.isPaused) return;
    
    // Begrenze die Anzahl der Gegner
    if (this.enemies.length >= this.maxEnemies) {
      console.log(`[ENEMY_MANAGER] Maximale Anzahl Gegner erreicht (${this.enemies.length}/${this.maxEnemies}). Kein weiterer Spawn.`);
      return;
    }
    
    // Wenn ein Boss aktiv ist, weniger normale Gegner spawnen
    if (this.bossActive && Math.random() < 0.6) {
      console.log(`[ENEMY_MANAGER] Spawn übersprungen, da Boss aktiv ist (60% Chance)`);
      return;
    }
    
    // Bestimme den Gegnertyp basierend auf den Wahrscheinlichkeiten
    const randomValue = Math.random();
    let enemyType: EnemyType = 'standard';
    let cumulativeProbability = 0;
    
    console.log(`[ENEMY_MANAGER] Zufallswert für Spawn: ${randomValue.toFixed(4)}`);
    console.log(`[ENEMY_MANAGER] Aktuelle Spawn-Wahrscheinlichkeiten: Standard=${this.enemySpawnChance.standard.toFixed(2)}, Advanced=${this.enemySpawnChance.advanced.toFixed(2)}, Elite=${this.enemySpawnChance.elite.toFixed(2)}, Turret=${this.enemySpawnChance.turret.toFixed(2)}`);
    
    // Definiere die Reihenfolge der Typen explizit
    const enemyTypes: EnemyType[] = ['standard', 'advanced', 'elite', 'turret', 'boss'];
    
    for (const type of enemyTypes) {
      cumulativeProbability += this.enemySpawnChance[type];
      console.log(`[ENEMY_MANAGER] Typ: ${type}, Wahrscheinlichkeit: ${this.enemySpawnChance[type].toFixed(2)}, Kumulativ: ${cumulativeProbability.toFixed(2)}`);
      if (randomValue < cumulativeProbability) {
        enemyType = type;
        console.log(`[ENEMY_MANAGER] Gegnertyp '${enemyType}' ausgewählt bei kumulativer Wahrscheinlichkeit ${cumulativeProbability.toFixed(2)}`);
        break;
      }
    }
    
    // Spawne den entsprechenden Gegnertyp
    this.spawnEnemyOfType(enemyType);
  }
  
  /**
   * Spawnt einen Gegner des angegebenen Typs
   */
  private spawnEnemyOfType(type: EnemyType): void {
    const x = this.scene.scale.width + 50;
    const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
    let enemy: BaseEnemy;
    
    console.log(`[ENEMY_MANAGER] Spawne neuen Gegner vom Typ '${type}' an Position (${x}, ${y})`);
    console.log(`[ENEMY_MANAGER] Aktuelle Schwierigkeit: ${this.difficulty}`);
    
    const spawnStartTime = performance.now();
    
    switch (type) {
      case 'standard':
        enemy = new StandardEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] StandardEnemy erstellt mit ${enemy.getHealth()} HP`);
        break;
      case 'advanced':
        enemy = new AdvancedEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] AdvancedEnemy erstellt mit ${enemy.getHealth()} HP`);
        break;
      case 'elite':
        enemy = new EliteEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] EliteEnemy erstellt mit ${enemy.getHealth()} HP`);
        break;
      case 'boss':
        enemy = new BossEnemy(this.scene, x, y, this.player);
        this.bossActive = true;
        console.log(`[ENEMY_MANAGER] *** BOSS SPAWNED *** mit ${enemy.getHealth()} HP`);
        console.log(`[ENEMY_MANAGER] BossActive-Flag gesetzt auf ${this.bossActive}`);
        // Boss-Spawned-Event auslösen
        this.eventBus.emit(EventType.BOSS_SPAWNED, enemy);
        break;
      case 'turret':
        enemy = new TurretEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] TurretEnemy erstellt mit ${enemy.getHealth()} HP`);
        break;
      default:
        enemy = new StandardEnemy(this.scene, x, y, this.player);
        console.log(`[ENEMY_MANAGER] Fallback: StandardEnemy erstellt mit ${enemy.getHealth()} HP`);
    }
    
    // Manuell den aktuellen Schwierigkeitsgrad setzen
    if (this.difficulty > 1) {
      console.log(`[ENEMY_MANAGER] Wende Schwierigkeitsanpassung an: Stufe ${this.difficulty}, Faktor ${(1.0 + (this.difficulty - 1) * 0.1).toFixed(2)}`);
      enemy.applyDifficulty({
        difficulty: this.difficulty,
        factor: 1.0 + (this.difficulty - 1) * 0.1
      });
      console.log(`[ENEMY_MANAGER] Nach Schwierigkeitsanpassung: ${enemy.getHealth()} HP`);
    }
    
    this.enemies.push(enemy);
    console.log(`[ENEMY_MANAGER] Gegner zur Liste hinzugefügt. Aktuelle Anzahl: ${this.enemies.length}`);
    
    const spawnEndTime = performance.now();
    console.log(`[ENEMY_MANAGER] Spawn-Zeit: ${(spawnEndTime - spawnStartTime).toFixed(2)}ms`);
  }
  
  /**
   * Spawnt einen Boss-Gegner
   */
  private spawnBoss = (): void => {
    if (this.isPaused || this.difficulty < 2 || this.bossActive) {
      if (this.isPaused) {
        console.log(`[ENEMY_MANAGER] Boss-Spawn übersprungen: Spiel ist pausiert`);
      } else if (this.difficulty < 2) {
        console.log(`[ENEMY_MANAGER] Boss-Spawn übersprungen: Schwierigkeit (${this.difficulty}) zu niedrig für Boss`);
      } else if (this.bossActive) {
        console.log(`[ENEMY_MANAGER] Boss-Spawn übersprungen: Bereits ein Boss aktiv`);
        
        // Prüfe, ob tatsächlich noch ein Boss existiert, um potentielle "Ghost-Bosse" zu vermeiden
        let bossFound = false;
        for (const enemy of this.enemies) {
          if (enemy instanceof BossEnemy && enemy.getSprite().active) {
            bossFound = true;
            console.log(`[ENEMY_MANAGER] Boss-Überprüfung: Aktiver Boss gefunden an Position (${enemy.getSprite().x}, ${enemy.getSprite().y})`);
            break;
          }
        }
        
        if (!bossFound) {
          console.log(`[ENEMY_MANAGER] Boss-Überprüfung: bossActive war true, aber kein Boss gefunden. Flag korrigiert.`);
          this.bossActive = false;
          // Erlaube direkt einen neuen Spawn
          this.spawnBoss();
          return;
        }
      }
      return;
    }
    
    console.log(`[ENEMY_MANAGER] Boss-Spawn-Timer ausgelöst. Starte Boss-Spawn...`);
    
    // FIX: Zufällige Position (x und y) für den Boss-Spawn
    const x = this.scene.scale.width + 50;
    
    // FIX: Zufällige vertikale Position im sicheren Bereich des Bildschirms
    // Vorher war es immer in der Mitte (this.scene.scale.height / 2)
    const minY = 150; // Sicherer Abstand vom oberen Rand
    const maxY = this.scene.scale.height - 150; // Sicherer Abstand vom unteren Rand
    const y = Phaser.Math.Between(minY, maxY);
    
    console.log(`[ENEMY_MANAGER] Boss-Spawn Position: (${x}, ${y}), Bildschirmgröße: ${this.scene.scale.width}x${this.scene.scale.height}`);
    
    // Direktes Erstellen des Bosses, um mehr Kontrolle zu haben
    const boss = new BossEnemy(this.scene, x, y, this.player);
    this.bossActive = true;
    console.log(`[ENEMY_MANAGER] *** BOSS SPAWNED *** mit ${boss.getHealth()} HP`);
    console.log(`[ENEMY_MANAGER] BossActive-Flag gesetzt auf ${this.bossActive}`);
    
    // Manuell den aktuellen Schwierigkeitsgrad setzen
    if (this.difficulty > 1) {
      console.log(`[ENEMY_MANAGER] Wende Schwierigkeitsanpassung auf Boss an: Stufe ${this.difficulty}, Faktor ${(1.0 + (this.difficulty - 1) * 0.1).toFixed(2)}`);
      boss.applyDifficulty({
        difficulty: this.difficulty,
        factor: 1.0 + (this.difficulty - 1) * 0.1
      });
      console.log(`[ENEMY_MANAGER] Nach Schwierigkeitsanpassung: ${boss.getHealth()} HP`);
    }
    
    // Boss-Spawned-Event auslösen
    this.eventBus.emit(EventType.BOSS_SPAWNED, boss);
    
    this.enemies.push(boss);
    console.log(`[ENEMY_MANAGER] Boss zur Liste hinzugefügt. Aktuelle Anzahl: ${this.enemies.length}`);
  }
  
  /**
   * Aktualisiert alle Gegner
   */
  public update(time: number, delta: number): void {
    if (this.isPaused) return;
    
    // Prüfe Boss-Status alle 5 Sekunden
    if (time % 5000 < 20) {
      let bossFound = false;
      
      // Suche nach aktiven Bosse
      for (const enemy of this.enemies) {
        if (enemy instanceof BossEnemy && enemy.getSprite().active) {
          bossFound = true;
          console.log(`[ENEMY_MANAGER] Boss-Check: Boss aktiv bei Position (${enemy.getSprite().x}, ${enemy.getSprite().y})`);
          break;
        }
      }
      
      // Wenn bossActive gesetzt ist, aber kein Boss gefunden wurde, korrigiere den Status
      if (this.bossActive && !bossFound) {
        console.log(`[ENEMY_MANAGER] Boss-Check: Boss-Flag war true, aber kein aktiver Boss gefunden. Zurücksetzen auf false.`);
        this.bossActive = false;
      }
      
      // Prüfe auf verwaiste Debug-Texte alle 5 Sekunden
      this.cleanupOrphanedDebugTexts();
    }
    
    // Zähle Debug-Texte in der Szene
    const allTexts = this.scene.children.list.filter(obj => obj.type === 'Text');
    const debugTexts = allTexts.filter(text => (text as Phaser.GameObjects.Text).text && ['StandardEnemy', 'AdvancedEnemy', 'EliteEnemy', 'BossEnemy', 'TurretEnemy'].some(name => (text as Phaser.GameObjects.Text).text.includes(name)));
    
    //console.log(`[DEBUG-COUNT] Aktuelle Gegner: ${this.enemies.length}, Debug-Texte in der Szene: ${debugTexts.length}`);
    
    // Gegner aktualisieren und zerstörte Gegner entfernen
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Überprüfe, ob der Gegner oder sein Sprite nicht mehr existiert oder zerstört wurde
      if (!enemy || enemy.isDestroyed || !enemy.getSprite() || !enemy.getSprite().active) {
        console.log(`[DEBUG-ENEMY] Entferne Gegner ${enemy ? enemy.constructor.name : 'unbekannt'} #${i} aus dem Array`);
        console.log(`[DEBUG-ENEMY] Gegner-Zustand: existiert=${!!enemy}, isDestroyed=${enemy ? enemy.isDestroyed : 'N/A'}, Sprite existiert=${enemy ? !!enemy.getSprite() : 'N/A'}, Sprite aktiv=${enemy && enemy.getSprite() ? enemy.getSprite().active : 'N/A'}`);
        
        // Wenn ein Boss zerstört wird, setze bossActive zurück
        if (enemy instanceof BossEnemy) {
          console.log(`[ENEMY_MANAGER] Boss inactive oder zerstört, wird aus der Liste entfernt. Flag zurückgesetzt.`);
          this.bossActive = false;
        }
        
        // Rufe explizit destroy auf, falls das noch nicht geschehen ist
        if (enemy && !enemy.isDestroyed) {
          console.log(`[DEBUG-ENEMY] Rufe destroy() für Gegner auf`);
          enemy.destroy();
        } else {
          console.log(`[DEBUG-ENEMY] Gegner bereits zerstört, überspringe destroy() Aufruf`);
        }
        
        // Entferne zerstörte Gegner aus dem Array
        this.enemies.splice(i, 1);
        console.log(`[DEBUG-ENEMY] Gegner aus Array entfernt, neue Länge: ${this.enemies.length}`);
        continue;
      }
      
      // Überprüfe, ob der Gegner ein Boss ist und außerhalb des sichtbaren Bereichs
      if (enemy instanceof BossEnemy && 
          (enemy.getSprite().x < -100 || 
           enemy.getSprite().x > this.scene.scale.width + 100 || 
           enemy.getSprite().y < -100 || 
           enemy.getSprite().y > this.scene.scale.height + 100)) {
        console.log(`[ENEMY_MANAGER] Boss außerhalb des Bildschirms bei (${enemy.getSprite().x}, ${enemy.getSprite().y}), wird entfernt.`);
        enemy.destroy();
        this.enemies.splice(i, 1);
        this.bossActive = false;
        continue;
      }
      
      // Aktualisiere aktive Gegner
      enemy.update(time, delta);
    }
    
    // Aktualisiere alle Projektile
    this.updateBullets();
  }
  
  /**
   * Aktualisiert alle Projektile
   */
  private updateBullets(): void {
    const bullets = this.allEnemyBullets.getChildren();
    
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i] as Phaser.Physics.Arcade.Sprite;
      
      if (!bullet.active) continue;
      
      // Prüfe, ob das Projektil den Bildschirm verlassen hat
      if (bullet.x < -50 || 
          bullet.x > this.scene.scale.width + 50 || 
          bullet.y < -50 || 
          bullet.y > this.scene.scale.height + 50) {
        bullet.setActive(false);
        bullet.setVisible(false);
        this.allEnemyBullets.remove(bullet, true, true);
      }
    }
  }
  
  /**
   * Registriert ein Projektil im zentralen Manager
   */
  private registerEnemyBullet = (bullet: Phaser.Physics.Arcade.Sprite): void => {
    if (!bullet.active) return;
    
    // Stelle sicher, dass das Projektil in der zentralen Gruppe ist
    if (!this.allEnemyBullets.contains(bullet)) {
      this.allEnemyBullets.add(bullet);
    }
  }
  
  /**
   * Reagiert auf Änderungen des Schwierigkeitsgrads
   */
  private onDifficultyChanged = (data: any): void => {
    const newDifficulty = typeof data === 'object' ? data.difficulty : data;
    this.difficulty = newDifficulty;
    
    // Passe Spawn-Wahrscheinlichkeiten an
    this.adjustSpawnRates();
    
    // Informiere alle aktiven Gegner über die Schwierigkeitsänderung
    this.enemies.forEach(enemy => {
      enemy.applyDifficulty({
        difficulty: newDifficulty,
        factor: 1.0 + (newDifficulty - 1) * 0.1
      });
    });
  }
  
  /**
   * Aktualisiert die Spawn-Raten basierend auf dem Schwierigkeitsgrad
   */
  private adjustSpawnRates(): void {
    console.log(`[ENEMY_MANAGER] Passe Spawn-Raten für Schwierigkeitsgrad ${this.difficulty} an`);
  
    // Basis-Spawn-Chance für jeden Gegnertyp
    switch (this.difficulty) {
      case 1:
        this.enemySpawnChance.standard = 0.1;
        this.enemySpawnChance.advanced = 0.0;
        this.enemySpawnChance.elite = 0.0;
        this.enemySpawnChance.turret = 0.9;
        break;
      case 2:
        this.enemySpawnChance.standard = 0.1;
        this.enemySpawnChance.advanced = 0.0;
        this.enemySpawnChance.elite = 0.0;
        this.enemySpawnChance.turret = 0.9;
        break;
      case 3:
        this.enemySpawnChance.standard = 0.1;
        this.enemySpawnChance.advanced = 0.0;
        this.enemySpawnChance.elite = 0.0;
        this.enemySpawnChance.turret = 0.9;
        break;
      case 4:
        this.enemySpawnChance.standard = 0.1;
        this.enemySpawnChance.advanced = 0.0;
        this.enemySpawnChance.elite = 0.0;
        this.enemySpawnChance.turret = 0.9;
        break;
      case 5:
        this.enemySpawnChance.standard = 0.1;
        this.enemySpawnChance.advanced = 0.0;
        this.enemySpawnChance.elite = 0.0;
        this.enemySpawnChance.turret = 0.9;
        break;
      default:
        // Ab Stufe 6
        this.enemySpawnChance.standard = 0.1;
        this.enemySpawnChance.advanced = 0.0;
        this.enemySpawnChance.elite = 0.0;
        this.enemySpawnChance.turret = 0.9;
    }
    
    // Maximale Anzahl von Gegnern anpassen
    this.maxEnemies = 15 + Math.min(10, this.difficulty * 2);
    
    console.log(`[ENEMY_MANAGER] Neue Spawn-Raten: Standard=${this.enemySpawnChance.standard.toFixed(2)}, Advanced=${this.enemySpawnChance.advanced.toFixed(2)}, Elite=${this.enemySpawnChance.elite.toFixed(2)}, Turret=${this.enemySpawnChance.turret.toFixed(2)}`);
    console.log(`[ENEMY_MANAGER] Neue maximale Gegnerzahl: ${this.maxEnemies}`);
    
    // Timer-Intervall anpassen
    const newSpawnRate = Math.max(Constants.SPAWN_RATE_ENEMY - (this.difficulty * 100), 800);
    if (this.enemySpawnTimer) {
      // Timer neu erstellen statt delay-Eigenschaft direkt zu ändern
      this.enemySpawnTimer.remove();
      this.enemySpawnTimer = this.scene.time.addEvent({
        delay: newSpawnRate,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true
      });
      console.log(`[ENEMY_MANAGER] Neues Spawn-Intervall: ${newSpawnRate}ms (Timer neu erstellt)`);
    }
  }
  
  /**
   * Callback für Boss-Zerstört-Event
   */
  private onBossDestroyed = (): void => {
    console.log(`[ENEMY_MANAGER] Boss wurde zerstört`);
    this.bossActive = false;
    console.log(`[ENEMY_MANAGER] BossActive-Flag zurückgesetzt auf ${this.bossActive}`);
  }
  
  /**
   * Pausiert das Spawnen von Gegnern
   */
  private pauseSpawning = (): void => {
    this.isPaused = true;
    
    // Timer pausieren
    this.enemySpawnTimer.paused = true;
    this.bossSpawnTimer.paused = true;
  }
  
  /**
   * Setzt das Spawnen von Gegnern fort
   */
  private resumeSpawning = (): void => {
    this.isPaused = false;
    
    // Timer fortsetzen
    this.enemySpawnTimer.paused = false;
    this.bossSpawnTimer.paused = false;
  }
  
  /**
   * Stoppt das Spawnen von Gegnern
   */
  private stopSpawning = (): void => {
    this.isPaused = true;
    
    // Timer entfernen
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.remove();
    }
    
    if (this.bossSpawnTimer) {
      this.bossSpawnTimer.remove();
    }
  }
  
  /**
   * Zerstört alle Gegner
   */
  public destroyAllEnemies(): void {
    console.log(`[DEBUG-DESTROY-ALL] Zerstöre alle ${this.enemies.length} Gegner`);
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      console.log(`[DEBUG-DESTROY-ALL] Zerstöre Gegner #${i}: ${enemy.constructor.name}`);
      enemy.destroy();
    }
    this.enemies = [];
    
    // Säubere alle übrig gebliebenen Debug-Texte
    console.log(`[DEBUG-DESTROY-ALL] Suche nach verbliebenen Debug-Texten...`);
    this.cleanupOrphanedDebugTexts();
    
    // Zusätzlicher Schritt: Entferne ALLE Debug-Texte unabhängig von der Zuordnung
    const allTextObjects = this.scene.children.list.filter(obj => {
      if (obj.type !== 'Text') return false;
      const text = obj as Phaser.GameObjects.Text;
      return text.text && ['StandardEnemy', 'AdvancedEnemy', 'EliteEnemy', 'BossEnemy', 'TurretEnemy'].some(
        name => text.text.includes(name)
      );
    }) as Phaser.GameObjects.Text[];
    
    console.log(`[DEBUG-DESTROY-ALL] Entferne aggressiv alle ${allTextObjects.length} verbliebenen Debug-Texte`);
    allTextObjects.forEach(text => text.destroy());
  }
  
  /**
   * Gibt die Bullets-Gruppe zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.allEnemyBullets;
  }
  
  /**
   * Zerstört einen Gegner basierend auf dem Sprite
   */
  public destroyEnemy(enemySprite: Phaser.GameObjects.GameObject): void {
    const instance = enemySprite.getData('instance') as BaseEnemy;
    
    if (instance) {
      // Versuche, den Gegner im Array zu finden
      const index = this.enemies.findIndex(enemy => enemy === instance);
      
      if (index !== -1) {
        // Entferne den Gegner aus dem Array
        this.enemies.splice(index, 1);
      }
      
      // Zerstöre den Gegner
      instance.destroy();
    }
  }
  
  /**
   * Gibt alle Gegner zurück
   */
  public getAllEnemies(): BaseEnemy[] {
    return this.enemies;
  }
  
  /**
   * Gibt die Anzahl der aktiven Gegner zurück
   */
  public getEnemyCount(): number {
    return this.enemies.length;
  }
  
  /**
   * Bereinigt alle Ressourcen beim Beenden
   */
  public destroy(): void {
    // Entferne Event-Listener
    this.eventBus.off(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);
    this.eventBus.off(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.off(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.off(EventType.GAME_OVER, this.stopSpawning);
    this.eventBus.off('REGISTER_ENEMY_BULLET', this.registerEnemyBullet);
    this.eventBus.off('BOSS_DESTROYED', this.onBossDestroyed);
    this.eventBus.off(EventType.DEBUG_TOGGLED, this.onDebugModeChanged);
    
    // Zerstöre Timer
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.remove();
    }
    
    if (this.bossSpawnTimer) {
      this.bossSpawnTimer.remove();
    }
    
    // Zerstöre alle Gegner
    this.destroyAllEnemies();
    
    // Bereinige Bullet-Gruppe
    this.allEnemyBullets.clear(true, true);
  }
  
  /**
   * Sucht und entfernt verwaiste Debug-Texte
   */
  private cleanupOrphanedDebugTexts(): void {
    // Finde alle Text-Objekte in der Szene
    const allGameObjects = this.scene.children.list;
    
    // Finde alle Debug-Text-Objekte für Gegner
    const enemyTextObjects = allGameObjects.filter(obj => {
      if (obj.type !== 'Text') return false;
      
      const text = obj as Phaser.GameObjects.Text;
      // Prüfe, ob der Text ein Gegner-Debug-Text ist
      return text.text && ['StandardEnemy', 'AdvancedEnemy', 'EliteEnemy', 'BossEnemy', 'TurretEnemy'].some(
        name => text.text.includes(name)
      );
    }) as Phaser.GameObjects.Text[];
    
    if (enemyTextObjects.length === 0) return;
    
    console.log(`[DEBUG-CLEANUP] Gefundene Debug-Texte: ${enemyTextObjects.length}`);
    
    // Erstelle eine Liste aller bekannten aktiven Gegner
    const activeEnemyIds = this.enemies.map(enemy => enemy.getSprite().getData('instance'));
    
    // Entferne Texte, deren zugehörige Gegner nicht mehr existieren
    for (const textObj of enemyTextObjects) {
      const enemyId = textObj.getData('enemyId');
      
      // Wenn der Text keinen Gegner hat oder der Gegner nicht mehr aktiv ist
      if (!enemyId || !activeEnemyIds.includes(enemyId)) {
        console.log(`[DEBUG-CLEANUP] Entferne verwaisten Debug-Text "${textObj.text}" bei (${textObj.x}, ${textObj.y})`);
        textObj.destroy();
      }
    }
  }
  
  /**
   * Handler für Änderungen des Debug-Modus
   */
  private onDebugModeChanged = (mode: DebugMode): void => {
    console.log(`[ENEMY_MANAGER] Debug-Modus geändert zu: ${mode}`);
    this.currentDebugMode = mode;
    
    // Aktualisiere Debug-Text-Sichtbarkeit für alle Gegner
    this.updateAllEnemyDebugTexts();
  }
  
  /**
   * Aktualisiert die Sichtbarkeit aller Gegner-Debug-Texte
   */
  private updateAllEnemyDebugTexts(): void {
    // Finde alle Text-Objekte in der Szene, die Debug-Texte von Gegnern sind
    const allGameObjects = this.scene.children.list;
    
    // Finde alle Debug-Text-Objekte für Gegner
    const enemyTextObjects = allGameObjects.filter(obj => {
      if (obj.type !== 'Text') return false;
      
      const text = obj as Phaser.GameObjects.Text;
      // Prüfe, ob der Text ein Gegner-Debug-Text ist
      return text.text && ['StandardEnemy', 'AdvancedEnemy', 'EliteEnemy', 'BossEnemy', 'TurretEnemy'].some(
        name => text.text.includes(name)
      );
    }) as Phaser.GameObjects.Text[];
    
    // Setze Sichtbarkeit basierend auf Debug-Modus
    const isVisible = this.currentDebugMode === DebugMode.LIGHT || this.currentDebugMode === DebugMode.FULL;
    
    console.log(`[ENEMY_MANAGER] Setze Sichtbarkeit von ${enemyTextObjects.length} Debug-Texten auf ${isVisible}`);
    
    enemyTextObjects.forEach(text => {
      text.setVisible(isVisible);
    });
  }
} 