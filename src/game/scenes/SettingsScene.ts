// Settings Scene
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ControlMode, loadSettings, saveSettings } from '../config';
import type { GameSettings } from '../config';

export class SettingsScene extends Phaser.Scene {
  private settings!: GameSettings;
  private menuItems: { text: Phaser.GameObjects.Text; key: keyof GameSettings; type: string }[] = [];
  private selectedIndex: number = 0;
  private editingName: boolean = false;
  private nameInputText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.settings = loadSettings();

    // Background
    this.createBackground();

    // Title
    this.add.text(GAME_WIDTH / 2, 60, '[ SETTINGS ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#00ff00'
    }).setOrigin(0.5);

    // Create menu items
    this.createMenuItems();

    // Instructions
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 
      '↑↓ : Navigate    ← → : Change Value    Space : Edit Name    Enter : Save & Back    Esc : Cancel', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#555555'
    }).setOrigin(0.5);

    // Input
    this.setupInput();
    this.updateDisplay();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    
    // Scanlines
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      graphics.fillStyle(0x000000, 0.1);
      graphics.fillRect(0, y, GAME_WIDTH, 2);
    }

    // Border
    graphics.lineStyle(2, 0x00ff00, 0.5);
    graphics.strokeRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20);
  }

  private createMenuItems(): void {
    const startY = 150;
    const spacing = 60;

    const items: { label: string; key: keyof GameSettings; type: string }[] = [
      { label: 'Control Mode', key: 'controlMode', type: 'controlMode' },
      { label: 'Sound', key: 'soundEnabled', type: 'boolean' },
      { label: 'Music Volume', key: 'musicVolume', type: 'volume' },
      { label: 'SFX Volume', key: 'sfxVolume', type: 'volume' },
      { label: 'Player Name', key: 'playerName', type: 'string' },
    ];

    items.forEach((item, index) => {
      const y = startY + index * spacing;

      // Label
      this.add.text(GAME_WIDTH / 2 - 200, y, item.label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: '#888888'
      });

      // Value
      const valueText = this.add.text(GAME_WIDTH / 2 + 100, y, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: '#00ff00'
      });

      this.menuItems.push({
        text: valueText,
        key: item.key,
        type: item.type
      });
    });
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    keyboard.on('keydown-UP', () => {
      if (!this.editingName) this.moveSelection(-1);
    });
    keyboard.on('keydown-DOWN', () => {
      if (!this.editingName) this.moveSelection(1);
    });
    keyboard.on('keydown-W', () => {
      if (!this.editingName) this.moveSelection(-1);
    });
    keyboard.on('keydown-S', () => {
      if (!this.editingName) this.moveSelection(1);
    });
    keyboard.on('keydown-LEFT', () => {
      if (!this.editingName) this.changeValue(-1);
    });
    keyboard.on('keydown-RIGHT', () => {
      if (!this.editingName) this.changeValue(1);
    });
    keyboard.on('keydown-A', () => {
      if (!this.editingName) this.changeValue(-1);
    });
    keyboard.on('keydown-D', () => {
      if (!this.editingName) this.changeValue(1);
    });
    keyboard.on('keydown-SPACE', () => {
      if (this.menuItems[this.selectedIndex].type === 'string') {
        this.startEditingName();
      }
    });
    keyboard.on('keydown-ENTER', () => {
      if (this.editingName) {
        this.stopEditingName();
      } else {
        this.saveAndExit();
      }
    });
    keyboard.on('keydown-ESC', () => {
      if (this.editingName) {
        this.stopEditingName();
      } else {
        this.cancel();
      }
    });
    
    // Handle text input when editing name
    keyboard.on('keydown', (event: KeyboardEvent) => {
      if (!this.editingName) return;
      
      if (event.key === 'Backspace') {
        this.settings.playerName = this.settings.playerName.slice(0, -1);
        this.updateDisplay();
      } else if (event.key.length === 1 && this.settings.playerName.length < 12) {
        this.settings.playerName += event.key;
        this.updateDisplay();
      }
    });
  }

  private moveSelection(direction: number): void {
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction,
      0,
      this.menuItems.length
    );
    this.updateDisplay();
  }

  private changeValue(direction: number): void {
    const item = this.menuItems[this.selectedIndex];
    
    switch (item.type) {
      case 'controlMode':
        const modes = Object.values(ControlMode);
        const currentIndex = modes.indexOf(this.settings.controlMode);
        const newIndex = Phaser.Math.Wrap(currentIndex + direction, 0, modes.length);
        this.settings.controlMode = modes[newIndex];
        break;
      
      case 'boolean':
        (this.settings as unknown as Record<string, unknown>)[item.key] = !this.settings[item.key];
        break;
      
      case 'volume':
        const current = this.settings[item.key] as number;
        (this.settings as unknown as Record<string, unknown>)[item.key] = Phaser.Math.Clamp(current + direction * 0.1, 0, 1);
        break;
      
      case 'string':
        // For string editing, we'd need a text input - skip for now
        break;
    }
    
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.menuItems.forEach((item, index) => {
      let displayValue = '';
      const value = this.settings[item.key];
      
      switch (item.type) {
        case 'controlMode':
          displayValue = `< ${value} >`;
          break;
        case 'boolean':
          displayValue = value ? '[ ON ]' : '[ OFF ]';
          break;
        case 'volume':
          const percent = Math.round((value as number) * 100);
          const bars = Math.round((value as number) * 10);
          displayValue = '|' + '█'.repeat(bars) + '░'.repeat(10 - bars) + `| ${percent}%`;
          break;
        case 'string':
          if (this.editingName && index === this.selectedIndex) {
            displayValue = `"${value}_"`;
          } else {
            displayValue = `"${value}"`;
          }
          break;
      }

      item.text.setText(displayValue);
      
      if (index === this.selectedIndex) {
        item.text.setStyle({ color: this.editingName && item.type === 'string' ? '#ffff00' : '#00ff00' });
      } else {
        item.text.setStyle({ color: '#666666' });
      }
    });
  }

  private startEditingName(): void {
    this.editingName = true;
    this.updateDisplay();
  }

  private stopEditingName(): void {
    this.editingName = false;
    this.updateDisplay();
  }

  private saveAndExit(): void {
    saveSettings(this.settings);
    this.cameras.main.flash(100, 0, 255, 0);
    // Clean up keyboard first, but keep time events for the delayedCall
    this.input.keyboard?.removeAllListeners();
    this.tweens.killAll();
    this.time.delayedCall(150, () => {
      this.time.removeAllEvents();
      this.scene.start('MenuScene');
    });
  }

  private cancel(): void {
    this.input.keyboard?.removeAllListeners();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.scene.start('MenuScene');
  }
}
