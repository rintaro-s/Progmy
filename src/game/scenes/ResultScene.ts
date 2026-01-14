// Result Scene - Post-battle results
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { Character } from '../data/characters';

interface BattleResult {
  character: Character;
  isPlayer: boolean;
  score: number;
  stocks: number;
  damage: number;
}

interface ResultSceneData {
  results: BattleResult[];
  mode: string;
}

export class ResultScene extends Phaser.Scene {
  private results!: BattleResult[];
  private mode!: string;

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: ResultSceneData): void {
    this.results = data.results;
    this.mode = data.mode;
  }

  create(): void {
    this.cameras.main.fadeIn(300);
    
    // Background
    this.createBackground();
    
    // Determine winner
    const winner = this.results[0];
    const playerResult = this.results.find(r => r.isPlayer);
    const playerWon = winner.isPlayer;
    
    // Title
    const titleText = playerWon ? '[ VICTORY ]' : '[ DEFEAT ]';
    const titleColor = playerWon ? '#00ff00' : '#ff0000';
    
    this.add.text(GAME_WIDTH / 2, 80, titleText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: titleColor
    }).setOrigin(0.5);
    
    // Winner display
    this.add.text(GAME_WIDTH / 2, 140, `Winner: ${winner.character.name.en}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: winner.character.color
    }).setOrigin(0.5);
    
    // Results table
    this.createResultsTable();
    
    // Player stats summary
    if (playerResult) {
      this.createPlayerSummary(playerResult);
    }
    
    // Continue prompt
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Press ENTER to continue', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5);
    
    // Blinking cursor effect
    const cursor = this.add.text(GAME_WIDTH / 2 + 150, GAME_HEIGHT - 60, '_', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
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
    this.input.keyboard?.on('keydown-ENTER', () => this.continue());
    this.input.keyboard?.on('keydown-SPACE', () => this.continue());
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
    const startY = 200;
    const rowHeight = 50;
    
    // Header
    this.add.text(150, startY, 'RANK', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#666666'
    });
    this.add.text(300, startY, 'CHARACTER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#666666'
    });
    this.add.text(550, startY, 'STOCKS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#666666'
    });
    this.add.text(700, startY, 'SCORE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#666666'
    });
    this.add.text(900, startY, 'FINAL DMG', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#666666'
    });
    
    // Separator line
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 1);
    graphics.lineBetween(100, startY + 25, GAME_WIDTH - 100, startY + 25);
    
    // Results rows
    this.results.forEach((result, index) => {
      const y = startY + 40 + index * rowHeight;
      const isPlayer = result.isPlayer;
      const color = isPlayer ? '#00ff00' : '#ffffff';
      
      // Rank
      const rankText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
      this.add.text(150, y, rankText, {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: index === 0 ? '#ffd700' : color
      });
      
      // Character name with player indicator
      const nameDisplay = result.character.name.en + (isPlayer ? ' (YOU)' : '');
      this.add.text(300, y, nameDisplay, {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: result.character.color
      });
      
      // Stocks remaining
      const stocksDisplay = '●'.repeat(result.stocks) + '○'.repeat(3 - result.stocks);
      this.add.text(550, y, stocksDisplay, {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: result.stocks > 0 ? '#00ff00' : '#ff0000'
      });
      
      // Score
      this.add.text(700, y, result.score.toString(), {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: color
      });
      
      // Final damage
      const damageColor = result.damage < 50 ? '#00ff00' : result.damage < 100 ? '#ffff00' : '#ff0000';
      this.add.text(900, y, `${Math.floor(result.damage)}%`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: damageColor
      });
      
      // Highlight row for player
      if (isPlayer) {
        const highlight = this.add.graphics();
        highlight.fillStyle(0x00ff00, 0.1);
        highlight.fillRect(100, y - 10, GAME_WIDTH - 200, rowHeight - 10);
        highlight.setDepth(-1);
      }
    });
  }

  private createPlayerSummary(playerResult: BattleResult): void {
    const y = GAME_HEIGHT - 180;
    
    // Box
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x00ff00, 0.5);
    graphics.strokeRect(GAME_WIDTH / 2 - 200, y - 20, 400, 80);
    
    // Stats
    const placement = this.results.indexOf(playerResult) + 1;
    const placementText = placement === 1 ? '1st Place!' : 
                          placement === 2 ? '2nd Place' : 
                          placement === 3 ? '3rd Place' : `${placement}th Place`;
    
    this.add.text(GAME_WIDTH / 2, y, `Your Result: ${placementText}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: placement === 1 ? '#ffd700' : '#00ff00'
    }).setOrigin(0.5);
    
    this.add.text(GAME_WIDTH / 2, y + 30, `Score: ${playerResult.score} | Stocks: ${playerResult.stocks}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  private continue(): void {
    // Clean up before transition
    this.input.keyboard?.removeAllListeners();
    this.tweens.killAll();
    
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.time.removeAllEvents();
      // Go back to character select for rematch
      this.scene.start('CharacterSelectScene', { mode: this.mode });
    });
  }

  private returnToMenu(): void {
    // Clean up before transition
    this.input.keyboard?.removeAllListeners();
    this.tweens.killAll();
    
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.time.removeAllEvents();
      this.scene.start('MenuScene');
    });
  }
}
