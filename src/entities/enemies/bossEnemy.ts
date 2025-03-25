import { Enemy } from './enemy';
import { Constants } from '../../utils/constants';
import { Player } from '../player/player';
import { GameObject } from '../gameObject';
import { EventBus, EventType } from '../../utils/eventBus';

/**
 * Boss-Feind-Klasse
 */
export class BossEnemy extends Enemy {
  private player: Player;
  private movePhase: number = 0;
  private moveTimer: number = 0;
  private PHASE_DURATION: number = 2000; // Kürzere Phasen für aggressiveres Verhalten
  private readonly ATTACK_PATTERNS: string[] = ['dual', 'tripple', 'wave'];
  private currentPattern: string = 'dual';
  private patternTimer: number = 0;
  private PATTERN_CHANGE_TIME: number = 3000; // Häufigerer Wechsel der Angriffsmuster
  private difficultyLevel: number = 1;
  private difficultyFactor: number = 1.0;
  private targetY: number = 0;
  private velocityFactor: number = 1.0;
  private chargeAttackTimer: number = 0;
  private isCharging: boolean = false;
  private lastPlayerX: number = 0;
  private lastPlayerY: number = 0;
  private bulletGroup: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super(
      scene,
      x,
      y,
      Constants.ASSET_BOSS,
      Constants.BOSS_HEALTH * 5, // Stark erhöhte Gesundheit (vorher *2)
      Constants.BOSS_SPEED * 1.2, // Etwas schneller
      Constants.BOSS_SCORE,
      1200 // Schnellere Feuerrate
    );
    
    this.player = player;
    this.lastPlayerX = player.getSprite().x;
    this.lastPlayerY = player.getSprite().y;
    this.targetY = y;
    
    // Erstelle eine Kugel-Gruppe für bessere Performance
    this.bulletGroup = this.scene.physics.add.group({
      defaultKey: Constants.ASSET_ENEMY_BULLET,
      maxSize: 50,
      active: false,
      visible: false
    });
    
    // Setze Boss-spezifische Eigenschaften
    this.sprite.setScale(3.5); // Größer und bedrohlicher
    this.sprite.setFlipX(true); // Horizontale Drehung, damit der Boss nach links schaut
    this.sprite.setTint(0xff0000); // Rote Färbung um Boss zu markieren
    
    // Spezielle Daten für den Boss
    this.sprite.setData('type', 'boss');
    
    // Ereignislistener für Schwierigkeitsänderung hinzufügen
    this.eventBus.on(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);
    
    // Starte den Boss mit einem zufälligen Angriffsmuster
    this.currentPattern = this.ATTACK_PATTERNS[Math.floor(Math.random() * this.ATTACK_PATTERNS.length)];
    
