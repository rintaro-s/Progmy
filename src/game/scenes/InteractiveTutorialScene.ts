// Interactive Tutorial Scene - Learn by doing, not reading
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ControlMode, loadSettings } from '../config';
import { characters } from '../data/characters';
import type { Character } from '../data/characters';
import { subComponents } from '../data/subcomponents';
import type { SubComponent } from '../data/subcomponents';
import { Fighter } from '../entities/Fighter';
import { StickFigureRenderer } from '../entities/StickFigureRenderer';

type TutorialType = 'basics' | 'character' | 'subcomponent' | 'controls';

interface TutorialStep {
  title: string;
  instruction: string;
  checkComplete: () => boolean;
  onStart?: () => void;
  hint?: string;
}

export class InteractiveTutorialScene extends Phaser.Scene {
  private tutorialType: TutorialType = 'basics';
  private selectedCharacter?: Character;
  private selectedSub?: SubComponent;
  private currentStep: number = 0;
  private steps: TutorialStep[] = [];
  private stepCompleted: boolean = false;
  
  // Player and dummy for practice
  private player!: Fighter;
  private dummy!: Fighter;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  
  // UI
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private successText!: Phaser.GameObjects.Text;
  private damageDisplay!: Phaser.GameObjects.Text;
  
  // Tracking
  private hasJumped: boolean = false;
  private hasMoved: boolean = false;
  private hasAttacked: boolean = false;
  private hasHitDummy: boolean = false;
  private dummyKOed: boolean = false;
  private hasUsedSpecial: boolean = false;
  private comboCount: number = 0;
  
  // Controls
  private controlMode!: ControlMode;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { [key: string]: Phaser.Input.Keyboard.Key };
  private actionKeys!: { [key: string]: Phaser.Input.Keyboard.Key };
  
  private stickRenderer!: StickFigureRenderer;
  
  constructor() {
    super({ key: 'InteractiveTutorialScene' });
  }

  init(data: { type?: TutorialType; character?: Character; subComponent?: SubComponent }): void {
    this.tutorialType = data.type || 'basics';
    this.selectedCharacter = data.character || characters[0];
    this.selectedSub = data.subComponent;
    this.currentStep = 0;
    this.stepCompleted = false;
    
    // Reset tracking
    this.hasJumped = false;
    this.hasMoved = false;
    this.hasAttacked = false;
    this.hasHitDummy = false;
    this.dummyKOed = false;
    this.hasUsedSpecial = false;
    this.comboCount = 0;
  }

  create(): void {
    const settings = loadSettings();
    this.controlMode = settings.controlMode;
    
    this.stickRenderer = new StickFigureRenderer(this);
    
    // Background
    this.createBackground();
    
    // Create simple platform
    this.createPlatforms();
    
    // Create player and dummy
    this.createFighters();
    
    // Setup collisions
    this.setupCollisions();
    
    // Generate tutorial steps
    this.generateSteps();
    
    // Create UI
    this.createUI();
    
    // Setup controls
    this.setupControls();
    
    // Start first step
    this.startCurrentStep();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    
    // Fill background
    graphics.fillStyle(0x0a0a0a, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Grid pattern
    graphics.lineStyle(1, 0x1a1a1a, 1);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }
    
    // Tutorial label
    this.add.text(GAME_WIDTH - 20, 20, '[ TRAINING MODE ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#ffff00'
    }).setOrigin(1, 0);
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    // Main platform
    const mainPlat = this.add.rectangle(GAME_WIDTH / 2, 550, 700, 32, 0x00ff00, 0.2);
    this.physics.add.existing(mainPlat, true);
    this.platforms.add(mainPlat);
    
    // Draw platform outline
    const graphics = this.add.graphics();
    graphics.lineStyle(3, 0x00ff00, 0.8);
    graphics.strokeRect(GAME_WIDTH / 2 - 350, 550 - 16, 700, 32);
    
    // Kill zone indicators
    graphics.lineStyle(2, 0xff0000, 0.3);
    graphics.strokeRect(-50, -50, GAME_WIDTH + 100, GAME_HEIGHT + 150);
    
