import { BasicEnemy } from '../entities/enemies/basicEnemy';
import { BossEnemy } from '../entities/enemies/bossEnemy';
import { Constants } from '../utils/constants';
import { Player } from '../entities/player/player';
import { EventBus, EventType } from '../utils/eventBus';

/**
 * EnemyManager-Klasse
 * Verwaltet die Erstellung, Aktualisierung und Zerstörung von Feinden
 */
export class EnemyManager {
  private scene: Phaser.Scene;
  private player: Player;
  private basicEnemies: BasicEnemy[] = [];
  private bossEnemies: BossEnemy[] = [];
  private enemySpawnTimer: Phaser.Time.TimerEvent;
  private bossSpawnTimer: Phaser.Time.TimerEvent;
  private difficulty: number = 1;
  private eventBus: EventBus;
  private isPaused: boolean = false;
  private lastUpdateTime: number = 0;
  private maxBasicEnemies: number = 15; // Begrenze die Anzahl der Standardfeinde
  // Zentrale Verwaltung aller feindlichen Projektile
  private allEnemyBullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.eventBus = EventBus.getInstance();

    // Zentrale Gruppe für alle Projektile erstellen
    this.allEnemyBullets = this.scene.physics.add.group({
      defaultKey: Constants.ASSET_ENEMY_BULLET,
      maxSize: 200,
      active: false,
      visible: false
    });

