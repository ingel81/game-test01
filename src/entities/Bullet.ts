import { Entity } from './entity';
import { EventBus } from '../utils/eventBus';

/**
 * Bullet-Basisklasse
 * Eine gemeinsame Klasse für alle Projektile im Spiel
 * Steuert automatisch die Rotation basierend auf der Bewegungsrichtung
 */
export class Bullet extends Entity {
  protected damage: number;
  protected owner: 'player' | 'enemy';
  protected eventBus: EventBus;
  protected speed: number;
  protected shouldFlipX: boolean;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    texture: string,
    damage: number,
    speed: number,
    owner: 'player' | 'enemy',
    shouldFlipX: boolean = false
  ) {
    super(scene, x, y, texture);
    this.damage = damage;
    this.owner = owner;
    this.speed = speed;
    this.shouldFlipX = shouldFlipX;
    this.eventBus = EventBus.getInstance();
    
    // Speichere Referenz auf diese Instanz im Sprite
    this.sprite.setData('bulletInstance', this);
    this.sprite.setData('type', owner === 'player' ? 'playerBullet' : 'enemyBullet');
    this.sprite.setData('damage', damage);
    this.sprite.setData('owner', owner);
    
    // Initialisiere das Bullet
    this.init();
  }
  
  /**
   * Initialisierung nach der Erstellung
   */
  protected init(): void {
    // Optimiere für die Physik
    if (this.sprite.body) {
      // Verwende die richtigen Methoden für Arcade Physics Body
      if (this.sprite.body instanceof Phaser.Physics.Arcade.Body) {
        this.sprite.body.setAllowGravity(false);
        this.sprite.body.setBounce(0, 0);
        this.sprite.body.setCollideWorldBounds(false);
      }
    }
    
    // Sprite umdrehen, falls benötigt (für gegnerische Projektile)
    if (this.shouldFlipX) {
      this.sprite.setFlipX(true);
    }
  }
  
  /**
   * Setze Geschwindigkeit und aktualisiere die Rotation entsprechend
   */
  public setVelocityWithRotation(x: number, y: number): void {
    this.sprite.setVelocity(x, y);
    this.updateRotation();
  }
  
  /**
   * Setze Richtung und Geschwindigkeit basierend auf Winkel
   */
  public setDirectionAndSpeed(angleRadians: number): void {
    const velocityX = Math.cos(angleRadians) * this.speed;
    const velocityY = Math.sin(angleRadians) * this.speed;
    this.setVelocityWithRotation(velocityX, velocityY);
  }
  
  /**
   * Aktualisiere die Rotation basierend auf der aktuellen Geschwindigkeit
   */
  protected updateRotation(): void {
    if (this.sprite && this.sprite.body) {
      const vx = this.sprite.body.velocity.x;
      const vy = this.sprite.body.velocity.y;
      
      // Nur rotieren, wenn es eine signifikante Geschwindigkeit gibt
      if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
        this.sprite.setRotation(Math.atan2(vy, vx));
      }
    }
  }
  
  /**
   * Aktualisiert den Zustand des Projektils
   */
  public update(time: number, delta: number): void {
    // Überprüfe, ob das Projektil aktiv und im Spielbereich ist
    if (!this.sprite || !this.sprite.active) return;
    
    // Auto-Update der Rotation
    this.updateRotation();
    
    // Überprüfe, ob das Projektil außerhalb des Bildschirms ist und zerstöre es
    if (this.isOutOfBounds()) {
      this.destroy();
    }
  }
  
  /**
   * Überprüft, ob das Projektil außerhalb des Bildschirms ist
   */
  protected isOutOfBounds(): boolean {
    const buffer = 50; // Puffer für außerhalb des Bildschirms
    return (
      this.sprite.x < -buffer ||
      this.sprite.x > this.scene.scale.width + buffer ||
      this.sprite.y < -buffer ||
      this.sprite.y > this.scene.scale.height + buffer
    );
  }
  
  /**
   * Gibt den Schaden zurück, den das Projektil verursacht
   */
  public getDamage(): number {
    return this.damage;
  }
  
  /**
   * Gibt zurück, wem das Projektil gehört
   */
  public getOwner(): 'player' | 'enemy' {
    return this.owner;
  }
} 