    // Visuelle Effekte hinzufügen
    this.addGlowEffect();
  }

  /**
   * Fügt einen pulsierenden Glüheffekt zum Boss hinzu
   */
  private addGlowEffect(): void {
    // Pulsierender Glüheffekt
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.8,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Leichtes Skalieren für "Atmen"-Effekt
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 3.7,
      scaleY: 3.7,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Behandelt Schwierigkeitsänderungen
   */
  private onDifficultyChanged = (data: any): void => {
    const newDifficulty = typeof data === 'object' ? data.difficulty : data;
    const difficultyFactor = typeof data === 'object' ? data.factor : 1.0 + (newDifficulty - 1) * 0.1;
    
    this.difficultyLevel = newDifficulty;
    this.difficultyFactor = difficultyFactor;
    
    // Aggressivere Skalierung für Boss-Eigenschaften
    this.speed = Constants.BOSS_SPEED * (1.2 + difficultyFactor * 0.3);
    this.fireRate = Math.max(400, 1200 - (newDifficulty - 1) * 100);
    
    // Erhöhe die Gesundheit des Bosses basierend auf dem Schwierigkeitsgrad
    this.health = Constants.BOSS_HEALTH * (5 + difficultyFactor * 1.0); // Stark erhöhte Gesundheit
    
    // Reduziere die Phasenintervalle, um Bosse aggressiver zu machen
    this.PHASE_DURATION = Math.max(1000, 2000 - (newDifficulty - 1) * 150);
    this.PATTERN_CHANGE_TIME = Math.max(1500, 3000 - (newDifficulty - 1) * 200);
    
    // Erhöhe die allgemeine Geschwindigkeit mit dem Schwierigkeitsgrad
    this.velocityFactor = 1.0 + (newDifficulty - 1) * 0.15;
    
    // Tinte den Boss bei höheren Schwierigkeitsgraden intensiver rot
    const intensity = Math.min(255, 200 + newDifficulty * 5);
    this.sprite.setTint(Phaser.Display.Color.GetColor(intensity, 0, 0));
  }

  /**
   * Setzt die Schwierigkeit direkt für den Boss
   * Wird beim Spawnen neuer Bosse mit dem aktuellen Schwierigkeitsgrad aufgerufen
   */
  public applyDifficulty(data: any): void {
    this.onDifficultyChanged(data);
  }

  /**
   * Bewegung des Bosses
   */
  protected move(time: number, delta: number): void {
    const normalizedDelta = delta / 16.666;
    
    // Spieler-Position verfolgen für gezielte Angriffe
    const playerSprite = this.player.getSprite();
    const diffX = playerSprite.x - this.sprite.x;
    const diffY = playerSprite.y - this.sprite.y;
    
    // Speichern der letzten bekannten Spielerposition für Zielvorhersage
    this.lastPlayerX = playerSprite.x;
    this.lastPlayerY = playerSprite.y;
    
    // Vorausschauender Sturmangriff
    this.chargeAttackTimer += delta;
    if (this.chargeAttackTimer > 5000 + Math.random() * 3000) { // Alle 5-8 Sekunden
        this.chargeAttackTimer = 0;
        this.isCharging = true;
        // Kamera-Shake als Warnung entfernt
        
        // Farbanimation zur Warnung
        this.scene.tweens.add({
            targets: this.sprite,
            tint: 0xffff00, // Gelb als Warnung
            duration: 300,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // Setze die Tinte zurück
                const intensity = Math.min(255, 200 + this.difficultyLevel * 5);
                this.sprite.setTint(Phaser.Display.Color.GetColor(intensity, 0, 0));
            }
        });
    }
    
    // Wechselt die Bewegungsphase alle PHASE_DURATION ms
    if (!this.isCharging) {
        this.moveTimer += delta;
        if (this.moveTimer >= this.PHASE_DURATION) {
            this.moveTimer = 0;
            this.movePhase = (this.movePhase + 1) % 5; // 5 verschiedene Phasen
            
            // Setze neues Ziel für sanfte Bewegung
            this.targetY = Phaser.Math.Between(100, this.scene.scale.height - 100);
        }
    }
    
    // Verschiedene Bewegungsmuster basierend auf der Phase
    let velocityX = 0;
    let velocityY = 0;
    
    if (this.isCharging) {
        // Aggressiver Sturzangriff auf den Spieler
        velocityX = Math.sign(diffX) * this.speed * 2.5 * this.velocityFactor;
        velocityY = Math.sign(diffY) * this.speed * 1.5 * this.velocityFactor;
        
        // Beende den Sturmangriff nach einer Sekunde
        if (this.chargeAttackTimer > 1000) {
            this.isCharging = false;
        }
    } else {
        switch (this.movePhase) {
            case 0: // Aggressiv zum Spieler hin bewegen
                velocityX = Math.sign(diffX) * this.speed * 0.8 * this.velocityFactor;
                velocityY = Math.sign(diffY) * this.speed * 0.8 * this.velocityFactor;
                break;
            case 1: // Horizontale Bewegung mit Verfolgung
                velocityX = (diffX > 0 ? 1 : -1) * this.speed * 0.7 * this.velocityFactor;
                velocityY = (this.targetY - this.sprite.y) * 0.05 * this.velocityFactor;
                break;
            case 2: // Kreisförmige Bewegung um den Spieler
                const angle = time * 0.001 * this.velocityFactor;
                const radius = 150 * this.velocityFactor;
                const targetX = playerSprite.x - radius * Math.cos(angle);
                const targetY = playerSprite.y - radius * Math.sin(angle);
                velocityX = (targetX - this.sprite.x) * 0.1 * this.velocityFactor;
                velocityY = (targetY - this.sprite.y) * 0.1 * this.velocityFactor;
                break;
            case 3: // Zurückweichen und Ausweichen
                velocityX = diffX < 0 ? this.speed * 0.6 * this.velocityFactor : -this.speed * 0.6 * this.velocityFactor;
                velocityY = Math.sin(time * 0.003) * this.speed * this.velocityFactor;
                break;
            case 4: // Zick-Zack Bewegung
                velocityX = Math.cos(time * 0.002) * this.speed * 0.7 * this.velocityFactor;
                velocityY = Math.sin(time * 0.004) * this.speed * 1.2 * this.velocityFactor;
                break;
        }
    }
    
    // Sicherstellen, dass sich der Boss nicht zu langsam bewegt
    const minSpeed = 0.5 * this.velocityFactor;
    if (Math.abs(velocityX) < minSpeed && Math.abs(velocityY) < minSpeed) {
        velocityX = (Math.random() - 0.5) * this.speed * this.velocityFactor;
        velocityY = (Math.random() - 0.5) * this.speed * this.velocityFactor;
    }
    
    // Geschwindigkeit auf den Sprite anwenden
    this.sprite.setVelocity(
        velocityX * normalizedDelta,
        velocityY * normalizedDelta
    );
    
    // Begrenze den Bewegungsbereich
    const minX = 100 + this.difficultyLevel * 10; // Mit höherem Level kann der Boss näher kommen
    if (this.sprite.x < minX) {
        this.sprite.x = minX;
    } else if (this.sprite.x > this.scene.scale.width - 50) {
        this.sprite.x = this.scene.scale.width - 50;
    }
    
    if (this.sprite.y < 50) {
        this.sprite.y = 50;
    } else if (this.sprite.y > this.scene.scale.height - 50) {
        this.sprite.y = this.scene.scale.height - 50;
    }
    
    // Wechselt das Angriffsmuster regelmäßig
    this.patternTimer += delta;
    if (this.patternTimer >= this.PATTERN_CHANGE_TIME) {
        this.patternTimer = 0;
        // Wähle ein neues, aber anderes Angriffsmuster
        let newPattern: string;
        do {
            newPattern = this.ATTACK_PATTERNS[Math.floor(Math.random() * this.ATTACK_PATTERNS.length)];
        } while (newPattern === this.currentPattern);
        
        this.currentPattern = newPattern;
        
        // Visuelles Feedback für Musterwechsel
        this.sprite.setAlpha(0.5);
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 1,
            duration: 300,
            ease: 'Sine.easeInOut'
        });
    }
  }

  /**
   * Schießen des Bosses
   */
  protected shoot(time: number): void {
    if (time > this.lastShotTime + this.fireRate) {
        this.lastShotTime = time;
        
        // Verschiedene Schussmuster
        switch (this.currentPattern) {
            case 'dual':
                // Klassischer Doppelschuss: Zwei parallele Laserstrahlen, korrekt ausgerichtet
                this.shootDualLaser();
                break;
            case 'tripple':
                // Dreifachschuss in fächerartiger Anordnung
                this.shootTrippleLaser();
                break;
            case 'wave':
                // Wellenmuster mit mehreren Projektilen
                this.shootWaveLaser();
                break;
        }
        
        // Zusätzliche Schüsse bei höheren Schwierigkeitsgraden
        if (this.difficultyLevel >= 3 && Math.random() < 0.3) {
            // Verzögerter extra Schuss
            this.scene.time.delayedCall(200, () => {
                if (this.sprite.active) {
                    this.shootDualLaser();
                }
            });
        }
    }
  }

  /**
   * Feuert den Dual-Laser ab
   */
  private shootDualLaser(): void {
    if (!this.sprite.active) return;
    
    const offsetY = 15; // Vertikaler Abstand zwischen den beiden Schüssen
    const bulletSpeedFactor = 1.2 + (this.difficultyLevel * 0.07); // Moderatere Projektilgeschwindigkeit
    
    // Berechne die aktuelle Geschwindigkeit des Bosses
    const bossVelocityX = this.sprite.body ? Math.abs(this.sprite.body.velocity.x) : 0;
    
    // Basis-Geschwindigkeit für die Projektile (Kombiniert Konstante + Boss-Geschwindigkeit)
    const baseVelocity = Constants.ENEMY_BULLET_SPEED * bulletSpeedFactor + (bossVelocityX * 0.5);
    
    // Oberer Laser
    this.createBullet(
      this.sprite.x - 40, 
      this.sprite.y - offsetY, 
      -baseVelocity, 
      0
    );
    
    // Unterer Laser
    this.createBullet(
      this.sprite.x - 40, 
      this.sprite.y + offsetY, 
      -baseVelocity, 
      0
    );
  }

  /**
   * Feuert den Tripple-Laser ab
   */
  private shootTrippleLaser(): void {
    if (!this.sprite.active) return;
    
    const bulletSpeedFactor = 1.25 + (this.difficultyLevel * 0.08); // Etwas schneller als Dual-Laser
    
    // Berechne die aktuelle Geschwindigkeit des Bosses
    const bossVelocityX = this.sprite.body ? Math.abs(this.sprite.body.velocity.x) : 0;
    
    // Basis-Geschwindigkeit für die Projektile (Kombiniert Konstante + Boss-Geschwindigkeit)
    const baseVelocity = Constants.ENEMY_BULLET_SPEED * bulletSpeedFactor + (bossVelocityX * 0.5);
    
    // Winkel für die seitlichen Laser (nur geringe Winkel)
    const angle = 15 * (Math.PI / 180); // 15 Grad in Radian
    
    // Mittlerer Laser (direkt)
    this.createBullet(
      this.sprite.x - 40, 
      this.sprite.y, 
      -baseVelocity, 
      0
    );
    
    // Oberer Laser (mit leichtem Winkel)
    this.createBullet(
      this.sprite.x - 40, 
      this.sprite.y, 
      -baseVelocity * Math.cos(angle), 
      -baseVelocity * Math.sin(angle)
    );
    
    // Unterer Laser (mit leichtem Winkel)
    this.createBullet(
      this.sprite.x - 40, 
      this.sprite.y, 
      -baseVelocity * Math.cos(angle), 
      baseVelocity * Math.sin(angle)
    );
  }

  /**
   * Feuert den Wave-Laser ab
   */
  private shootWaveLaser(): void {
    if (!this.sprite.active) return;
    
    const bulletCount = 5; // Anzahl der Projektile in der Welle
    const bulletSpeedFactor = 1.0 + (this.difficultyLevel * 0.05); // Langsamere Projektile für Wellenmuster
    
    // Berechne die aktuelle Geschwindigkeit des Bosses
    const bossVelocityX = this.sprite.body ? Math.abs(this.sprite.body.velocity.x) : 0;
    
    // Basis-Geschwindigkeit für die Projektile (Kombiniert Konstante + Boss-Geschwindigkeit)
    const baseVelocity = Constants.ENEMY_BULLET_SPEED * bulletSpeedFactor + (bossVelocityX * 0.5);
    
    for (let i = 0; i < bulletCount; i++) {
      // Verzögere jeden Schuss leicht
      this.scene.time.delayedCall(i * 80, () => {
        if (!this.sprite || !this.sprite.active) return;
        
        // Y-Position variiert für Welleneffekt
        const offsetY = Math.sin(i * 0.5) * 30;
        
        this.createBullet(
          this.sprite.x - 40, 
          this.sprite.y + offsetY, 
          -baseVelocity, 
          0
        );
      });
    }
  }

  /**
   * Erstellt eine Feindkugel mit angegebener Geschwindigkeit
   */
  private createBullet(x: number, y: number, vx: number, vy: number): void {
    // Hole die zentrale Bullet-Gruppe vom EnemyManager
    const enemyManager = this.scene.registry.get('enemyManager') as any;
    if (!enemyManager) return;
    
    // Verwende die Bullet-Group aus dem zentralen Pool
    const bullet = enemyManager.getEnemyBulletGroup().get(x, y) as Phaser.Physics.Arcade.Sprite;
    
    if (!bullet) return; // Keine verfügbaren Kugeln im Pool
    
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setScale(1.8);
    
    // Stelle sicher, dass der Physik-Body aktiviert ist
    if (!bullet.body) {
        this.scene.physics.world.enable(bullet);
    } else if (!bullet.body.enable) {
        bullet.body.enable = true;
    }
    
    // Position und Geschwindigkeit setzen
    bullet.setPosition(x, y);
    bullet.setVelocity(vx, vy);
    
    // KEINE Kollision mit Weltgrenzen - wird vom EnemyManager verwaltet
    bullet.setCollideWorldBounds(false);
    
    // Projektildaten
    bullet.setData('damage', Constants.DAMAGE.ENEMY_BULLET * 1.5 * this.difficultyFactor);
    bullet.setData('owner', 'boss');
    
    // Keine Rotation, nur horizontale Ausrichtung
    bullet.setRotation(0);
    
    // Sprite zeigt immer nach links
    bullet.setFlipX(true);
    
    // Bei der zentralen Verwaltung registrieren
    enemyManager.registerEnemyBullet(bullet);
    
    // Spiele den Sound
    this.scene.sound.play(Constants.SOUND_ENEMY_SHOOT, {
        volume: 0.3,
        detune: -300 // Tieferer Ton für Bossgegner
    });
    
    // Füge einen kleinen Glüheffekt hinzu
    bullet.setAlpha(0.8);
    this.scene.tweens.add({
        targets: bullet,
        alpha: 1,
        duration: 100
    });
  }
  
  /**
   * Wird aufgerufen, wenn der Boss mit einem anderen Objekt kollidiert
   */
  protected onCollision(other: GameObject): void {
    // Verursache Schaden am Spieler, wenn es eine Kollision gibt
    if (other instanceof Player) {
        other.takeDamage(40 * this.difficultyFactor); // Skalierter Schaden
        
        // Visuelle Rückmeldung entfernt
        
        // Nehme auch selbst Schaden, aber weniger
        this.takeDamage(10); 
        
        // Mache einen kurzen Rückprall
        const diffX = this.sprite.x - other.getSprite().x;
        const diffY = this.sprite.y - other.getSprite().y;
        const length = Math.sqrt(diffX * diffX + diffY * diffY) || 1;
        
        this.sprite.setVelocity(
            (diffX / length) * 300,
            (diffY / length) * 300
        );
    }
  }
  
  /**
   * Wird aufgerufen, wenn der Boss zerstört wird
   */
  protected onDestroy(): void {
    // Entferne Event-Listener
    this.eventBus.off(EventType.DIFFICULTY_CHANGED, this.onDifficultyChanged);

    // Großexplosion erstellen
    for (let i = 0; i < 8; i++) { // Mehr Explosionen
        const offsetX = (Math.random() - 0.5) * 120;
        const offsetY = (Math.random() - 0.5) * 120;
        const delay = i * 150; // Verzögerte Explosionen
        
        this.scene.time.delayedCall(delay, () => {
            if (!this.scene) return; // Szene könnte bereits zerstört sein
            
            const explosion = this.scene.add.sprite(
                this.sprite.x + offsetX, 
                this.sprite.y + offsetY, 
                Constants.ASSET_EXPLOSION_1
            );
            explosion.setScale(2 + Math.random() * 2);
            explosion.setAlpha(0.8);
            explosion.play('explode');
            
            // Kamera-Shake bei jeder Explosion entfernt
        });
    }
    
    // Finale große Explosion
    this.scene.time.delayedCall(1200, () => {
        if (!this.scene) return;
        
        const finalExplosion = this.scene.add.sprite(
            this.sprite.x, 
            this.sprite.y, 
            Constants.ASSET_EXPLOSION_1
        );
        finalExplosion.setScale(4);
        finalExplosion.play('explode');
        
        // Starker Kamera-Shake entfernt
    });

    // Spiele einen Sound
    this.scene.sound.play(Constants.SOUND_EXPLOSION, {
        volume: 0.5,
        detune: -500 // Tieferer Explosionsklang für Bosse
    });

    // Vergebe Punkte
    EventBus.getInstance().emit(EventType.BOSS_DESTROYED, this.scoreValue);

    // Höhere Chance auf Energie-Pickup, aber maximal 1
    if (Math.random() < Constants.BOSS_DROP_CHANCE) {
        // Immer nur ein Energy-Pickup
        const pickupCount = 1;
        
        for (let i = 0; i < pickupCount; i++) {
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            
            EventBus.getInstance().emit('CREATE_ENERGY_PICKUP', { 
                x: this.sprite.x + offsetX, 
                y: this.sprite.y + offsetY 
            });
        }
    }
    
    // Chance auf Power-Pickup (Waffen-Upgrade)
    if (Math.random() < Constants.BOSS_POWER_DROP_CHANCE) {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        
        EventBus.getInstance().emit('CREATE_POWER_PICKUP', { 
            x: this.sprite.x + offsetX, 
            y: this.sprite.y + offsetY 
        });
    }
  }

  /**
   * Gibt die Bullets des Bosses zurück
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    // Verwende die zentrale Gruppe vom EnemyManager
    const enemyManager = this.scene.registry.get('enemyManager') as any;
    if (enemyManager) {
      return enemyManager.getEnemyBulletGroup();
    }
    
    // Fallback: Verwende die ursprüngliche Gruppe
    return this.bulletGroup;
  }
  
  /**
   * Aktualisiert den Boss
   */
  public update(time: number, delta: number): void {
    if (this.isDestroyed) return;
    
    // Rufe die Basisfunktionalität auf
    super.update(time, delta);
    
    // Füge visuelle Effekte basierend auf dem aktuellen Muster hinzu
    if (this.difficultyLevel >= 2) {
        if (this.currentPattern === 'dual' && Math.random() < 0.05) {
            // Gelegentliches Aufblitzen für Dual-Laser
            this.sprite.setTint(0x00ffff);
            this.scene.time.delayedCall(100, () => {
                const intensity = Math.min(255, 200 + this.difficultyLevel * 5);
                this.sprite.setTint(Phaser.Display.Color.GetColor(intensity, 0, 0));
            });
        } else if (this.currentPattern === 'tripple' && Math.random() < 0.05) {
            // Gelegentliches Aufblitzen für Tripple-Laser
            this.sprite.setTint(0xff00ff);
            this.scene.time.delayedCall(100, () => {
                const intensity = Math.min(255, 200 + this.difficultyLevel * 5);
                this.sprite.setTint(Phaser.Display.Color.GetColor(intensity, 0, 0));
            });
        }
    }
  }
} 