    // Event-Listener registrieren
    this.eventBus.on(EventType.DIFFICULTY_CHANGED, this.onDifficultyIncrease);
    this.eventBus.on(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.on(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.on(EventType.GAME_OVER, this.stopSpawning);

    // Starte Spawn-Timer
    this.startSpawnTimers();
  }

  /**
   * Gibt die zentrale Projektilgruppe zurück, die von allen Feinden verwendet wird
   */
  public getEnemyBulletGroup(): Phaser.Physics.Arcade.Group {
    return this.allEnemyBullets;
  }

  /**
   * Registriert ein neues feindliches Projektil in der zentralen Verwaltung
   * Diese Methode wird von Feinden aufgerufen, wenn sie ein Projektil erstellen
   */
  public registerEnemyBullet(bullet: Phaser.Physics.Arcade.Sprite): void {
    if (!bullet.active) return;
    
    // Stelle sicher, dass das Projektil in der zentralen Gruppe ist
    if (!this.allEnemyBullets.contains(bullet)) {
      this.allEnemyBullets.add(bullet);
    }
  }

  /**
   * Startet die Spawn-Timer
   */
  private startSpawnTimers(): void {
    // Timer für normale Feinde
    this.enemySpawnTimer = this.scene.time.addEvent({
      delay: Constants.SPAWN_RATE_ENEMY,
      callback: this.spawnBasicEnemy,
      callbackScope: this,
      loop: true
    });

    // Timer für Bosse
    this.bossSpawnTimer = this.scene.time.addEvent({
      delay: Constants.SPAWN_RATE_BOSS,
      callback: this.spawnBossEnemy,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Spawnt einen StandardFeind
   */
  private spawnBasicEnemy = (): void => {
    if (this.isPaused) return;
    
    // Begrenze die Anzahl der Feinde für bessere Performance
    if (this.basicEnemies.length >= this.maxBasicEnemies) return;
    
    const x = this.scene.scale.width + 50;
    const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
    const enemy = new BasicEnemy(this.scene, x, y, this.player);
    
    // Manuell den aktuellen Schwierigkeitsgrad setzen, damit neue Gegner sofort angepasst werden
    if (this.difficulty > 1) {
      // Event manuell auslösen für den neuen Gegner, um aktuelle Schwierigkeit zu übernehmen
      enemy.applyDifficulty({
        difficulty: this.difficulty,
        factor: 1.0 + (this.difficulty - 1) * 0.1 + Math.pow(this.difficulty - 1, 1.5) * 0.01
      });
    }
    
    this.basicEnemies.push(enemy);
  }

  /**
   * Spawnt einen Bossgegner
   */
  private spawnBossEnemy = (): void => {
    if (this.isPaused || this.difficulty < 2) return;
    
    // Maximal ein Boss gleichzeitig für bessere Performance
    if (this.bossEnemies.length > 0) return;
    
    // Bosse erst ab Schwierigkeitsgrad 2 spawnen
    const x = this.scene.scale.width + 100;
    
    // Zufällige Y-Position für den Boss im sichtbaren Bereich
    // Mindestens 150px vom Rand entfernt, damit der Boss vollständig sichtbar ist
    const minY = 150;
    const maxY = this.scene.scale.height - 150;
    const y = minY + Math.random() * (maxY - minY);
    
    const boss = new BossEnemy(this.scene, x, y, this.player);
    
    // Manuell den aktuellen Schwierigkeitsgrad setzen, damit neue Bosse sofort angepasst werden
    if (this.difficulty > 1) {
      // Event manuell auslösen für den neuen Boss, um aktuelle Schwierigkeit zu übernehmen
      boss.applyDifficulty({
        difficulty: this.difficulty,
        factor: 1.0 + (this.difficulty - 1) * 0.1 + Math.pow(this.difficulty - 1, 1.5) * 0.01
      });
    }
    
    this.bossEnemies.push(boss);
    
    // Event ausgeben
    this.eventBus.emit(EventType.BOSS_DESTROYED, boss);
  }

  /**
   * Aktualisiert alle Feinde
   */
  public update(time: number, delta: number): void {
    if (this.isPaused) return;
    
    // Immer alle Frames verarbeiten für maximale Flüssigkeit
    
    // Aktualisiere normale Feinde
    for (let i = this.basicEnemies.length - 1; i >= 0; i--) {
      const enemy = this.basicEnemies[i];
      
      // Prüfe, ob der Feind noch aktiv ist
      if (enemy.getSprite().active) {
        enemy.update(time, delta);
        
        // Entferne Feinde, die den Bildschirm verlassen haben
        if (enemy.getSprite().x < -50) {
          enemy.destroy();
          this.basicEnemies.splice(i, 1);
        }
      } else {
        // Entferne zerstörte Feinde aus dem Array
        this.basicEnemies.splice(i, 1);
      }
    }
    
    // Aktualisiere Bosse
    for (let i = this.bossEnemies.length - 1; i >= 0; i--) {
      const boss = this.bossEnemies[i];
      
      if (boss.getSprite().active) {
        boss.update(time, delta);
        
        // Entferne Bosse, die den Bildschirm verlassen haben
        if (boss.getSprite().x < -100) {
          boss.destroy();
          this.bossEnemies.splice(i, 1);
        }
      } else {
        // Entferne zerstörte Bosse aus dem Array
        this.bossEnemies.splice(i, 1);
      }
    }
    
    // Aktualisiere alle Projektile
    this.updateBullets();
  }
  
  /**
   * Aktualisiert alle Projektile in der zentralen Verwaltung
   * - Entfernt Projektile, die den Bildschirm verlassen haben
   * - Stellt sicher, dass alle Projektile nur horizontal fliegen
   */
  private updateBullets(): void {
    // Es ist wichtig, rückwärts durch die Kinder zu iterieren, wenn wir Elemente entfernen
    const bullets = this.allEnemyBullets.getChildren();
    
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i] as Phaser.Physics.Arcade.Sprite;
      
      if (!bullet.active) continue;
      
      // Prüfe, ob das Projektil den Bildschirm verlassen hat
      if (bullet.x < -50) {
        bullet.setActive(false);
        bullet.setVisible(false);
        this.allEnemyBullets.remove(bullet, true, true);
        continue;
      }
      
      // Korrigiere die Geschwindigkeit - nur horizontale Bewegung erlauben
      // Wenn das Bullet y-Geschwindigkeit hat, setzen wir diese auf 0,
      // behalten aber die x-Geschwindigkeit bei (wichtig für schnellere Projektile)
      if (bullet.body && bullet.body.velocity.y !== 0) {
        const xVelocity = bullet.body.velocity.x;
        bullet.setVelocity(xVelocity, 0);
      }
      
      // Stelle sicher, dass das Bullet nach links fliegt, falls es stehengeblieben ist
      // Setze in diesem Fall eine angemessene Geschwindigkeit
      if (bullet.body && Math.abs(bullet.body.velocity.x) < 10) {
        // Verwende eine moderat erhöhte Geschwindigkeit
        const enhancedSpeed = Constants.ENEMY_BULLET_SPEED * 1.2;
        bullet.setVelocityX(-enhancedSpeed);
      }
    }
  }

  /**
   * Reagiert auf Erhöhung des Schwierigkeitsgrads
   */
  private onDifficultyIncrease = (data: any): void => {
    const newDifficulty = typeof data === 'object' ? data.difficulty : data;
    const difficultyFactor = typeof data === 'object' ? data.factor : 1.0 + (newDifficulty - 1) * 0.1;
    
    this.difficulty = newDifficulty;
    
    // Erhöhe die maximale Anzahl der Feinde abhängig vom Schwierigkeitsgrad
    this.maxBasicEnemies = Math.min(30, 10 + Math.floor(newDifficulty * 1.5));
    
    // Erhöhe die Spawn-Rate für normale Feinde
    // Stärkere Skalierung mit exponentieller Abnahme der Spawn-Zeit
    const newBasicEnemyRate = Math.max(500, Constants.SPAWN_RATE_ENEMY * Math.pow(0.82, newDifficulty - 1));
    this.enemySpawnTimer.reset({
      delay: newBasicEnemyRate,
      callback: this.spawnBasicEnemy,
      callbackScope: this,
      loop: true
    });
    
    // Erhöhe die Boss-Spawn-Rate ab Schwierigkeitsgrad 3
    if (newDifficulty >= 3) {
      // Boss-Spawn wird mit höherem Level häufiger
      const newBossRate = Math.max(3000, Constants.SPAWN_RATE_BOSS * Math.pow(0.85, newDifficulty - 1));
      this.bossSpawnTimer.reset({
        delay: newBossRate,
        callback: this.spawnBossEnemy,
        callbackScope: this,
        loop: true
      });
    }
    
    // Bei bestimmten Schwierigkeitsgraden spawne sofort einen Boss als Herausforderung
    if (newDifficulty % 5 === 0 && newDifficulty > 0) {
      // Verzögerte Boss-Spawn nach Level-Up-Meldung
      this.scene.time.delayedCall(2500, () => {
        // Spawne 1-3 Bosse bei höheren Leveln
        const bossCount = Math.min(3, Math.ceil(newDifficulty / 10));
        for (let i = 0; i < bossCount; i++) {
          this.scene.time.delayedCall(i * 1500, () => {
            this.spawnBossEnemy();
          });
        }
      });
    }
  }

  /**
   * Pausiert das Spawnen von Feinden
   */
  private pauseSpawning = (): void => {
    this.isPaused = true;
    this.enemySpawnTimer.paused = true;
    this.bossSpawnTimer.paused = true;
  }

  /**
   * Setzt das Spawnen von Feinden fort
   */
  private resumeSpawning = (): void => {
    this.isPaused = false;
    this.enemySpawnTimer.paused = false;
    this.bossSpawnTimer.paused = false;
  }

  /**
   * Stoppt das Spawnen von Feinden
   */
  private stopSpawning = (): void => {
    this.isPaused = true;
    this.enemySpawnTimer.remove();
    this.bossSpawnTimer.remove();
  }

  /**
   * Zerstört alle Feinde
   */
  public destroyAllEnemies(): void {
    // Zerstöre alle normalen Feinde
    for (const enemy of this.basicEnemies) {
      enemy.destroy();
    }
    this.basicEnemies = [];
    
    // Zerstöre alle Bosse
    for (const boss of this.bossEnemies) {
      boss.destroy();
    }
    this.bossEnemies = [];
  }

  /**
   * Gibt alle aktuellen Feinde zurück
   */
  public getAllEnemies(): (BasicEnemy | BossEnemy)[] {
    return [...this.basicEnemies, ...this.bossEnemies];
  }

  /**
   * Gibt alle Bullets der Feinde zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    // Verwende die zentrale Gruppe, die alle Projektile enthält, auch von zerstörten Feinden
    return this.allEnemyBullets;
  }

  /**
   * Zerstört einen bestimmten Feind
   */
  public destroyEnemy(enemySprite: Phaser.GameObjects.GameObject): void {
    console.log('EnemyManager: destroyEnemy aufgerufen');
    
    // Suche nach dem Feind in der Liste der normalen Feinde
    for (let i = 0; i < this.basicEnemies.length; i++) {
      if (this.basicEnemies[i].getSprite() === enemySprite) {
        console.log('EnemyManager: Normaler Feind gefunden, wird zerstört');
        this.basicEnemies[i].destroy();
        this.basicEnemies.splice(i, 1);
        return;
      }
    }
    
    // Suche nach dem Feind in der Liste der Bosse
    for (let i = 0; i < this.bossEnemies.length; i++) {
      if (this.bossEnemies[i].getSprite() === enemySprite) {
        console.log('EnemyManager: Boss gefunden, wird zerstört');
        this.bossEnemies[i].destroy();
        this.bossEnemies.splice(i, 1);
        return;
      }
    }
    
    console.log('EnemyManager: Kein passender Feind gefunden');
  }

  /**
   * Bereinigt alle Ressourcen
   */
  public destroy(): void {
    // Entferne Event-Listener
    this.eventBus.off(EventType.DIFFICULTY_CHANGED, this.onDifficultyIncrease);
    this.eventBus.off(EventType.PAUSE_GAME, this.pauseSpawning);
    this.eventBus.off(EventType.RESUME_GAME, this.resumeSpawning);
    this.eventBus.off(EventType.GAME_OVER, this.stopSpawning);
    
    // Stoppe Timer
    if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
    if (this.bossSpawnTimer) this.bossSpawnTimer.remove();
    
    // Zerstöre alle Feinde
    this.destroyAllEnemies();
    
    // Entferne alle Projektile
    if (this.allEnemyBullets) {
      this.allEnemyBullets.clear(true, true);
    }
  }
} 