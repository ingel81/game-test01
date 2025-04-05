import { BaseScene } from './baseScene';
import { Constants } from '../utils/constants';
import { EventType, EventBus } from '../utils/eventBus';
import { MusicManager } from '../managers/musicManager';

/**
 * Game Finished Scene
 */
export class FinishedScene extends BaseScene {
  private score: number = 0;
  private musicManager: MusicManager;

  constructor() {
    super(Constants.SCENE_FINISHED);
    this.musicManager = MusicManager.getInstance();
  }

  /**
   * Initialize the scene
   */
  init(data: { score: number }): void {
    this.score = data.score;
  }

  /**
   * Create the Finished scene
   */
  create(): void {
    super.create();

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Initialize the MusicManager
    this.musicManager.init(this);
    
    // Make sure cursor is visible
    document.body.style.cursor = 'default';

    // Game completed text
    this.add.text(centerX, centerY - 100, 'Game Completed!', {
      fontSize: '48px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Score display
    this.add.text(centerX, centerY, `Your Score: ${this.score}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Congratulations text
    this.add.text(centerX, centerY + 50, 'Congratulations!', {
      fontSize: '28px',
      color: '#dddddd',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Play Again button
    this.createButton(centerX, centerY + 120, 'Play Again', () => {
      // Complete reset before restart
      // Reset EventBus
      EventBus.resetInstance();
      
      // Stop all sounds
      this.sound.stopAll();
      
      // Stop all active scenes
      this.scene.stop(Constants.SCENE_FINISHED);
      
      // Small pause for resource cleanup
      setTimeout(() => {
        // Restart the game scene
        this.scene.start(Constants.SCENE_GAME);
      }, 50);
    });

    // Main Menu button
    this.createButton(centerX, centerY + 180, 'Main Menu', () => {
      // Reset EventBus
      EventBus.resetInstance();
      
      // Stop all sounds
      this.sound.stopAll();
      
      // Start the main menu directly
      this.scene.start(Constants.SCENE_MAIN_MENU);
    });
  }

  /**
   * Update the Finished scene
   */
  update(time: number, delta: number): void {
    // Call the BaseScene update method to update stars
    super.update(time, delta);
  }
} 