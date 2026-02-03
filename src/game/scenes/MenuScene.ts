// Main Menu Scene
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SceneTransition } from '../utils/SceneTransition';

interface MenuOption {
  text: string;
  desc: string;
  scene: string;
  mode: string | null;
}

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private descTexts: Phaser.GameObjects.Text[] = [];
  private selectedIndex: number = 0;
  private cursorBlink!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Reset state
    this.menuItems = [];
    this.descTexts = [];
    this.selectedIndex = 0;
    
    // Background with terminal effect
    this.createTerminalBackground();

    // Title with ASCII art style
    this.titleText = this.add.text(GAME_WIDTH / 2, 100, `
██████╗ ██████╗  ██████╗  ██████╗ ███╗   ███╗██╗   ██╗
██╔══██╗██╔══██╗██╔═══██╗██╔════╝ ████╗ ████║╚██╗ ██╔╝
██████╔╝██████╔╝██║   ██║██║  ███╗██╔████╔██║ ╚████╔╝ 
██╔═══╝ ██╔══██╗██║   ██║██║   ██║██║╚██╔╝██║  ╚██╔╝  
██║     ██║  ██║╚██████╔╝╚██████╔╝██║ ╚═╝ ██║   ██║   
╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝   ╚═╝   
    `, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#00ff00',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 210, 'Programming Language Battle Arena', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);

    // Menu items - clear and descriptive
    const menuOptions: MenuOption[] = [
      { text: '1v1 Battle', desc: 'Fight against 1 CPU opponent', scene: 'CharacterSelectScene', mode: 'cpu' },
      { text: 'Free For All', desc: '4-player battle (You + 3 CPUs)', scene: 'CharacterSelectScene', mode: 'pve' },
      { text: 'Practice', desc: 'Train with a sandbag', scene: 'InteractiveTutorialScene', mode: 'basics' },
      { text: 'How to Play', desc: 'Rules and controls', scene: 'TutorialScene', mode: 'basics' },
      { text: 'Settings', desc: 'Options', scene: 'SettingsScene', mode: null },
    ];

    const startY = 290;
    const spacing = 55;

    menuOptions.forEach((option, index) => {
      // Main text
      const text = this.add.text(GAME_WIDTH / 2, startY + index * spacing, 
        `  ${option.text}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: index === 0 ? '#00ff00' : '#666666'
      }).setOrigin(0.5);
      
      text.setData('scene', option.scene);
      text.setData('mode', option.mode);
      this.menuItems.push(text);
      
      // Description text
      const desc = this.add.text(GAME_WIDTH / 2, startY + index * spacing + 22, 
        option.desc, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: index === 0 ? '#00aa00' : '#444444'
      }).setOrigin(0.5);
      this.descTexts.push(desc);
    });

    // Cursor blink effect
    this.updateCursor();
    this.cursorBlink = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: this.blinkCursor,
      callbackScope: this
    });

    // Instructions
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 
      'Up/Down: Select    Enter: Confirm', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#555555'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 
      'v0.3.0 | Smash-style Battle', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#333333'
    }).setOrigin(0.5);

    // Input handling
    this.setupInput();
  }

  private createTerminalBackground(): void {
    // Scanline effect
    const graphics = this.add.graphics();
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      graphics.fillStyle(0x000000, 0.1);
      graphics.fillRect(0, y, GAME_WIDTH, 2);
    }

    // Border frame
    graphics.lineStyle(2, 0x00ff00, 0.3);
    graphics.strokeRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40);

    // Corner decorations
    const cornerSize = 20;
    graphics.lineStyle(2, 0x00ff00, 0.5);
    // Top-left
    graphics.lineBetween(20, 20 + cornerSize, 20, 20);
    graphics.lineBetween(20, 20, 20 + cornerSize, 20);
    // Top-right
    graphics.lineBetween(GAME_WIDTH - 20 - cornerSize, 20, GAME_WIDTH - 20, 20);
    graphics.lineBetween(GAME_WIDTH - 20, 20, GAME_WIDTH - 20, 20 + cornerSize);
    // Bottom-left
    graphics.lineBetween(20, GAME_HEIGHT - 20 - cornerSize, 20, GAME_HEIGHT - 20);
    graphics.lineBetween(20, GAME_HEIGHT - 20, 20 + cornerSize, GAME_HEIGHT - 20);
    // Bottom-right
    graphics.lineBetween(GAME_WIDTH - 20, GAME_HEIGHT - 20 - cornerSize, GAME_WIDTH - 20, GAME_HEIGHT - 20);
    graphics.lineBetween(GAME_WIDTH - 20 - cornerSize, GAME_HEIGHT - 20, GAME_WIDTH - 20, GAME_HEIGHT - 20);
  }

  private setupInput(): void {
    // Keyboard controls
    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-K', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-J', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.selectOption());
    this.input.keyboard?.on('keydown-SPACE', () => this.selectOption());
  }

  private moveSelection(direction: number): void {
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction, 
      0, 
      this.menuItems.length
    );
    this.updateCursor();
    
    // Play selection sound
    try {
      this.sound.play('se_select', { volume: 0.3 });
    } catch (e) {
      // SE not available yet
    }
  }

  private updateCursor(): void {
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.setStyle({ color: '#00ff00' });
        item.setText('> ' + item.text.substring(2));
        this.descTexts[index].setStyle({ color: '#00aa00' });
      } else {
        item.setStyle({ color: '#666666' });
        if (item.text.startsWith('>')) {
          item.setText('  ' + item.text.substring(2));
        }
        this.descTexts[index].setStyle({ color: '#444444' });
      }
    });
  }

  private blinkCursor(): void {
    const selected = this.menuItems[this.selectedIndex];
    if (selected.text.startsWith('>')) {
      selected.setText('  ' + selected.text.substring(2));
    } else {
      selected.setText('> ' + selected.text.substring(2));
    }
  }

  private selectOption(): void {
    const selected = this.menuItems[this.selectedIndex];
    const targetScene = selected.getData('scene');
    const mode = selected.getData('mode');

    // Play confirm sound
    try {
      this.sound.play('se_menu_select', { volume: 0.5 });
    } catch (e) {
      // SE not available
    }

    // Flash effect
    this.cameras.main.flash(100, 0, 255, 0);

    // Cleanup
    this.input.keyboard?.removeAllListeners();
    if (this.cursorBlink) {
      this.cursorBlink.destroy();
    }

    this.time.delayedCall(150, () => {
      // Important: don't remove all events before delayedCall,
      // or the transition timer gets cancelled and the game appears frozen.
      this.time.removeAllEvents();
      if (targetScene) {
        if (targetScene === 'TutorialScene' || targetScene === 'InteractiveTutorialScene') {
          this.scene.start(targetScene, { type: 'basics' });
        } else {
          this.scene.start(targetScene, { mode });
        }
      }
    });
  }
}