    this.add.text(GAME_WIDTH / 2, 620, 'v Off stage = KO v', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#ff6666'
    }).setOrigin(0.5);
  }

  private createFighters(): void {
    const playerChar = this.selectedCharacter || characters[0];
    const dummyChar = characters.find(c => c.id !== playerChar.id) || characters[1];
    
    // Create player
    this.player = new Fighter({
      scene: this,
      x: GAME_WIDTH / 2 - 100,
      y: 450,
      character: playerChar,
      subComponent: this.selectedSub,
      isPlayer: true,
      playerIndex: 0
    });
    
    // Create training dummy
    this.dummy = new Fighter({
      scene: this,
      x: GAME_WIDTH / 2 + 100,
      y: 450,
      character: dummyChar,
      subComponent: undefined,
      isPlayer: false,
      playerIndex: 1
    });
    
    // Dummy starts facing left
    this.dummy.facingRight = false;
    
    // Player label
    this.add.text(GAME_WIDTH / 2 - 100, 380, 'YOU', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: playerChar.color
    }).setOrigin(0.5);
    
    // Dummy label  
    this.add.text(GAME_WIDTH / 2 + 100, 380, 'SANDBAG', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.dummy, this.platforms);
    
    // Hit detection
    this.physics.add.overlap(
      this.player,
      this.dummy,
      () => this.handlePlayerAttack(),
      (player) => {
        const p = player as Fighter;
        return p.isAttacking && !this.dummy.isInvincible;
      },
      this
    );
  }

  private handlePlayerAttack(): void {
    if (!this.player.isAttacking) return;
    
    const damage = 8 + Math.random() * 4;
    this.dummy.takeDamage(damage);
    this.hasHitDummy = true;
    this.comboCount++;
    
    // Update damage display
    this.damageDisplay.setText(`Damage: ${Math.floor(this.dummy.damage)}%`);
    
    // Knockback - increases with damage
    const knockbackMult = 1 + this.dummy.damage / 100;
    const knockbackX = (this.player.facingRight ? 250 : -250) * knockbackMult;
    const knockbackY = -150 * knockbackMult;
    this.dummy.body.velocity.x = knockbackX;
    this.dummy.body.velocity.y = knockbackY;
    
    // Show damage number
    const dmgText = this.add.text(this.dummy.x, this.dummy.y - 30, `${Math.floor(damage)}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => dmgText.destroy()
    });
  }

  private generateSteps(): void {
    this.steps = [];
    
    switch (this.tutorialType) {
      case 'basics':
      default:
        this.generateBasicsSteps();
        break;
      case 'controls':
        this.generateControlsSteps();
        break;
      case 'character':
        this.generateCharacterSteps();
        break;
    }
  }

  private generateBasicsSteps(): void {
    const moveKeys = this.getControlText('move');
    const jumpKey = this.getControlText('jump');
    const attackKey = this.getControlText('attack');
    
    this.steps = [
      {
        title: 'STEP 1: MOVEMENT',
        instruction: `${moveKeys} to move left/right!`,
        checkComplete: () => this.hasMoved,
        hint: 'Try moving to either side'
      },
      {
        title: 'STEP 2: JUMP',
        instruction: `${jumpKey} to jump!\nPress again in the air for double jump`,
        checkComplete: () => this.hasJumped,
        hint: 'Press jump button twice'
      },
      {
        title: 'STEP 3: ATTACK',
        instruction: `${attackKey} to attack!`,
        checkComplete: () => this.hasAttacked,
        hint: 'Press the attack button'
      },
      {
        title: 'STEP 4: HIT',
        instruction: 'Get close to the sandbag and land an attack',
        checkComplete: () => this.hasHitDummy,
        onStart: () => {
          this.comboCount = 0;
        },
        hint: 'Approach and attack the sandbag'
      },
      {
        title: 'STEP 5: KO',
        instruction: 'Attack repeatedly to knock the sandbag off stage!\nHigher damage = more knockback',
        checkComplete: () => this.dummyKOed,
        onStart: () => this.resetDummy(),
        hint: 'Higher damage % means more knockback'
      },
      {
        title: 'Tutorial Complete!',
        instruction: 'You\'ve mastered the basics!\n\nENTER: Return to menu',
        checkComplete: () => false,
        hint: ''
      }
    ];
  }

  private generateControlsSteps(): void {
    const moveKeys = this.getControlText('move');
    const jumpKey = this.getControlText('jump');
    
    this.steps = [
      {
        title: 'Movement Practice',
        instruction: `${moveKeys} to move left/right`,
        checkComplete: () => this.hasMoved,
        hint: ''
      },
      {
        title: 'Jump Practice',
        instruction: `${jumpKey} to jump\nPress twice for double jump`,
        checkComplete: () => this.hasJumped,
        hint: ''
      },
      {
        title: 'Attack Practice',
        instruction: 'Z or SPACE to attack',
        checkComplete: () => this.hasAttacked,
        hint: ''
      },
      {
        title: 'Controls Complete!',
        instruction: 'ENTER to return to menu',
        checkComplete: () => false,
        hint: ''
      }
    ];
  }

  private generateCharacterSteps(): void {
    const char = this.selectedCharacter || characters[0];
    const attackKey = this.getControlText('attack');
    const specialKey = this.getControlText('special');
    
    this.steps = [
      {
        title: `${char.name.en}`,
        instruction: `Type: ${char.type}\n\n${attackKey} for basic attack`,
        checkComplete: () => this.hasHitDummy,
        hint: char.description.en
      },
      {
        title: `Special: ${char.special_move.name.en}`,
        instruction: `${specialKey} to use special move!\n\n${char.special_move.description.en}`,
        checkComplete: () => this.hasUsedSpecial,
        hint: `Cooldown: ${char.special_move.cooldown / 1000}s`
      },
      {
        title: 'Combat Practice',
        instruction: 'KO the sandbag!',
        checkComplete: () => this.dummyKOed,
        onStart: () => this.resetDummy(),
        hint: ''
      },
      {
        title: 'Complete!',
        instruction: `${char.name.en} training complete!`,
        checkComplete: () => false,
        hint: ''
      }
    ];
  }

  private getControlText(action: string): string {
    switch (action) {
      case 'move':
        return this.controlMode === ControlMode.ARROWS ? '← →' :
               this.controlMode === ControlMode.WASD ? 'A D' : 'H L';
      case 'jump':
        return this.controlMode === ControlMode.ARROWS ? '↑' :
               this.controlMode === ControlMode.WASD ? 'W' : 'K';
      case 'down':
        return this.controlMode === ControlMode.ARROWS ? '↓' :
               this.controlMode === ControlMode.WASD ? 'S' : 'J';
      case 'attack':
        return 'Z / SPACE';
      case 'special':
        return 'X / SHIFT';
      default:
        return '';
    }
  }

  private resetDummy(): void {
    this.dummy.setPosition(GAME_WIDTH / 2 + 100, 450);
    this.dummy.damage = 0;
    this.dummy.body.velocity.set(0, 0);
    this.dummyKOed = false;
    this.hasHitDummy = false;
    this.damageDisplay.setText('Damage: 0%');
  }

  private createUI(): void {
    // Title box
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x000000, 0.8);
    titleBox.fillRect(0, 0, GAME_WIDTH, 140);
    titleBox.lineStyle(2, 0x00ff00, 0.5);
    titleBox.lineBetween(0, 140, GAME_WIDTH, 140);
    
    // Title
    this.titleText = this.add.text(GAME_WIDTH / 2, 35, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    // Instruction
    this.instructionText = this.add.text(GAME_WIDTH / 2, 85, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Hint
    this.hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
    
    // Progress
    this.progressText = this.add.text(20, 20, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#666666'
    });
    
    // Damage display
    this.damageDisplay = this.add.text(GAME_WIDTH / 2 + 100, 420, 'Damage: 0%', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#ff6666'
    }).setOrigin(0.5);
    
    // Success text (hidden initially)
    this.successText = this.add.text(GAME_WIDTH / 2, 250, '✓ CLEAR!', {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    
    // Exit instruction
    this.add.text(20, GAME_HEIGHT - 30, 'ESC: Return to menu', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#666666'
    });
  }

  private setupControls(): void {
    const keyboard = this.input.keyboard!;
    
    this.cursors = keyboard.createCursorKeys();
    
    this.wasd = {
      up: keyboard.addKey('W'),
      down: keyboard.addKey('S'),
      left: keyboard.addKey('A'),
      right: keyboard.addKey('D')
    };
    
    this.actionKeys = {
      attack: keyboard.addKey('Z'),
      attack2: keyboard.addKey('SPACE'),
      special: keyboard.addKey('X'),
      special2: keyboard.addKey('SHIFT'),
      sub: keyboard.addKey('C')
    };
    
    // Exit
    keyboard.on('keydown-ESC', () => this.exit());
    
    // Continue/Skip
    keyboard.on('keydown-ENTER', () => this.advanceStep());
  }

  private startCurrentStep(): void {
    if (this.currentStep >= this.steps.length) return;
    
    const step = this.steps[this.currentStep];
    this.stepCompleted = false;
    
    this.titleText.setText(step.title);
    this.instructionText.setText(step.instruction);
    this.hintText.setText(step.hint ? `Hint: ${step.hint}` : '');
    this.progressText.setText(`${this.currentStep + 1} / ${this.steps.length}`);
    
    this.successText.setAlpha(0);
    
    if (step.onStart) {
      step.onStart();
    }
  }

  private advanceStep(): void {
    if (this.currentStep >= this.steps.length - 1) {
      this.exit();
      return;
    }
    
    this.currentStep++;
    this.startCurrentStep();
  }

  private showStepComplete(): void {
    if (this.stepCompleted) return;
    this.stepCompleted = true;
    
    this.successText.setAlpha(1);
    
    this.tweens.add({
      targets: this.successText,
      scale: { from: 1.5, to: 1 },
      duration: 300,
      ease: 'Back.out'
    });
    
    // Auto advance after delay
    this.time.delayedCall(1200, () => {
      this.advanceStep();
    });
  }

  update(time: number, delta: number): void {
    // Handle input
    this.handleInput();
    
    // Update player
    if (this.player && this.player.active) {
      this.player.update(time, delta);
    }
    
    // Update dummy (simple AI-less behavior)
    if (this.dummy && this.dummy.active) {
      // Friction when grounded
      if (this.dummy.isGrounded) {
        this.dummy.body.velocity.x *= 0.85;
      }
      
      // Check for KO
      if (this.dummy.y > 700 || this.dummy.x < -50 || this.dummy.x > GAME_WIDTH + 50) {
        this.dummyKOed = true;
        // Respawn after delay
        this.time.delayedCall(1500, () => {
          if (this.currentStep < this.steps.length - 1) {
            this.resetDummy();
          }
        });
      }
      
      this.dummy.update(time, delta);
    }
    
    // Check step completion
    this.checkStepCompletion();
  }

  private handleInput(): void {
    if (!this.player || !this.player.active) return;
    
    let moveLeft = false;
    let moveRight = false;
    let jump = false;
    let attack = false;
    let special = false;
    
    // Check movement based on control mode
    moveLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    moveRight = this.cursors.right.isDown || this.wasd.right.isDown;
    jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
           Phaser.Input.Keyboard.JustDown(this.wasd.up);
    
    // Check actions
    attack = Phaser.Input.Keyboard.JustDown(this.actionKeys.attack) ||
             Phaser.Input.Keyboard.JustDown(this.actionKeys.attack2);
    special = Phaser.Input.Keyboard.JustDown(this.actionKeys.special) ||
              Phaser.Input.Keyboard.JustDown(this.actionKeys.special2);
    
    // Apply movement
    if (moveLeft) {
      this.player.moveLeft();
      this.hasMoved = true;
    } else if (moveRight) {
      this.player.moveRight();
      this.hasMoved = true;
    } else {
      this.player.stopMoving();
    }
    
    if (jump) {
      this.player.jump();
      this.hasJumped = true;
    }
    
    if (attack) {
      this.player.attack();
      this.hasAttacked = true;
    }
    
    if (special) {
      this.player.useSpecial();
      this.hasUsedSpecial = true;
    }
  }

  private checkStepCompletion(): void {
    if (this.currentStep >= this.steps.length) return;
    if (this.stepCompleted) return;
    
    const step = this.steps[this.currentStep];
    
    if (step.checkComplete()) {
      this.showStepComplete();
    }
  }

  private exit(): void {
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
