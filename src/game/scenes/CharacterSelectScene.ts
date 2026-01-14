// Character Selection Scene
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { characters } from '../data/characters';
import type { Character } from '../data/characters';
import { subComponents } from '../data/subcomponents';
import type { SubComponent } from '../data/subcomponents';
import { stages } from '../data/stages';
import { StickFigureRenderer } from '../entities/StickFigureRenderer';
import { AIDifficulty } from '../entities/AIController';

interface SceneData {
  mode: 'pve' | 'cpu' | 'training';
}

const DIFFICULTY_OPTIONS = [
  { key: AIDifficulty.EASY, name: 'Easy', color: '#66ff66', desc: 'For beginners' },
  { key: AIDifficulty.NORMAL, name: 'Normal', color: '#ffff66', desc: 'Standard difficulty' },
  { key: AIDifficulty.HARD, name: 'Hard', color: '#ff9966', desc: 'For advanced players' },
  { key: AIDifficulty.EXPERT, name: 'Expert', color: '#ff6666', desc: 'Pro level' },
];

export class CharacterSelectScene extends Phaser.Scene {
  private mode!: string;
  private selectedCharIndex: number = 0;
  private selectedSubIndex: number = 0;
  private selectedStageIndex: number = 0;
  private selectedDifficultyIndex: number = 1; // Default to Normal
  private selectionPhase: 'character' | 'subcomponent' | 'stage' | 'difficulty' = 'character';
  private characterGrid: Phaser.GameObjects.Container[] = [];
  private subGrid: Phaser.GameObjects.Container[] = [];
  private previewContainer!: Phaser.GameObjects.Container;
  private stickRenderer!: StickFigureRenderer;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data: SceneData): void {
    this.mode = data.mode || 'pve';
    // Reset selections
    this.selectedCharIndex = 0;
    this.selectedSubIndex = 0;
    this.selectedStageIndex = 0;
    this.selectedDifficultyIndex = 1;
    this.selectionPhase = 'character';
  }

  create(): void {
    // Clear previous grid data
    this.characterGrid = [];
    this.subGrid = [];
    
    this.stickRenderer = new StickFigureRenderer(this);
    
    // Background
    this.createBackground();

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '[ SELECT YOUR FIGHTER ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#00ff00'
    }).setOrigin(0.5);

    // Mode indicator
    this.add.text(GAME_WIDTH / 2, 60, `Mode: ${this.mode.toUpperCase()}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    // Create character grid
    this.createCharacterGrid();

    // Create sub-component grid (hidden initially)
    this.createSubComponentGrid();

    // Preview area
    this.createPreviewArea();

    // Instructions
    this.createInstructions();

    // Input
    this.setupInput();

    // Update initial selection
    this.updateSelection();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    
    // Grid pattern
    graphics.lineStyle(1, 0x1a1a1a, 1);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Border
    graphics.lineStyle(2, 0x00ff00, 0.5);
    graphics.strokeRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20);
  }

  private createCharacterGrid(): void {
    const startX = 60;
    const startY = 100;
    const cols = 6;
    const cellWidth = 95;
    const cellHeight = 90;

    characters.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * cellWidth;
      const y = startY + row * cellHeight;

      const container = this.add.container(x, y);

      // Character box
      const box = this.add.graphics();
      box.lineStyle(2, Phaser.Display.Color.HexStringToColor(char.color).color, 0.8);
      box.strokeRect(-35, -30, 70, 60);
      container.add(box);

      // Mini stick figure
      const figure = this.stickRenderer.createMiniStickFigure(char, 0, -5);
      container.add(figure);

      // Name
      const name = this.add.text(0, 25, char.name.en, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#888888'
      }).setOrigin(0.5);
      container.add(name);

      container.setData('index', index);
      container.setData('character', char);
      this.characterGrid.push(container);
    });
  }

  private createSubComponentGrid(): void {
    const startX = GAME_WIDTH - 350;
    const startY = 420;
    const cellWidth = 100;
    const cellHeight = 50;

    subComponents.forEach((sub, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = startX + col * cellWidth;
      const y = startY + row * cellHeight;

      const container = this.add.container(x, y);
      container.setVisible(false);

      const box = this.add.graphics();
      box.lineStyle(2, Phaser.Display.Color.HexStringToColor(sub.color).color, 0.6);
      box.strokeRect(-45, -20, 90, 40);
      container.add(box);

      const name = this.add.text(0, 0, sub.name, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#666666'
      }).setOrigin(0.5);
      container.add(name);

      container.setData('index', index);
      container.setData('subcomponent', sub);
      this.subGrid.push(container);
    });
  }

  private createPreviewArea(): void {
    this.previewContainer = this.add.container(GAME_WIDTH - 200, 250);

    // Preview box
    const previewBox = this.add.graphics();
    previewBox.lineStyle(2, 0x00ff00, 0.5);
    previewBox.strokeRect(-150, -130, 300, 260);
    this.previewContainer.add(previewBox);

    // Will be populated by updateSelection
  }

  private createInstructions(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 
      '← → ↑ ↓ : Navigate    Enter : Confirm    Esc : Back', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#555555'
    }).setOrigin(0.5);
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard!;
    
    keyboard.on('keydown-LEFT', () => this.navigate(-1, 0));
    keyboard.on('keydown-RIGHT', () => this.navigate(1, 0));
    keyboard.on('keydown-UP', () => this.navigate(0, -1));
    keyboard.on('keydown-DOWN', () => this.navigate(0, 1));
    keyboard.on('keydown-A', () => this.navigate(-1, 0));
    keyboard.on('keydown-D', () => this.navigate(1, 0));
    keyboard.on('keydown-W', () => this.navigate(0, -1));
    keyboard.on('keydown-S', () => this.navigate(0, 1));
    keyboard.on('keydown-H', () => this.navigate(-1, 0));
    keyboard.on('keydown-L', () => this.navigate(1, 0));
    keyboard.on('keydown-K', () => this.navigate(0, -1));
    keyboard.on('keydown-J', () => this.navigate(0, 1));
    keyboard.on('keydown-ENTER', () => this.confirm());
    keyboard.on('keydown-SPACE', () => this.confirm());
    keyboard.on('keydown-ESC', () => this.goBack());
  }

  private navigate(dx: number, dy: number): void {
    if (this.selectionPhase === 'character') {
      const cols = 6;
      const rows = Math.ceil(characters.length / cols);
      let col = this.selectedCharIndex % cols;
      let row = Math.floor(this.selectedCharIndex / cols);
      
      col = Phaser.Math.Wrap(col + dx, 0, cols);
      row = Phaser.Math.Wrap(row + dy, 0, rows);
      
      const newIndex = row * cols + col;
      if (newIndex < characters.length) {
        this.selectedCharIndex = newIndex;
      }
    } else if (this.selectionPhase === 'subcomponent') {
      const cols = 3;
      const rows = Math.ceil(subComponents.length / cols);
      let col = this.selectedSubIndex % cols;
      let row = Math.floor(this.selectedSubIndex / cols);
      
      col = Phaser.Math.Wrap(col + dx, 0, cols);
      row = Phaser.Math.Wrap(row + dy, 0, rows);
      
      const newIndex = row * cols + col;
      if (newIndex < subComponents.length) {
        this.selectedSubIndex = newIndex;
      }
    } else if (this.selectionPhase === 'stage') {
      this.selectedStageIndex = Phaser.Math.Wrap(
        this.selectedStageIndex + dx + dy,
        0,
        stages.length
      );
    } else if (this.selectionPhase === 'difficulty') {
      this.selectedDifficultyIndex = Phaser.Math.Wrap(
        this.selectedDifficultyIndex + dx + dy,
        0,
        DIFFICULTY_OPTIONS.length
      );
    }
    
    this.updateSelection();
  }

  private confirm(): void {
    if (this.selectionPhase === 'character') {
      this.selectionPhase = 'subcomponent';
      this.subGrid.forEach(c => c.setVisible(true));
    } else if (this.selectionPhase === 'subcomponent') {
      this.selectionPhase = 'stage';
    } else if (this.selectionPhase === 'stage') {
      // Skip difficulty for training mode
      if (this.mode === 'training') {
        this.startBattle();
      } else {
        this.selectionPhase = 'difficulty';
      }
    } else if (this.selectionPhase === 'difficulty') {
      this.startBattle();
    }
    this.updateSelection();
  }

  private goBack(): void {
    if (this.selectionPhase === 'difficulty') {
      this.selectionPhase = 'stage';
    } else if (this.selectionPhase === 'stage') {
      this.selectionPhase = 'subcomponent';
    } else if (this.selectionPhase === 'subcomponent') {
      this.selectionPhase = 'character';
      this.subGrid.forEach(c => c.setVisible(false));
    } else {
      // Clean up before exiting
      this.input.keyboard?.removeAllListeners();
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.scene.start('MenuScene');
    }
    this.updateSelection();
  }

  private updateSelection(): void {
    // Update character grid highlights
    this.characterGrid.forEach((container, index) => {
      const box = container.getAt(0) as Phaser.GameObjects.Graphics;
      const char = container.getData('character') as Character;
      const color = Phaser.Display.Color.HexStringToColor(char.color).color;
      
      box.clear();
      if (index === this.selectedCharIndex) {
        box.fillStyle(color, 0.3);
        box.fillRect(-35, -30, 70, 60);
        box.lineStyle(3, 0x00ff00, 1);
      } else {
        box.lineStyle(2, color, 0.5);
      }
      box.strokeRect(-35, -30, 70, 60);
    });

    // Update sub-component grid
    this.subGrid.forEach((container, index) => {
      const box = container.getAt(0) as Phaser.GameObjects.Graphics;
      const sub = container.getData('subcomponent') as SubComponent;
      if (!sub) return;
      const color = Phaser.Display.Color.HexStringToColor(sub.color).color;
      
      box.clear();
      if (this.selectionPhase === 'subcomponent' && index === this.selectedSubIndex) {
        box.fillStyle(color, 0.3);
        box.fillRect(-45, -20, 90, 40);
        box.lineStyle(2, 0x00ff00, 1);
      } else {
        box.lineStyle(2, color, 0.4);
      }
      box.strokeRect(-45, -20, 90, 40);
    });

    // Update preview
    this.updatePreview();
  }

  private updatePreview(): void {
    // Clear previous preview content (keep the box)
    while (this.previewContainer.length > 1) {
      this.previewContainer.removeAt(1, true);
    }

    const char = characters[this.selectedCharIndex];

    // Large stick figure preview
    const figure = this.stickRenderer.createStickFigure(char, 0, -30, 1.5);
    this.previewContainer.add(figure);

    // Character name
    const nameText = this.add.text(0, 60, char.name.en, {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: char.color
    }).setOrigin(0.5);
    this.previewContainer.add(nameText);

    // Type
    const typeText = this.add.text(0, 85, char.type, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5);
    this.previewContainer.add(typeText);

    // Subcomponent info (if in subcomponent phase)
    if (this.selectionPhase === 'subcomponent') {
      const sub = subComponents[this.selectedSubIndex];
      const subNameText = this.add.text(0, -90, `Sub: ${sub.name}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: sub.color
      }).setOrigin(0.5);
      this.previewContainer.add(subNameText);
      
      const subDescText = this.add.text(0, -70, sub.description.en, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#aaaaaa',
        align: 'center',
        wordWrap: { width: 280 }
      }).setOrigin(0.5);
      this.previewContainer.add(subDescText);
      
      const passiveText = this.add.text(0, -35, `Passive: ${sub.ability.passive.name}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#66ff66'
      }).setOrigin(0.5);
      this.previewContainer.add(passiveText);
      
      const activeText = this.add.text(0, -20, `Active: ${sub.ability.active.name}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#66ccff'
      }).setOrigin(0.5);
      this.previewContainer.add(activeText);
    }

    // Stats display
    const statsY = 105;
    const stats = [
      { name: 'HP', value: char.stats.hp, color: '#ff6666' },
      { name: 'ATK', value: char.stats.physical_atk, color: '#ff9966' },
      { name: 'LOG', value: char.stats.logic_atk, color: '#66ccff' },
      { name: 'SPD', value: char.stats.speed, color: '#66ff66' },
    ];

    stats.forEach((stat, i) => {
      const y = statsY + i * 14;
      const label = this.add.text(-60, y, stat.name, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#666666'
      });
      this.previewContainer.add(label);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x333333, 1);
      barBg.fillRect(-30, y, 80, 8);
      this.previewContainer.add(barBg);

      const bar = this.add.graphics();
      bar.fillStyle(Phaser.Display.Color.HexStringToColor(stat.color).color, 1);
      bar.fillRect(-30, y, (stat.value / 100) * 80, 8);
      this.previewContainer.add(bar);
    });

    // Phase indicator
    const phaseText = this.add.text(0, -120, 
      this.selectionPhase === 'character' ? '[ Select Character ]' :
      this.selectionPhase === 'subcomponent' ? '[ Select Companion ]' :
      this.selectionPhase === 'difficulty' ? '[ Select Difficulty ]' :
      '[ Select Stage ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#00ff00'
    }).setOrigin(0.5);
    this.previewContainer.add(phaseText);

    // Stage selection display
    if (this.selectionPhase === 'stage') {
      const stage = stages[this.selectedStageIndex];
      const stageText = this.add.text(0, 150, `Stage: ${stage.name.en}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#00ff00'
      }).setOrigin(0.5);
      this.previewContainer.add(stageText);

      const stageNav = this.add.text(0, 170, '< ← → >', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#666666'
      }).setOrigin(0.5);
      this.previewContainer.add(stageNav);
    }

    // Difficulty selection display
    if (this.selectionPhase === 'difficulty') {
      const diff = DIFFICULTY_OPTIONS[this.selectedDifficultyIndex];
      const diffText = this.add.text(0, 140, `AI: ${diff.name}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: diff.color
      }).setOrigin(0.5);
      this.previewContainer.add(diffText);

      const diffDesc = this.add.text(0, 165, diff.desc, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#888888'
      }).setOrigin(0.5);
      this.previewContainer.add(diffDesc);

      const diffNav = this.add.text(0, 185, '< ← → >', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#666666'
      }).setOrigin(0.5);
      this.previewContainer.add(diffNav);
    }
  }

  private startBattle(): void {
    const selectedCharacter = characters[this.selectedCharIndex];
    const selectedSub = subComponents[this.selectedSubIndex];
    const selectedStage = stages[this.selectedStageIndex];
    const selectedDifficulty = DIFFICULTY_OPTIONS[this.selectedDifficultyIndex].key;

    // Clean up before transition
    this.input.keyboard?.removeAllListeners();
    this.tweens.killAll();

    this.cameras.main.fade(300, 0, 0, 0);
    
    this.time.delayedCall(300, () => {
      this.time.removeAllEvents();
      this.scene.start('BattleScene', {
        mode: this.mode,
        playerCharacter: selectedCharacter,
        playerSub: selectedSub,
        stage: selectedStage,
        aiDifficulty: selectedDifficulty
      });
    });
  }
}
