// Scene Manager - Centralized scene transition handling
import Phaser from 'phaser';

export class SceneTransition {
  static cleanupAndStart(scene: Phaser.Scene, targetScene: string, data?: object): void {
    // Remove all keyboard listeners
    scene.input.keyboard?.removeAllListeners();
    
    // Stop all time events
    scene.time.removeAllEvents();
    
    // Stop all tweens
    scene.tweens.killAll();
    
    // Fade out and transition
    scene.cameras.main.fade(300, 0, 0, 0);
    scene.time.delayedCall(300, () => {
      scene.scene.start(targetScene, data);
    });
  }
  
  static quickStart(scene: Phaser.Scene, targetScene: string, data?: object): void {
    // Remove all keyboard listeners
    scene.input.keyboard?.removeAllListeners();
    
    // Stop all time events
    scene.time.removeAllEvents();
    
    // Stop all tweens
    scene.tweens.killAll();
    
    // Immediate transition
    scene.scene.start(targetScene, data);
  }
}
