// Result Scene - Post-battle results with Git-style scoring
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { Character } from '../data/characters';
import type { ScoreBreakdown } from '../systems/ScoreSystem';

interface BattleResult {
  character: Character;
  isPlayer: boolean;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  pushCount: number;
  stocks: number;
  damage: number;
}

interface ResultSceneData {
  results: BattleResult[];
  mode: string;
}

export class ResultScene extends Phaser.Scene {
  private results: BattleResult[] = [];
  private mode: string = '';

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: ResultSceneData): void {
    this.results = data.results || [];
    this.mode = data.mode || 'pve';
  }

  create(): void {
    // Fade in
    this.cameras.main.fadeIn(500);
    
    // Background
    this.createBackground();
    
    // Check if we have results
    if (this.results.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No results available', {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: '#ff0000'
      }).setOrigin(0.5);
      
      this.setupExitInput();
      return;
    }
    
    // Determine winner
    const winner = this.results[0];
    const playerResult = this.results.find(r => r.isPlayer);
    const playerWon = winner?.isPlayer || false;
    
    // Title
    const titleText = playerWon ? '[ VICTORY ]' : '[ DEFEAT ]';
    const titleColor = playerWon ? '#00ff00' : '#ff0000';
    
    this.add.text(GAME_WIDTH / 2, 60, titleText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: titleColor
    }).setOrigin(0.5);
    
    // Winner display with grass (push count)
    if (winner) {
      const grassText = '🌱'.repeat(Math.min(winner.pushCount, 10));
      this.add.text(GAME_WIDTH / 2, 110, `Winner: ${winner.character.name.en} ${grassText}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: winner.character.color
      }).setOrigin(0.5);
    }
    
    // Results table
    this.createResultsTable();
    
    // Player stats summary
    if (playerResult) {
      this.createPlayerSummary(playerResult);
    }
    
    // Continue prompt
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'ENTER: Rematch    ESC: Menu', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);
    
    // Blinking cursor effect
    const cursor = this.add.text(GAME_WIDTH / 2 + 130, GAME_HEIGHT - 80, '_', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: cursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Input
    this.setupExitInput();
  }

  private setupExitInput(): void {
    this.input.keyboard?.on('keydown-ENTER', () => this.continueGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.continueGame());
    this.input.keyboard?.on('keydown-ESC', () => this.returnToMenu());
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
    graphics.strokeRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40);
  }

  private createResultsTable(): void {
    const startY = 160;
    const rowHeight = 55;
    
    // Header
    const headers = [
      { x: 100, text: 'RANK' },
      { x: 220, text: 'CHARACTER' },
      { x: 420, text: 'PUSH' },
      { x: 520, text: 'STAGE' },
      { x: 620, text: 'COMMIT' },
      { x: 720, text: 'TOTAL' },
      { x: 850, text: 'STOCKS' },
    ];
    
    headers.forEach(h => {
      this.add.text(h.x, startY, h.text, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#666666'
      });
    });
    
    // Separator line
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 1);
    graphics.lineBetween(80, startY + 18, GAME_WIDTH - 80, startY + 18);
    
    // Results rows
    this.results.forEach((result, index) => {
      const y = startY + 30 + index * rowHeight;
      const isPlayer = result.isPlayer;
      const baseColor = isPlayer ? '#00ff00' : '#ffffff';
      
      // Highlight row for player
      if (isPlayer) {
        const highlight = this.add.graphics();
        highlight.fillStyle(0x00ff00, 0.1);
        highlight.fillRect(80, y - 8, GAME_WIDTH - 160, rowHeight - 10);
        highlight.setDepth(-1);
      }
      
      // Rank
      const rankText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
      this.add.text(100, y, rankText, {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: index === 0 ? '#ffd700' : baseColor
      });
      
      // Character name with player indicator
      const nameDisplay = result.character.name.en + (isPlayer ? ' (YOU)' : '');
      this.add.text(220, y, nameDisplay, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: result.character.color
      });
      
      // Push (main score)
      const pushDisplay = Math.floor(result.scoreBreakdown.push).toString();
      this.add.text(420, y, pushDisplay, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#00ff00'
      });
      
      // Stage
      const stageDisplay = Math.floor(result.scoreBreakdown.stage).toString();
      this.add.text(520, y, stageDisplay, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#888888'
      });
      
      // Commit
      const commitDisplay = Math.floor(result.scoreBreakdown.commit).toString();
      this.add.text(620, y, commitDisplay, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#888888'
      });
      
      // Total score
      this.add.text(720, y, result.score.toString(), {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: baseColor
      });
      
      // Stocks remaining
      const stocksDisplay = '●'.repeat(result.stocks) + '○'.repeat(3 - result.stocks);
      this.add.text(850, y, stocksDisplay, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: result.stocks > 0 ? '#00ff00' : '#ff0000'
      });
      
      // Grass indicator (push count)
      const grassCount = Math.min(result.pushCount, 5);
      if (grassCount > 0) {
        this.add.text(920, y, '🌱'.repeat(grassCount), {
          fontSize: '14px'
        });
      }
    });
  }

  private createPlayerSummary(playerResult: BattleResult): void {
    const y = GAME_HEIGHT - 180;
    
    // Box
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x00ff00, 0.5);
    graphics.strokeRect(GAME_WIDTH / 2 - 250, y - 20, 500, 90);
    
    // Stats
    const placement = this.results.indexOf(playerResult) + 1;
    const placementText = placement === 1 ? '1st Place! 🏆' : 
                          placement === 2 ? '2nd Place 🥈' : 
                          placement === 3 ? '3rd Place 🥉' : `${placement}th Place`;
    
    this.add.text(GAME_WIDTH / 2, y, `Your Result: ${placementText}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: placement === 1 ? '#ffd700' : '#00ff00'
    }).setOrigin(0.5);
    
    // Score breakdown
    const breakdown = playerResult.scoreBreakdown;
    this.add.text(GAME_WIDTH / 2, y + 30, 
      `Push: ${Math.floor(breakdown.push)} | Stage: ${Math.floor(breakdown.stage)} | Commit: ${Math.floor(breakdown.commit)} | Bonus: ${Math.floor(breakdown.bonus)}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5);
    
    this.add.text(GAME_WIDTH / 2, y + 50, 
      `Total Score: ${playerResult.score} | Final Damage: ${Math.floor(playerResult.damage)}%`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private continueGame(): void {
    // Clean up keyboard listeners
    this.input.keyboard?.removeAllListeners();
    
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      // Go back to character select for rematch
      this.scene.start('CharacterSelectScene', { mode: this.mode });
    });
  }

  private returnToMenu(): void {
    // Clean up keyboard listeners
    this.input.keyboard?.removeAllListeners();
    
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }
}
