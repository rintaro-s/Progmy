// Stick Figure Renderer - Draws hand-drawn style stick figures
import Phaser from 'phaser';
import type { Character } from '../data/characters';

export class StickFigureRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Create a full-size stick figure for battle
  createStickFigure(
    character: Character, 
    x: number = 0, 
    y: number = 0, 
    scale: number = 1
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const graphics = this.scene.add.graphics();
    
    const color = Phaser.Display.Color.HexStringToColor(character.color).color;
    const accentColor = Phaser.Display.Color.HexStringToColor(character.accentColor).color;
    
    // Add slight hand-drawn wobble
    const wobble = () => (Math.random() - 0.5) * 2 * scale;
    
    graphics.lineStyle(5 * scale, color, 1);
    
    // Head (circle with slight imperfection)
    graphics.strokeCircle(wobble(), -35 * scale + wobble(), 12 * scale);
    
    // Body
    graphics.lineBetween(
      wobble(), -23 * scale,
      wobble(), 15 * scale + wobble()
    );
    
    // Arms
    graphics.lineBetween(
      wobble(), -15 * scale + wobble(),
      -20 * scale + wobble(), 5 * scale + wobble()
    );
    graphics.lineBetween(
      wobble(), -15 * scale + wobble(),
      20 * scale + wobble(), 5 * scale + wobble()
    );
    
    // Legs
    graphics.lineBetween(
      wobble(), 15 * scale,
      -15 * scale + wobble(), 45 * scale + wobble()
    );
    graphics.lineBetween(
      wobble(), 15 * scale,
      15 * scale + wobble(), 45 * scale + wobble()
    );

    // Character-specific accent features
    this.addCharacterAccent(graphics, character, scale, accentColor);
    
    container.add(graphics);
    return container;
  }

  // Create mini version for selection grid
  createMiniStickFigure(
    character: Character,
    x: number = 0,
    y: number = 0
  ): Phaser.GameObjects.Container {
    return this.createStickFigure(character, x, y, 0.5);
  }

  // Add unique visual elements based on character
  private addCharacterAccent(
    graphics: Phaser.GameObjects.Graphics,
    character: Character,
    scale: number,
    accentColor: number
  ): void {
    graphics.lineStyle(2 * scale, accentColor, 0.8);
    
    switch (character.id) {
      case 'c_lang':
        // Pointer symbol on chest
        graphics.lineBetween(-5 * scale, -10 * scale, 0, -5 * scale);
        graphics.lineBetween(0, -5 * scale, 5 * scale, -10 * scale);
        break;
        
      case 'assembly':
        // Binary pattern
        graphics.fillStyle(accentColor, 0.8);
        for (let i = 0; i < 4; i++) {
          if (Math.random() > 0.5) {
            graphics.fillRect(-8 * scale + i * 5 * scale, -8 * scale, 3 * scale, 3 * scale);
          }
        }
        break;
        
      case 'cpp':
        // ++ symbol
        graphics.lineBetween(-8 * scale, -8 * scale, -8 * scale, 0);
        graphics.lineBetween(-12 * scale, -4 * scale, -4 * scale, -4 * scale);
        graphics.lineBetween(4 * scale, -8 * scale, 4 * scale, 0);
        graphics.lineBetween(0, -4 * scale, 8 * scale, -4 * scale);
        break;
        
      case 'rust':
        // Gear/cog shape on head
        graphics.strokeCircle(0, -35 * scale, 15 * scale);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          graphics.lineBetween(
            Math.cos(angle) * 12 * scale, -35 * scale + Math.sin(angle) * 12 * scale,
            Math.cos(angle) * 18 * scale, -35 * scale + Math.sin(angle) * 18 * scale
          );
        }
        break;
        
      case 'python':
        // Snake-like curve - simplified with lines
        graphics.beginPath();
        graphics.moveTo(-10 * scale, -5 * scale);
        graphics.lineTo(-5 * scale, -12 * scale);
        graphics.lineTo(5 * scale, -12 * scale);
        graphics.lineTo(10 * scale, -5 * scale);
        graphics.lineTo(5 * scale, 2 * scale);
        graphics.lineTo(-5 * scale, 2 * scale);
        graphics.lineTo(-10 * scale, -5 * scale);
        graphics.strokePath();
        break;
        
      case 'javascript':
        // JS letters
        graphics.fillStyle(accentColor, 1);
        graphics.fillRect(-10 * scale, -12 * scale, 8 * scale, 2 * scale);
        graphics.fillRect(-6 * scale, -12 * scale, 2 * scale, 8 * scale);
        graphics.fillRect(-10 * scale, -6 * scale, 6 * scale, 2 * scale);
        // S shape simplified
        graphics.fillRect(2 * scale, -12 * scale, 8 * scale, 2 * scale);
        graphics.fillRect(2 * scale, -12 * scale, 2 * scale, 4 * scale);
        graphics.fillRect(2 * scale, -9 * scale, 8 * scale, 2 * scale);
        graphics.fillRect(8 * scale, -9 * scale, 2 * scale, 4 * scale);
        graphics.fillRect(2 * scale, -6 * scale, 8 * scale, 2 * scale);
        break;
        
      case 'java':
        // Coffee cup shape
        graphics.strokeRect(-6 * scale, -12 * scale, 12 * scale, 10 * scale);
        graphics.lineBetween(6 * scale, -9 * scale, 10 * scale, -9 * scale);
        graphics.lineBetween(10 * scale, -9 * scale, 10 * scale, -5 * scale);
        graphics.lineBetween(10 * scale, -5 * scale, 6 * scale, -5 * scale);
        // Steam - simplified wavy line
        graphics.lineBetween(-2 * scale, -14 * scale, 0, -17 * scale);
        graphics.lineBetween(0, -17 * scale, 2 * scale, -14 * scale);
        break;
        
      case 'go':
        // Gopher ears
        graphics.fillStyle(accentColor, 1);
        graphics.fillCircle(-10 * scale, -45 * scale, 5 * scale);
        graphics.fillCircle(10 * scale, -45 * scale, 5 * scale);
        break;
        
      case 'haskell':
        // Lambda symbol
        graphics.lineStyle(3 * scale, accentColor, 1);
        graphics.lineBetween(-8 * scale, 0, 0, -15 * scale);
        graphics.lineBetween(0, -15 * scale, 8 * scale, 0);
        graphics.lineBetween(-4 * scale, -7 * scale, 4 * scale, -7 * scale);
        break;
        
      case 'swift':
        // Bird wing shape - simplified
        graphics.beginPath();
        graphics.moveTo(-15 * scale, -10 * scale);
        graphics.lineTo(-5 * scale, -18 * scale);
        graphics.lineTo(5 * scale, -10 * scale);
        graphics.lineTo(-5 * scale, -5 * scale);
        graphics.lineTo(-15 * scale, -10 * scale);
        graphics.strokePath();
        break;
        
      case 'ruby':
        // Gem shape
        graphics.beginPath();
        graphics.moveTo(0, -15 * scale);
        graphics.lineTo(8 * scale, -8 * scale);
        graphics.lineTo(5 * scale, 0);
        graphics.lineTo(-5 * scale, 0);
        graphics.lineTo(-8 * scale, -8 * scale);
        graphics.closePath();
        graphics.strokePath();
        break;
        
      case 'kotlin':
        // K shape
        graphics.lineBetween(-5 * scale, -12 * scale, -5 * scale, 0);
        graphics.lineBetween(-5 * scale, -6 * scale, 5 * scale, -12 * scale);
        graphics.lineBetween(-5 * scale, -6 * scale, 5 * scale, 0);
        break;
        
      case 'typescript':
        // TS letters
        graphics.fillStyle(accentColor, 1);
        graphics.fillRect(-12 * scale, -12 * scale, 10 * scale, 2 * scale);
        graphics.fillRect(-8 * scale, -12 * scale, 2 * scale, 10 * scale);
        // S
        graphics.fillRect(2 * scale, -12 * scale, 8 * scale, 2 * scale);
        graphics.fillRect(2 * scale, -12 * scale, 2 * scale, 3 * scale);
        graphics.fillRect(2 * scale, -8 * scale, 8 * scale, 2 * scale);
        graphics.fillRect(8 * scale, -6 * scale, 2 * scale, 3 * scale);
        graphics.fillRect(2 * scale, -4 * scale, 8 * scale, 2 * scale);
        break;
        
      case 'csharp':
        // # symbol
        graphics.lineBetween(-6 * scale, -12 * scale, -6 * scale, 0);
        graphics.lineBetween(0, -12 * scale, 0, 0);
        graphics.lineBetween(-10 * scale, -9 * scale, 4 * scale, -9 * scale);
        graphics.lineBetween(-10 * scale, -4 * scale, 4 * scale, -4 * scale);
        break;
        
      case 'lua':
        // Moon shape
        graphics.beginPath();
        graphics.arc(0, -8 * scale, 8 * scale, 0.5, Math.PI * 1.5);
        graphics.strokePath();
        graphics.beginPath();
        graphics.arc(4 * scale, -8 * scale, 6 * scale, 0.8, Math.PI * 1.2);
        graphics.strokePath();
        break;
        
      case 'dart':
        // Dart/arrow shape
        graphics.beginPath();
        graphics.moveTo(0, -15 * scale);
        graphics.lineTo(8 * scale, -5 * scale);
        graphics.lineTo(3 * scale, -5 * scale);
        graphics.lineTo(3 * scale, 5 * scale);
        graphics.lineTo(-3 * scale, 5 * scale);
        graphics.lineTo(-3 * scale, -5 * scale);
        graphics.lineTo(-8 * scale, -5 * scale);
        graphics.closePath();
        graphics.strokePath();
        break;
        
      default:
        // Generic accent - small circle
        graphics.strokeCircle(0, -8 * scale, 5 * scale);
    }
  }

  // Create animated stick figure with pose
  createAnimatedFigure(
    character: Character,
    x: number,
    y: number,
    scale: number = 1
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // We'll store body parts separately for animation
    const parts = {
      head: this.createHead(character, scale),
      body: this.createBody(character, scale),
      leftArm: this.createArm(character, scale, true),
      rightArm: this.createArm(character, scale, false),
      leftLeg: this.createLeg(character, scale, true),
      rightLeg: this.createLeg(character, scale, false)
    };
    
    container.add([
      parts.leftLeg, parts.rightLeg,
      parts.body,
      parts.leftArm, parts.rightArm,
      parts.head
    ]);
    
    container.setData('parts', parts);
    container.setData('character', character);
    
    return container;
  }

  private createHead(character: Character, scale: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(character.color).color;
    
    graphics.lineStyle(5 * scale, color, 1);
    graphics.strokeCircle(0, -35 * scale, 12 * scale);
    
    // Eyes
    graphics.fillStyle(color, 1);
    graphics.fillCircle(-4 * scale, -37 * scale, 2 * scale);
    graphics.fillCircle(4 * scale, -37 * scale, 2 * scale);
    
    return graphics;
  }

  private createBody(character: Character, scale: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(character.color).color;
    
    graphics.lineStyle(5 * scale, color, 1);
    graphics.lineBetween(0, -23 * scale, 0, 15 * scale);
    
    return graphics;
  }

  private createArm(character: Character, scale: number, isLeft: boolean): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(character.color).color;
    const dir = isLeft ? -1 : 1;
    
    graphics.lineStyle(5 * scale, color, 1);
    graphics.lineBetween(0, -15 * scale, dir * 20 * scale, 5 * scale);
    
    return graphics;
  }

  private createLeg(character: Character, scale: number, isLeft: boolean): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(character.color).color;
    const dir = isLeft ? -1 : 1;
    
    graphics.lineStyle(5 * scale, color, 1);
    graphics.lineBetween(0, 15 * scale, dir * 15 * scale, 45 * scale);
    
    return graphics;
  }
}
