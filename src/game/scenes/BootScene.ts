// Boot Scene - Load assets and initialize
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      percentText.setText(Math.round(value * 100) + '%');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load sound effects from kenney
    this.load.audio('se_hit_1', 'kenney/kenney_impact-sounds/Audio/impactMetal_medium_000.ogg');
    this.load.audio('se_hit_2', 'kenney/kenney_impact-sounds/Audio/impactMetal_medium_001.ogg');
    this.load.audio('se_hit_3', 'kenney/kenney_impact-sounds/Audio/impactMetal_medium_002.ogg');
    this.load.audio('se_special', 'kenney/kenney_interface-sounds/Audio/maximize_001.ogg');
    this.load.audio('se_ko', 'kenney/kenney_impact-sounds/Audio/impactGlass_heavy_001.ogg');
    this.load.audio('se_select', 'kenney/kenney_interface-sounds/Audio/select_001.ogg');
    this.load.audio('se_countdown', 'kenney/kenney_interface-sounds/Audio/tick_001.ogg');
    this.load.audio('se_menu_select', 'kenney/kenney_interface-sounds/Audio/click_001.ogg');
    this.load.audio('se_error', 'kenney/kenney_interface-sounds/Audio/error_001.ogg');
  }

  create(): void {
    // Generate procedural sound effects data
    this.registry.set('soundEnabled', true);
    
    // Terminal typing effect text
    const terminalText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: '#00ff00'
      }
    ).setOrigin(0.5);

    const bootMessage = '> Initializing Progmy...';
    let charIndex = 0;

    this.time.addEvent({
      delay: 50,
      repeat: bootMessage.length - 1,
      callback: () => {
        terminalText.text += bootMessage[charIndex];
        charIndex++;
        if (charIndex === bootMessage.length) {
          this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
          });
        }
      }
    });
  }
}
