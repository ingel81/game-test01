import 'phaser';

export default class SpaceShooter extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private asteroids!: Phaser.Physics.Arcade.Group;
    private bossEnemies!: Phaser.Physics.Arcade.Group;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private stars!: Phaser.GameObjects.Group;
    private lastShotTime: number = 0;
    private readonly SHOT_DELAY: number = 250; // 250ms Verzögerung zwischen Schüssen
    private health: number = 100;
    private healthBar!: Phaser.GameObjects.Graphics;
    private healthText!: Phaser.GameObjects.Text;
    private healthValueText!: Phaser.GameObjects.Text;
    private readonly toolbarHeight: number = 60;
    private difficulty: number = 1;
    private difficultyTimer: number = 0;
    private readonly DIFFICULTY_INCREASE_INTERVAL: number = 30000; // Alle 30 Sekunden
    private readonly MAX_DIFFICULTY: number = 5;
    private energyDrops!: Phaser.Physics.Arcade.Group;
    private spawnRates: { [key: string]: number } = {
        enemy: 2000,
        boss: 15000,
        asteroid: 5000
    };
    private touchControls: {
        shoot: boolean;
        touchX: number;
        touchY: number;
        isMoving: boolean;
        pointer: Phaser.Input.Pointer | null;
    } = {
        shoot: false,
        touchX: 0,
        touchY: 0,
        isMoving: false,
        pointer: null
    };
    private touchButtons: {
        shoot: Phaser.GameObjects.Rectangle;
    } | null = null;

    constructor() {
        super({ key: 'SpaceShooter' });
    }

    preload() {
        // Lade die Spieler-Assets
        this.load.image('player', 'assets/player/sprites/player1.png');
        this.load.image('bullet', 'assets/shoot/shoot1.png');
        this.load.image('enemy', 'assets/enemy/sprites/enemy1.png');
        this.load.image('enemyBullet', 'assets/shoot/shoot2.png');
        this.load.image('asteroid', 'assets/asteroids/asteroid.png');
        this.load.image('asteroid-small', 'assets/asteroids/asteroid-small.png');
        this.load.image('boss', 'assets/enemy/sprites/enemy1.png'); // Temporär das gleiche Sprite, aber mit Tint
        
        // Lade die Explosionsbilder
        this.load.image('explosion1', 'assets/explosion/sprites/explosion1.png');
        this.load.image('explosion2', 'assets/explosion/sprites/explosion2.png');
        this.load.image('explosion3', 'assets/explosion/sprites/explosion3.png');
        this.load.image('explosion4', 'assets/explosion/sprites/explosion4.png');
        this.load.image('explosion5', 'assets/explosion/sprites/explosion5.png');
        
        // Lade die Sound-Assets
        this.load.audio('shoot', 'assets/Sound FX/shot 1.wav');
        this.load.audio('enemyShoot', 'assets/Sound FX/shot 2.wav');
        this.load.audio('explosion', 'assets/Sound FX/explosion.wav');
        this.load.audio('background', 'assets/music/01.mp3');
    }

    create() {
        console.log('Spiel wird initialisiert...');

        // Setze die Weltgrenzen auf die tatsächliche Bildschirmgröße
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        // Starte Hintergrundmusik
        try {
            console.log('Versuche Hintergrundmusik zu laden...');
            const backgroundMusic = this.sound.add('background', {
                volume: 0.5,
                loop: true,
                delay: 0
            });
            console.log('Starte Musik...');
            backgroundMusic.play();
        } catch (error) {
            console.error('Fehler beim Laden der Hintergrundmusik:', error);
        }

        // Erstelle Sternenfeld
        this.stars = this.add.group();
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const y = Phaser.Math.Between(0, this.scale.height);
            const size = Phaser.Math.Between(1, 3);
            const star = this.add.circle(x, y, size, 0xFFFFFF, 0.3);
            star.setData('speed', size * 2);
            this.stars.add(star);
        }

        // Erstelle die Explosionsanimation
        this.anims.create({
            key: 'explode',
            frames: [
                { key: 'explosion1' },
                { key: 'explosion2' },
                { key: 'explosion3' },
                { key: 'explosion4' },
                { key: 'explosion5' }
            ],
            frameRate: 10,
            hideOnComplete: true
        });

        // Erstelle die Trefferanimation
        this.anims.create({
            key: 'hit',
            frames: [
                { key: 'explosion1' },
                { key: 'explosion2' }
            ],
            frameRate: 15,
            hideOnComplete: true
        });

        // Erstelle Spielobjekte
        const playerSprite = this.physics.add.sprite(200, 400, 'player');
        if (!playerSprite) {
            console.error('Spieler konnte nicht erstellt werden');
            return;
        }
        this.player = playerSprite;
        this.player.setCollideWorldBounds(true);
        this.player.setRotation(0);
        this.player.setScale(2); // Skaliere das neue Sprite entsprechend

        // Erstelle Gruppen für Kollisionen
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.asteroids = this.physics.add.group();
        this.bossEnemies = this.physics.add.group();
        this.energyDrops = this.physics.add.group();

        // Tastatursteuerung
        this.cursors = this.input.keyboard.createCursorKeys();

        // Erstelle die Toolbar
        const toolbarPadding = 20;
        
        // Hintergrund der Toolbar
        const toolbarBg = this.add.graphics();
        toolbarBg.fillStyle(0x000000, 0.7);
        toolbarBg.fillRect(0, 0, this.scale.width, this.toolbarHeight);
        
        // Futuristischer Rahmen
        toolbarBg.lineStyle(2, 0x00ffff, 0.8);
        toolbarBg.strokeRect(0, 0, this.scale.width, this.toolbarHeight);
        
        // Dekorative Linien entfernt, da sie nicht mehr zum Layout passen

        // Toolbar-Elemente für mobile Geräte optimieren
        const isMobile = this.sys.game.device.input.touch;
        const fontSize = isMobile ? '20px' : '28px';
        
        // P1 Anzeige
        this.add.text(10, this.toolbarHeight/2, 'P1 >>', { 
            fontSize: fontSize, 
            color: '#00ffff',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // Punktestand
        this.scoreText = this.add.text(70, this.toolbarHeight/2, '000000', { 
            fontSize: fontSize, 
            color: '#00ffff',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // Gesundheitsbalken
        this.healthBar = this.add.graphics();
        this.healthText = this.add.text(200, this.toolbarHeight/2, 'ENERGY', { 
            fontSize: fontSize, 
            color: '#00ffff',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // Numerische Energie-Anzeige
        this.healthValueText = this.add.text(520, this.toolbarHeight/2, '100%', { 
            fontSize: fontSize, 
            color: '#00ffff',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);
        this.updateHealthBar();

        // Kollisionen
        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            (bullet: any, enemy: any) => {
                if (bullet && enemy) {
                    this.hitEnemy(
                        bullet as Phaser.Physics.Arcade.Sprite,
                        enemy as Phaser.Physics.Arcade.Sprite
                    );
                }
            },
            undefined,
            this
        );

        // Kollision zwischen Spieler-Schüssen und Asteroiden
        this.physics.add.overlap(
            this.bullets,
            this.asteroids,
            (bullet: any, asteroid: any) => {
                if (bullet && asteroid) {
                    this.hitAsteroid(
                        bullet as Phaser.Physics.Arcade.Sprite,
                        asteroid as Phaser.Physics.Arcade.Sprite
                    );
                }
            },
            undefined,
            this
        );

        // Kollision zwischen Spieler-Schüssen und Boss-Gegnern
        this.physics.add.overlap(
            this.bullets,
            this.bossEnemies,
            (bullet: any, boss: any) => {
                if (bullet && boss) {
                    this.hitBoss(
                        bullet as Phaser.Physics.Arcade.Sprite,
                        boss as Phaser.Physics.Arcade.Sprite
                    );
                }
            },
            undefined,
            this
        );

        // Kollision zwischen Spieler und feindlichen Schüssen
        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            (player: any, bullet: any) => {
                if (bullet.active && player.active) {
                    bullet.destroy();
                    this.takeDamage(10); // 10% Schaden bei Treffer
                    
                    // Visuelles Feedback für Treffer
                    const flash = this.add.graphics();
                    flash.fillStyle(0xff0000, 0.3);
                    flash.setScrollFactor(0);
                    flash.setDepth(1000);
                    flash.fillRect(0, 0, this.scale.width, this.scale.height);
                    
                    this.tweens.add({
                        targets: flash,
                        alpha: 0,
                        duration: 100,
                        ease: 'Power2',
                        onComplete: () => flash.destroy()
                    });
                }
            },
            undefined,
            this
        );

        // Kollision zwischen Spieler und Asteroiden
        this.physics.add.overlap(
            this.player,
            this.asteroids,
            (player: any, asteroid: any) => {
                if (asteroid.active && player.active) {
                    // Erstelle eine große Explosion
                    const explosion = this.add.sprite(asteroid.x, asteroid.y, 'explosion1');
                    explosion.setScale(3);
                    explosion.play('explode');

                    // Erstelle mehrere zusätzliche Explosionen für den finalen Effekt
                    for (let i = 0; i < 3; i++) {
                        const offsetX = Phaser.Math.Between(-20, 20);
                        const offsetY = Phaser.Math.Between(-20, 20);
                        const extraExplosion = this.add.sprite(
                            asteroid.x + offsetX,
                            asteroid.y + offsetY,
                            'explosion1'
                        );
                        extraExplosion.setScale(2);
                        extraExplosion.play('explode');
                    }

                    asteroid.destroy();
                    this.takeDamage(15); // 15% Schaden bei Asteroiden-Kollision
                    
                    // Visuelles Feedback für Treffer
                    const flash = this.add.graphics();
                    flash.fillStyle(0xff0000, 0.3);
                    flash.setScrollFactor(0);
                    flash.setDepth(1000);
                    flash.fillRect(0, 0, this.scale.width, this.scale.height);
                    
                    // Spiele Explosions-Sound
                    this.sound.play('explosion', {
                        volume: 0.6,
                        rate: 0.8
                    });
                    
                    this.tweens.add({
                        targets: flash,
                        alpha: 0,
                        duration: 100,
                        ease: 'Power2',
                        onComplete: () => flash.destroy()
                    });
                }
            },
            undefined,
            this
        );

        // Kollision zwischen Spieler und Boss-Gegnern
        this.physics.add.overlap(
            this.player,
            this.bossEnemies,
            (player: any, boss: any) => {
                if (boss.active && player.active) {
                    boss.destroy();
                    this.takeDamage(40); // 40% Schaden bei Kollision mit Boss
                    
                    // Visuelles Feedback für Treffer
                    const flash = this.add.graphics();
                    flash.fillStyle(0xff0000, 0.3);
                    flash.setScrollFactor(0);
                    flash.setDepth(1000);
                    flash.fillRect(0, 0, this.scale.width, this.scale.height);
                    
                    this.tweens.add({
                        targets: flash,
                        alpha: 0,
                        duration: 100,
                        ease: 'Power2',
                        onComplete: () => flash.destroy()
                    });
                }
            },
            undefined,
            this
        );

        // Kollision zwischen Spieler und normalen Gegnern
        this.physics.add.overlap(
            this.player,
            this.enemies,
            (player: any, enemy: any) => {
                if (enemy.active && player.active) {
                    // Erstelle Explosion an der Position des Gegners
                    const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion1');
                    explosion.setScale(2);
                    explosion.play('explode');

                    // Spiele Explosions-Sound
                    this.sound.play('explosion', {
                        volume: 0.4,
                        rate: 1.2
                    });

                    enemy.destroy();
                    this.takeDamage(30); // 30% Schaden bei Kollision
                    
                    // Visuelles Feedback für Treffer
                    const flash = this.add.graphics();
                    flash.fillStyle(0xff0000, 0.3);
                    flash.setScrollFactor(0);
                    flash.setDepth(1000);
                    flash.fillRect(0, 0, this.scale.width, this.scale.height);
                    
                    this.tweens.add({
                        targets: flash,
                        alpha: 0,
                        duration: 100,
                        ease: 'Power2',
                        onComplete: () => flash.destroy()
                    });
                }
            },
            undefined,
            this
        );

        // Kollision zwischen Spieler und Energiedrops
        this.physics.add.overlap(
            this.player,
            this.energyDrops,
            (player: any, drop: any) => {
                if (drop.active && player.active) {
                    this.collectEnergyDrop(drop);
                }
            },
            undefined,
            this
        );

        // Feind-Spawner mit dynamischer Verzögerung
        this.time.addEvent({
            delay: this.spawnRates.enemy,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Boss-Spawner mit dynamischer Verzögerung
        this.time.addEvent({
            delay: this.spawnRates.boss,
            callback: this.spawnBoss,
            callbackScope: this,
            loop: true
        });

        // Asteroiden-Spawner
        this.time.addEvent({
            delay: this.spawnRates.asteroid,
            callback: this.spawnAsteroid,
            callbackScope: this,
            loop: true
        });

        // Schwierigkeitsgrad-Timer
        this.time.addEvent({
            delay: this.DIFFICULTY_INCREASE_INTERVAL,
            callback: this.increaseDifficulty,
            callbackScope: this,
            loop: true
        });

        // Füge Touch-Steuerung hinzu
        this.createTouchControls();

        // Füge einen Vollbild-Button hinzu, wenn Touch-Gerät
        if (this.sys.game.device.input.touch) {
            const fsButton = this.add.rectangle(
                this.scale.width - 40,
                this.toolbarHeight/2,
                40,
                40,
                0x000000,
                0.7
            )
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1000);

            // Rahmen für den Button
            const fsButtonBorder = this.add.graphics()
                .setScrollFactor(0)
                .setDepth(1000);
            fsButtonBorder.lineStyle(2, 0x00ffff, 0.8);
            fsButtonBorder.strokeRect(
                this.scale.width - 60,
                this.toolbarHeight/2 - 20,
                40,
                40
            );

            // Vollbild-Icon
            const fsText = this.add.text(
                this.scale.width - 40,
                this.toolbarHeight/2,
                '⛶',
                {
                    fontSize: '24px',
                    color: '#00ffff'
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000);

            // Event-Handler für den Vollbild-Button
            fsButton.on('pointerdown', () => {
                if (this.scale.isFullscreen) {
                    this.scale.stopFullscreen();
                } else {
                    this.scale.startFullscreen();
                }
            });
        }
    }

    private createTouchControls() {
        if (!this.sys.game.device.input.touch) {
            return;
        }

        const buttonSize = 100;
        const padding = Math.min(40, this.scale.height * 0.1); // Dynamischer Padding basierend auf Bildschirmhöhe

        // Schuss-Button weiter oben positionieren
        this.touchButtons = {
            shoot: this.add.rectangle(
                this.scale.width - padding - buttonSize/2, 
                this.scale.height - padding - buttonSize - 50, // 50px höher
                buttonSize, 
                buttonSize, 
                0xff0000, 
                0.5
            )
                .setInteractive()
                .setScrollFactor(0)
                .setDepth(1000)
        };

        // Angepasste Schriftgröße für das Blitz-Symbol
        this.add.text(
            this.touchButtons.shoot.x, 
            this.touchButtons.shoot.y, 
            '⚡', 
            { fontSize: '36px' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        // Event-Handler für den Schuss-Button
        this.touchButtons.shoot.on('pointerdown', () => {
            this.touchControls.shoot = true;
            this.touchButtons!.shoot.setAlpha(0.8);
        });

        this.touchButtons.shoot.on('pointerup', () => {
            this.touchControls.shoot = false;
            this.touchButtons!.shoot.setAlpha(0.5);
        });

        this.touchButtons.shoot.on('pointerout', () => {
            this.touchControls.shoot = false;
            this.touchButtons!.shoot.setAlpha(0.5);
        });

        // Multi-Touch-Bewegung für den Spieler
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const shootButton = this.touchButtons!.shoot;
            const buttonBounds = shootButton.getBounds();

            // Wenn der Touch nicht auf dem Schuss-Button ist, starte Bewegung
            if (!buttonBounds.contains(pointer.x, pointer.y)) {
                this.touchControls.isMoving = true;
                this.touchControls.pointer = pointer;
                this.touchControls.touchX = pointer.x;
                this.touchControls.touchY = pointer.y;
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Aktualisiere Bewegung nur wenn es der richtige Pointer ist
            if (this.touchControls.isMoving && this.touchControls.pointer?.id === pointer.id) {
                this.touchControls.touchX = pointer.x;
                this.touchControls.touchY = pointer.y;
            }
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            // Stoppe Bewegung nur wenn es der richtige Pointer ist
            if (this.touchControls.pointer?.id === pointer.id) {
                this.touchControls.isMoving = false;
                this.touchControls.pointer = null;
            }
        });

        // Aktiviere Multi-Touch
        this.input.addPointer(2);
    }

    update() {
        // Aktualisiere den Schwierigkeitsgrad-Timer
        this.difficultyTimer += this.game.loop.delta;
        
        // Sternenfeld bewegen
        this.stars.children.each((star: Phaser.GameObjects.GameObject) => {
            const starCircle = star as any;
            const speed = starCircle.getData('speed');
            starCircle.x -= speed;
            if (starCircle.x < -10) {
                starCircle.x = this.scale.width + 10;
                starCircle.y = Phaser.Math.Between(0, this.scale.height);
                const size = Phaser.Math.Between(1, 3);
                starCircle.setRadius(size);
                starCircle.setData('speed', size * 2);
            }
            return true;
        });

        // Aktualisiere die Position der Energiedrops
        this.energyDrops.children.each((drop: any) => {
            const container = drop.getData('container');
            if (container && drop.active) {
                container.setPosition(drop.x, drop.y);
            }
            // Entferne den Drop wenn er außerhalb des Bildschirms ist
            if (drop.y > this.scale.height || drop.y < 0) {
                if (container) container.destroy();
                drop.destroy();
            }
            return true;
        });

        // Nur Spieler-bezogene Updates durchführen, wenn der Spieler noch aktiv ist
        if (this.player && this.player.active) {
            let moveX = 0;
            let moveY = 0;

            // Touch-Steuerung für Bewegung
            if (this.touchControls.isMoving) {
                const dx = this.touchControls.touchX - this.player.x;
                const dy = this.touchControls.touchY - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 10) {
                    moveX = (dx / distance) * 300;
                    moveY = (dy / distance) * 300;
                }
            }

            // Tastatur-Steuerung (als Fallback)
            if (this.cursors.left.isDown) moveX = -300;
            if (this.cursors.right.isDown) moveX = 300;
            if (this.cursors.up.isDown) moveY = -300;
            if (this.cursors.down.isDown) moveY = 300;

            this.player.setVelocityX(moveX);
            this.player.setVelocityY(moveY);

            // Schießen mit Touch oder Tastatur
            if (this.touchControls.shoot || this.cursors.space.isDown) {
                const currentTime = this.time.now;
                if (currentTime - this.lastShotTime >= this.SHOT_DELAY) {
                    this.shoot();
                    this.lastShotTime = currentTime;
                }
            }
        }

        // Aktualisiere Gegner-Bewegung
        this.enemies.children.each((enemy: any) => {
            if (!enemy.active) return true;

            const originalY = enemy.getData('originalY');
            const moveRange = enemy.getData('moveRange');
            const moveSpeed = enemy.getData('moveSpeed');

            // Bewege den Gegner in Richtung Spieler, aber mit Einschränkungen
            if (this.player.y < enemy.y - 10) {
                enemy.setVelocityY(-moveSpeed);
            } else if (this.player.y > enemy.y + 10) {
                enemy.setVelocityY(moveSpeed);
            } else {
                enemy.setVelocityY(0);
            }

            // Beschränke die Bewegung auf den festgelegten Bereich
            if (Math.abs(enemy.y - originalY) > moveRange) {
                enemy.y = originalY + (enemy.y > originalY ? moveRange : -moveRange);
                enemy.setVelocityY(0);
            }

            // Despawn wenn der Gegner den Bildschirm verlässt
            if (enemy.x < -50) {
                enemy.destroy();
            }

            return true;
        });

        // Aktualisiere Boss-Bewegung
        this.bossEnemies.children.each((boss: any) => {
            if (!boss.active) return true;

            const originalY = boss.getData('originalY');
            const moveRange = boss.getData('moveRange');
            const moveSpeed = boss.getData('moveSpeed');

            // Bewege den Boss in Richtung Spieler
            if (this.player.y < boss.y - 10) {
                boss.setVelocityY(-moveSpeed);
            } else if (this.player.y > boss.y + 10) {
                boss.setVelocityY(moveSpeed);
            } else {
                boss.setVelocityY(0);
            }

            // Beschränke die Bewegung auf den festgelegten Bereich
            if (Math.abs(boss.y - originalY) > moveRange) {
                boss.y = originalY + (boss.y > originalY ? moveRange : -moveRange);
                boss.setVelocityY(0);
            }

            // Despawn wenn der Boss den Bildschirm verlässt
            if (boss.x < -50) {
                boss.destroy();
            }

            return true;
        });

        // Aktualisiere Asteroiden-Bewegung
        this.asteroids.children.each((asteroid: any) => {
            if (!asteroid.active) return true;

            const originalY = asteroid.getData('originalY');
            const moveRange = asteroid.getData('moveRange');
            const moveSpeed = asteroid.getData('moveSpeed');

            // Bewege den Asteroiden in Richtung Spieler
            if (this.player.y < asteroid.y - 10) {
                asteroid.setVelocityY(-moveSpeed);
            } else if (this.player.y > asteroid.y + 10) {
                asteroid.setVelocityY(moveSpeed);
            } else {
                asteroid.setVelocityY(0);
            }

            // Beschränke die Bewegung auf den festgelegten Bereich
            if (Math.abs(asteroid.y - originalY) > moveRange) {
                asteroid.y = originalY + (asteroid.y > originalY ? moveRange : -moveRange);
                asteroid.setVelocityY(0);
            }

            // Despawn wenn der Asteroid den Bildschirm verlässt
            if (asteroid.x < -50) {
                asteroid.destroy();
            }

            return true;
        });

        // Lösche Kugeln die aus dem Bildschirm fliegen
        this.bullets.children.each((bullet: any) => {
            if (bullet.x > this.scale.width) {
                bullet.destroy();
            }
            return true;
        });

        this.enemyBullets.children.each((bullet: any) => {
            if (bullet.x < 0) {
                bullet.destroy();
            }
            return true;
        });
    }

    shoot() {
        const bullet = this.bullets.create(this.player.x + 20, this.player.y, 'bullet');
        bullet.setVelocityX(400);
        bullet.setScale(2);  // Skaliere den Schuss entsprechend
        bullet.setTint(0xff6666); // Rötliche Färbung für Spielerschüsse
        this.sound.play('shoot', {
            volume: 0.3,
            rate: 1.2,
            detune: 0
        });
    }

    spawnEnemy() {
        const enemy = this.enemies.create(this.scale.width, Phaser.Math.Between(50, this.scale.height - 50), 'enemy');
        // Erhöhe die Geschwindigkeit basierend auf dem Schwierigkeitsgrad
        const baseSpeed = -250;
        const speedMultiplier = 1 + (this.difficulty - 1) * 0.4;
        enemy.setVelocityX(baseSpeed * speedMultiplier);
        enemy.setScale(2);
        enemy.setRotation(0);
        
        // Speichere die ursprüngliche Y-Position
        enemy.setData('originalY', enemy.y);
        // Zufällige Bewegungsreichweite (100-200 Pixel)
        enemy.setData('moveRange', Phaser.Math.Between(100, 200));
        // Bewegungsgeschwindigkeit erhöht mit Schwierigkeitsgrad
        const baseMoveSpeed = Phaser.Math.Between(150, 200);
        enemy.setData('moveSpeed', baseMoveSpeed * speedMultiplier);

        // Lebenspunkte für normale Gegner basierend auf dem Schwierigkeitsgrad
        const baseHealth = 1;
        const healthMultiplier = 1 + (this.difficulty - 1) * 0.3;
        const health = Math.floor(baseHealth * healthMultiplier);
        enemy.setData('health', health);
        enemy.setData('maxHealth', health);

        // Zufälliger Schuss-Timer für jeden Gegner (schneller mit höherem Schwierigkeitsgrad)
        const baseShootDelay = Phaser.Math.Between(800, 2000);
        const shootDelay = baseShootDelay / (speedMultiplier * 1.5);
        this.time.addEvent({
            delay: shootDelay,
            callback: () => {
                if (enemy.active) {
                    this.enemyShoot(enemy);
                }
            },
            loop: true
        });
    }

    enemyShoot(enemy: Phaser.Physics.Arcade.Sprite) {
        if (!enemy.active) return; // Sicherheitscheck

        const bullet = this.enemyBullets.create(enemy.x - 20, enemy.y, 'enemyBullet');
        bullet.setScale(2);
        // Erhöhe die Geschwindigkeit der Schüsse mit dem Schwierigkeitsgrad
        const baseSpeed = -500;
        const speedMultiplier = 1 + (this.difficulty - 1) * 0.2;
        bullet.setVelocityX(baseSpeed * speedMultiplier);
        bullet.setVelocityY(0); // Keine vertikale Bewegung
        bullet.setRotation(Math.PI);
        bullet.setTint(0x00ffff);

        // Spiele den Schuss-Sound
        this.sound.play('enemyShoot', {
            volume: 0.3,
            rate: 1.0,
            detune: 0
        });

        // Lösche Kugel nach 2 Sekunden wenn sie nichts trifft
        this.time.delayedCall(2000, () => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
    }

    spawnBoss() {
        const boss = this.bossEnemies.create(this.scale.width, Phaser.Math.Between(50, this.scale.height - 50), 'boss');
        // Erhöhe die Geschwindigkeit basierend auf dem Schwierigkeitsgrad
        const baseSpeed = -180;
        const speedMultiplier = 1 + (this.difficulty - 1) * 0.3;
        boss.setVelocityX(baseSpeed * speedMultiplier);
        boss.setScale(3);
        boss.setRotation(0);
        
        // Speichere die ursprüngliche Y-Position
        boss.setData('originalY', boss.y);
        // Größere Bewegungsreichweite
        boss.setData('moveRange', Phaser.Math.Between(150, 250));
        // Bewegungsgeschwindigkeit erhöht mit Schwierigkeitsgrad
        const baseMoveSpeed = Phaser.Math.Between(80, 120);
        boss.setData('moveSpeed', baseMoveSpeed * speedMultiplier);

        // Lebenspunkte erhöhen sich mit dem Schwierigkeitsgrad
        const baseHealth = 15;
        const healthMultiplier = 1 + (this.difficulty - 1) * 0.5;
        const health = Math.floor(baseHealth * healthMultiplier);
        boss.setData('health', health);
        boss.setData('maxHealth', health);
        boss.setTint(0xff00ff);

        // Schnelleres Schießen mit höherem Schwierigkeitsgrad
        const baseShootDelay = 400;
        const shootDelay = baseShootDelay / (speedMultiplier * 1.5);
        this.time.addEvent({
            delay: shootDelay,
            callback: () => {
                if (boss.active) {
                    // Immer nur 2 Schüsse, aber schneller mit höherem Level
                    const shotCount = 2;
                    for (let i = 0; i < shotCount; i++) {
                        const offset = (i - (shotCount - 1) / 2) * 15;
                        this.bossShoot(boss, offset);
                    }
                }
            },
            loop: true
        });
    }

    bossShoot(boss: Phaser.Physics.Arcade.Sprite, offsetY: number) {
        if (!boss.active) return;

        const bullet = this.enemyBullets.create(boss.x - 20, boss.y + offsetY, 'enemyBullet');
        bullet.setScale(2.5);
        bullet.setVelocityX(-600); // Erhöhte Geschwindigkeit für Boss-Schüsse
        bullet.setVelocityY(0); // Keine vertikale Bewegung
        bullet.setRotation(Math.PI);
        bullet.setTint(0xff00ff);

        // Spiele den Schuss-Sound
        this.sound.play('enemyShoot', {
            volume: 0.4,
            rate: 1.2,
            detune: 0
        });

        // Lösche Kugel nach 2 Sekunden wenn sie nichts trifft
        this.time.delayedCall(2000, () => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
    }

    updateHealthBar() {
        this.healthBar.clear();
        
        // Hintergrund des Balkens
        this.healthBar.fillStyle(0x001111, 1);
        this.healthBar.fillRect(400, this.toolbarHeight/2 - 15, 200, 30);
        
        // Rahmen des Balkens
        this.healthBar.lineStyle(2, 0x00ffff, 1);
        this.healthBar.strokeRect(400, this.toolbarHeight/2 - 15, 200, 30);
        
        // Aktuelle Gesundheit
        this.healthBar.fillStyle(0x00ffff, 1);
        this.healthBar.fillRect(400, this.toolbarHeight/2 - 15, 200 * (this.health / 100), 30);
        
        // Segmente im Balken
        const segments = 10;
        const segmentWidth = 200 / segments;
        for (let i = 1; i < segments; i++) {
            this.healthBar.lineStyle(1, 0x000000, 0.3);
            this.healthBar.lineBetween(
                400 + i * segmentWidth,
                this.toolbarHeight/2 - 15,
                400 + i * segmentWidth,
                this.toolbarHeight/2 + 15
            );
        }

        // Aktualisiere den numerischen Wert
        this.healthValueText.setText(`${Math.max(0, Math.min(100, this.health))}%`);
    }

    hitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) {
        // Erstelle Explosion an der Position des Gegners
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion1');
        explosion.setScale(2);
        explosion.play('explode');

        // Erstelle zusätzliche kleine Explosionen für einen besseren Effekt
        for (let i = 0; i < 2; i++) {
            const offsetX = Phaser.Math.Between(-10, 10);
            const offsetY = Phaser.Math.Between(-10, 10);
            const extraExplosion = this.add.sprite(
                enemy.x + offsetX,
                enemy.y + offsetY,
                'explosion1'
            );
            extraExplosion.setScale(1.5);
            extraExplosion.play('explode');
        }

        bullet.destroy();
        enemy.destroy();
        
        // Spawne möglicherweise einen Energiedrop
        this.spawnEnergyDrop(enemy.x, enemy.y);
        
        // Formatiere den Score als 6-stellige Zahl mit führenden Nullen
        this.score += 10;
        const formattedScore = String(this.score).padStart(6, '0');
        this.scoreText.setText(formattedScore);
        
        // Spiele Explosions-Sound
        this.sound.play('explosion', {
            volume: 0.4,
            rate: 1.2
        });
    }

    hitAsteroid(bullet: Phaser.Physics.Arcade.Sprite, asteroid: Phaser.Physics.Arcade.Sprite) {
        // Erstelle Explosion an der Position des Asteroiden
        const explosion = this.add.sprite(asteroid.x, asteroid.y, 'explosion1');
        explosion.setScale(2);
        explosion.play('explode');

        // Erstelle zusätzliche kleine Explosionen für einen besseren Effekt
        for (let i = 0; i < 2; i++) {
            const offsetX = Phaser.Math.Between(-10, 10);
            const offsetY = Phaser.Math.Between(-10, 10);
            const extraExplosion = this.add.sprite(
                asteroid.x + offsetX,
                asteroid.y + offsetY,
                'explosion1'
            );
            extraExplosion.setScale(1.5);
            extraExplosion.play('explode');
        }

        bullet.destroy();
        
        // Reduziere die Lebenspunkte des Asteroiden
        const currentHealth = asteroid.getData('health') - 1;
        asteroid.setData('health', currentHealth);

        // Wenn der Asteroid keine Lebenspunkte mehr hat, zerstöre ihn
        if (currentHealth <= 0) {
            // Erstelle eine finale große Explosion
            const finalExplosion = this.add.sprite(asteroid.x, asteroid.y, 'explosion1');
            finalExplosion.setScale(3);
            finalExplosion.play('explode');

            // Erstelle mehrere zusätzliche Explosionen für den finalen Effekt
            for (let i = 0; i < 3; i++) {
                const offsetX = Phaser.Math.Between(-20, 20);
                const offsetY = Phaser.Math.Between(-20, 20);
                const extraExplosion = this.add.sprite(
                    asteroid.x + offsetX,
                    asteroid.y + offsetY,
                    'explosion1'
                );
                extraExplosion.setScale(2);
                extraExplosion.play('explode');
            }

            asteroid.destroy();
            // Punkte für Asteroiden
            this.score += 5;
            const formattedScore = String(this.score).padStart(6, '0');
            this.scoreText.setText(formattedScore);
            
            // Spiele Explosions-Sound
            this.sound.play('explosion', {
                volume: 0.6,
                rate: 0.8
            });
        } else {
            // Spiele einen kleineren Explosions-Sound für Treffer
            this.sound.play('explosion', {
                volume: 0.3,
                rate: 1.2
            });
        }
    }

    hitBoss(bullet: Phaser.Physics.Arcade.Sprite, boss: Phaser.Physics.Arcade.Sprite) {
        // Erstelle eine größere Explosion für den Boss
        const explosion = this.add.sprite(boss.x, boss.y, 'explosion1');
        explosion.setScale(3);
        explosion.play('explode');

        // Erstelle zusätzliche Explosionen für einen mächtigeren Effekt
        for (let i = 0; i < 3; i++) {
            const offsetX = Phaser.Math.Between(-30, 30);
            const offsetY = Phaser.Math.Between(-30, 30);
            const extraExplosion = this.add.sprite(
                boss.x + offsetX,
                boss.y + offsetY,
                'explosion1'
            );
            extraExplosion.setScale(2);
            extraExplosion.play('explode');
        }

        bullet.destroy();
        
        // Reduziere die Lebenspunkte des Bosses
        const currentHealth = boss.getData('health') - 1;
        boss.setData('health', currentHealth);

        // Wenn der Boss keine Lebenspunkte mehr hat, zerstöre ihn
        if (currentHealth <= 0) {
            // Erstelle eine finale große Explosion
            const finalExplosion = this.add.sprite(boss.x, boss.y, 'explosion1');
            finalExplosion.setScale(4);
            finalExplosion.play('explode');

            // Erstelle mehrere zusätzliche Explosionen für den finalen Effekt
            for (let i = 0; i < 5; i++) {
                const offsetX = Phaser.Math.Between(-50, 50);
                const offsetY = Phaser.Math.Between(-50, 50);
                const extraExplosion = this.add.sprite(
                    boss.x + offsetX,
                    boss.y + offsetY,
                    'explosion1'
                );
                extraExplosion.setScale(3);
                extraExplosion.play('explode');
            }

            boss.destroy();
            // Spawne mehrere Energiedrops für den Boss
            for (let i = 0; i < 3; i++) {
                const offsetX = Phaser.Math.Between(-30, 30);
                const offsetY = Phaser.Math.Between(-30, 30);
                this.spawnEnergyDrop(boss.x + offsetX, boss.y + offsetY);
            }

            // Mehr Punkte für einen Boss
            this.score += 50;
            const formattedScore = String(this.score).padStart(6, '0');
            this.scoreText.setText(formattedScore);
            
            // Spiele Explosions-Sound
            this.sound.play('explosion', {
                volume: 0.8,
                rate: 0.8
            });
        } else {
            // Spiele einen kleineren Explosions-Sound für Treffer
            this.sound.play('explosion', {
                volume: 0.4,
                rate: 1.2
            });
        }
    }

    takeDamage(percentage: number) {
        // Berechne den Schaden und runde auf ganze Zahlen
        const damage = Math.ceil(this.health * (percentage / 100));
        // Setze die Gesundheit auf 0 wenn der Schaden größer oder gleich der aktuellen Gesundheit ist
        this.health = damage >= this.health ? 0 : this.health - damage;
        this.updateHealthBar();
        
        // Sofortiges Game Over wenn die Energie auf 0 fällt
        if (this.health <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        // Stoppe nur die Spieler-bezogenen Aktionen
        this.player.destroy(); // Entferne das Spielerschiff
        
        // Stoppe nur die Schuss-Timer der Gegner
        this.time.removeAllEvents();
        
        // Entferne alle aktiven Schüsse und Energiedrops
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.energyDrops.clear(true, true);

        // Erstelle eine große Explosion für das Spielerschiff
        const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion1');
        explosion.setScale(4); // Größere Explosion
        explosion.play('explode');

        // Erstelle mehrere zusätzliche Explosionen für einen mächtigeren Effekt
        for (let i = 0; i < 5; i++) {
            const offsetX = Phaser.Math.Between(-50, 50);
            const offsetY = Phaser.Math.Between(-50, 50);
            const extraExplosion = this.add.sprite(
                this.player.x + offsetX,
                this.player.y + offsetY,
                'explosion1'
            );
            extraExplosion.setScale(3);
            extraExplosion.play('explode');
        }

        // Erstelle einen Blitz-Effekt
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillRect(0, 0, this.scale.width, this.scale.height);
        
        // Blitz-Effekt ausblenden
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Spiele Explosions-Sound
        this.sound.play('explosion', {
            volume: 0.8,
            rate: 0.8
        });

        // Warte kurz, bevor der Game Over Text erscheint
        this.time.delayedCall(1000, () => {
            const isMobile = this.sys.game.device.input.touch;
            const gameOverFontSize = isMobile ? '48px' : '72px';
            const scoreFontSize = isMobile ? '32px' : '48px';
            const buttonFontSize = isMobile ? '24px' : '32px';

            // Game Over Text - angepasste Größe
            this.add.text(this.scale.width / 2, this.scale.height * 0.3, 'GAME OVER', {
                fontSize: gameOverFontSize,
                color: '#ff0000',
                fontFamily: 'monospace',
                stroke: '#000',
                strokeThickness: 8
            }).setOrigin(0.5);

            // Score Text - angepasste Größe
            this.add.text(this.scale.width / 2, this.scale.height * 0.4, `SCORE: ${String(this.score).padStart(6, '0')}`, {
                fontSize: scoreFontSize,
                color: '#00ffff',
                fontFamily: 'monospace',
                stroke: '#000',
                strokeThickness: 6
            }).setOrigin(0.5);

            // Restart Button - angepasste Größe
            const buttonWidth = Math.min(160, this.scale.width * 0.3);
            const buttonHeight = 40;
            const buttonX = (this.scale.width / 2) - buttonWidth / 2;
            const buttonY = this.scale.height * 0.5;

            // Button Text - angepasste Größe
            const restartButton = this.add.text(buttonX + buttonWidth/2, buttonY + buttonHeight/2, 'RESTART', {
                fontSize: buttonFontSize,
                color: '#00ff00',
                fontFamily: 'monospace',
                stroke: '#000',
                strokeThickness: 4
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

            // Hover-Effekt für den Button
            restartButton.on('pointerover', () => {
                restartButton.setColor('#ffff00');
                this.tweens.add({
                    targets: restartButton,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            });

            restartButton.on('pointerout', () => {
                restartButton.setColor('#00ff00');
                this.tweens.add({
                    targets: restartButton,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            });

            // Klick-Effekt und Neustart
            restartButton.on('pointerdown', () => {
                // Entferne alle verbleibenden Gegner und Schüsse vor dem Neustart
                this.enemies.clear(true, true);
                this.bossEnemies.clear(true, true);
                this.asteroids.clear(true, true);
                this.bullets.clear(true, true);
                this.enemyBullets.clear(true, true);
                this.energyDrops.clear(true, true);
                this.scene.restart();
            });
        });
    }

    spawnAsteroid() {
        const asteroid = this.asteroids.create(this.scale.width, Phaser.Math.Between(50, this.scale.height - 50), 'asteroid');
        // Erhöhe die Geschwindigkeit basierend auf dem Schwierigkeitsgrad
        const baseSpeed = -150;
        const speedMultiplier = 1 + (this.difficulty - 1) * 0.15;
        asteroid.setVelocityX(baseSpeed * speedMultiplier);
        
        // Zufällige Größe zwischen 1.5 und 2.5
        const scale = Phaser.Math.Between(1.5, 2.5);
        asteroid.setScale(scale);
        
        // Speichere die ursprüngliche Y-Position
        asteroid.setData('originalY', asteroid.y);
        // Bewegungsreichweite
        asteroid.setData('moveRange', Phaser.Math.Between(100, 200));
        // Bewegungsgeschwindigkeit erhöht mit Schwierigkeitsgrad
        const baseMoveSpeed = Phaser.Math.Between(60, 100);
        asteroid.setData('moveSpeed', baseMoveSpeed * speedMultiplier);

        // Lebenspunkte basierend auf der Größe und dem Schwierigkeitsgrad
        const baseHealth = Math.floor(scale * 3);
        const healthMultiplier = 1 + (this.difficulty - 1) * 0.2;
        const health = Math.floor(baseHealth * healthMultiplier);
        asteroid.setData('health', health);
        asteroid.setData('maxHealth', health);
    }

    increaseDifficulty() {
        if (this.difficulty < this.MAX_DIFFICULTY) {
            this.difficulty++;
            console.log(`Schwierigkeitsgrad erhöht auf: ${this.difficulty}`);
            
            // Reduziere die Spawn-Raten mit jedem Level
            this.spawnRates.enemy = Math.max(500, 2000 - (this.difficulty - 1) * 300);
            this.spawnRates.boss = Math.max(5000, 15000 - (this.difficulty - 1) * 2000);
            this.spawnRates.asteroid = Math.max(1000, 5000 - (this.difficulty - 1) * 800);

            // Visuelles Feedback für Schwierigkeitserhöhung
            const text = this.add.text(this.scale.width / 2, this.scale.height / 2, `LEVEL ${this.difficulty}`, {
                fontSize: '48px',
                color: '#ff0000',
                fontFamily: 'monospace',
                stroke: '#000',
                strokeThickness: 6
            }).setOrigin(0.5);

            // Animation für den Text
            this.tweens.add({
                targets: text,
                alpha: 0,
                y: this.scale.height / 2 + 100,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => text.destroy()
            });

            // Spiele einen Sound für die Schwierigkeitserhöhung
            this.sound.play('explosion', {
                volume: 0.3,
                rate: 1.5
            });
        }
    }

    spawnEnergyDrop(x: number, y: number) {
        // 30% Chance auf Energiedrop
        if (Phaser.Math.Between(0, 100) < 30) {
            // Erstelle einen Container für die visuellen Elemente
            const container = this.add.container(x, y);
            
            // Erstelle den visuellen Kreis
            const circle = this.add.circle(0, 0, 15, 0x00ffff, 0.8);
            container.add(circle);
            
            // Füge den Text hinzu
            const text = this.add.text(0, 0, 'E', {
                fontSize: '20px',
                color: '#000000',
                fontFamily: 'monospace',
                stroke: '#ffffff',
                strokeThickness: 4
            }).setOrigin(0.5);
            container.add(text);

            // Pulsierende Animation
            this.tweens.add({
                targets: container,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Erstelle das Sprite für die Physik
            const drop = this.energyDrops.create(x, y);
            drop.setVisible(false); // Mache das Physik-Sprite unsichtbar
            drop.setScale(0.5); // Passe die Hitbox-Größe an
            drop.setVelocityX(-100); // Langsame Bewegung nach links zum Spieler
            drop.setVelocityY(0); // Keine vertikale Bewegung
            drop.setCollideWorldBounds(true);

            // Speichere den Container im Sprite
            drop.setData('container', container);

            // Timer zum Zerstören des Drops nach 5 Sekunden
            this.time.delayedCall(5000, () => {
                if (drop.active && container) {
                    // Fade-out Animation
                    this.tweens.add({
                        targets: container,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            container.destroy();
                            drop.destroy();
                        }
                    });
                }
            });
        }
    }

    collectEnergyDrop(drop: Phaser.Physics.Arcade.Sprite) {
        // Hole den Container aus den Daten
        const container = drop.getData('container');
        if (container) {
            // Erstelle einen Aufsammel-Effekt
            const collectEffect = this.add.circle(container.x, container.y, 20, 0x00ffff, 0.5);
            this.tweens.add({
                targets: collectEffect,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => collectEffect.destroy()
            });

            // Spiele einen Sound
            this.sound.play('explosion', {
                volume: 0.3,
                rate: 1.5
            });

            // Heile den Spieler
            this.health = Math.min(100, this.health + 20);
            this.updateHealthBar();

            // Zerstöre den Container und das Sprite
            container.destroy();
            drop.destroy();
        }
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: SpaceShooter,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game',
        width: '100%',
        height: '100%',
        min: {
            width: 800,
            height: 600
        },
        max: {
            width: 4096,
            height: 2160
        },
        autoRound: true,
        expandParent: true
    },
    dom: {
        createContainer: true
    },
    backgroundColor: '#000000'
};

// Füge CSS-Styles für das Game-Container hinzu
const style = document.createElement('style');
style.textContent = `
    #game {
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        background: #000 !important;
    }
    body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #000 !important;
        width: 100vw !important;
        height: 100vh !important;
    }
    canvas {
        margin: auto !important;
        object-fit: contain !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
    }
`;
document.head.appendChild(style);

// Füge Event-Listener für Orientierungsänderungen und Resize hinzu
window.addEventListener('resize', () => {
    const game = document.querySelector('canvas');
    if (game) {
        game.style.width = window.innerWidth + 'px';
        game.style.height = window.innerHeight + 'px';
    }
});

new Phaser.Game(config); 