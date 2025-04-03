import { BasePickup } from './basePickup';
import { Constants } from '../../utils/constants';
import { EventType } from '../../utils/eventBus';

/**
 * PowerPickup-Klasse
 * Ein Pickup, das die Laserwaffe des Spielers verbessert
 */
export class PowerPickup extends BasePickup {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Blaue Farbe für Power-Pickups und 'P' für den Text
    super(scene, x, y, 0x0066ff, 'P');
    
    // Überschreibe den Soundeffekt für Power-Pickups (etwas höherer Ton)
    this.soundRate = 1.8;
  }

  /**
   * Wird aufgerufen, wenn das Pickup eingesammelt wird
   */
  protected onCollect(): void {
    // Teile der Spielwelt mit, dass ein Power-Pickup eingesammelt wurde
    this.eventBus.emit(EventType.POWER_PICKUP_COLLECTED);
  }
} 