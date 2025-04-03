import { BasePickup } from './basePickup';
import { Constants } from '../../utils/constants';
import { EventType } from '../../utils/eventBus';

/**
 * EnergyPickup-Klasse
 * Ein Pickup, das die Gesundheit des Spielers wiederherstellt
 */
export class EnergyPickup extends BasePickup {
  private healAmount: number = Constants.ENERGY_HEAL_AMOUNT;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Türkise Farbe für Energy-Pickups und 'E' für den Text
    super(scene, x, y, 0x00ffff, 'E');
  }

  /**
   * Wird aufgerufen, wenn das Pickup eingesammelt wird
   */
  protected onCollect(): void {
    // Teile der Spielwelt mit, dass ein Pickup eingesammelt wurde
    this.eventBus.emit(EventType.PICKUP_COLLECTED, this.healAmount);
  }

  /**
   * Gibt die Heilungsmenge zurück
   */
  public getHealAmount(): number {
    return this.healAmount;
  }
} 