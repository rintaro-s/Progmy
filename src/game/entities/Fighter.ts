// Fighter Entity - The main battle character
import Phaser from 'phaser';
import type { Character } from '../data/characters';
import type { SubComponent } from '../data/subcomponents';
import { BugEffect } from '../systems/StatusEffectSystem';

export type AttackType = 'light' | 'medium' | 'heavy';

export interface FighterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  character: Character;
  subComponent?: SubComponent;
  isPlayer: boolean;
  playerIndex: number;
}

export class Fighter extends Phaser.GameObjects.Container {
  public character: Character;
  public subComponent?: SubComponent;
  public isPlayer: boolean;
  public playerIndex: number;
  
  // Stats
  public currentHp: number;
  public maxHp: number;
  public damage: number = 0; // Smash-style damage percentage
  public stocks: number = 3;
  public score: number = 0;
  
  // Physics body reference - declare to override parent
  declare public body: Phaser.Physics.Arcade.Body;
  
  // State
  public facingRight: boolean = true;
  public isGrounded: boolean = false;
  public isAttacking: boolean = false;
  public isUsingSpecial: boolean = false;
  public isHitstun: boolean = false;
  public isInvincible: boolean = false;
  public canDoubleJump: boolean = true;
  public jumpsRemaining: number = 2;
  public currentAttackType: AttackType = 'light';
  
  // Cooldowns
  public specialCooldown: number = 0;
  public attackCooldown: number = 0;
  public subAbilityCooldown: number = 0;
  
  // Hit tracking - prevents same attack hitting same target twice
  private hitTargets: Set<Fighter> = new Set();
  
  // Bug effects
  private activeBugEffects: BugEffect[] = [];
  
  // Movement
  public moveSpeed: number;
  public jumpForce: number;
  public airControl: number = 0.7;
  
  // Graphics
  private figureGraphics!: Phaser.GameObjects.Graphics;
  private accentGraphics!: Phaser.GameObjects.Graphics;
  
  // Animation state
  private animState: 'idle' | 'walk' | 'jump' | 'fall' | 'attack' | 'hurt' | 'special' = 'idle';
  private animTimer: number = 0;
  
  // Knockback reaction
  public knockbackIntensity: number = 0;
  public knockbackAngle: number = 0;
  
  // Safe position for recovery
  public lastSafePosition: { x: number; y: number } = { x: 0, y: 0 };
  
  // Multipliers from sub-components
  public skillDelayMultiplier: number = 1;
  public logicAtkMultiplier: number = 1;
  public attackRangeMultiplier: number = 1;
  public autoAim: boolean = false;
  public adaptiveDefense: boolean = false;

  constructor(config: FighterConfig) {
    super(config.scene, config.x, config.y);
    
    this.character = config.character;
    this.subComponent = config.subComponent;
    this.isPlayer = config.isPlayer;
    this.playerIndex = config.playerIndex;
    
    // Initialize stats
    this.maxHp = 100 + config.character.stats.hp;
    this.currentHp = this.maxHp;
    
    // Movement based on stats
    this.moveSpeed = 200 + config.character.stats.speed * 2;
    this.jumpForce = 450 + config.character.stats.speed;
    
    // Create visual representation
    this.createVisuals();
    
    // Add to scene
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);
    
    // Setup physics body
    this.setupPhysics();
    
    // Apply sub-component passive
    if (this.subComponent) {
      this.applySubComponentPassive();
    }
    
    // Store initial safe position
    this.lastSafePosition = { x: config.x, y: config.y };
  }

  private createVisuals(): void {
    this.figureGraphics = this.scene.add.graphics();
    this.accentGraphics = this.scene.add.graphics();
    
    this.add(this.figureGraphics);
    this.add(this.accentGraphics);
    
    this.drawFigure();
  }

  private drawFigure(): void {
    const color = Phaser.Display.Color.HexStringToColor(this.character.color).color;
    const accentColor = Phaser.Display.Color.HexStringToColor(this.character.accentColor).color;
    
    this.figureGraphics.clear();
    this.accentGraphics.clear();
    
    const scale = 1;
    const flip = this.facingRight ? 1 : -1;
    
    // Slight wobble for hand-drawn effect
    const w = () => (Math.random() - 0.5) * 1.5;
    
    this.figureGraphics.lineStyle(3, color, 1);
    
    // Different poses based on animation state
    switch (this.animState) {
      case 'idle':
        this.drawIdlePose(w, flip, scale);
        break;
      case 'walk':
        this.drawWalkPose(w, flip, scale);
        break;
      case 'jump':
        this.drawJumpPose(w, flip, scale);
        break;
      case 'fall':
        this.drawFallPose(w, flip, scale);
        break;
      case 'attack':
        this.drawAttackPose(w, flip, scale);
        break;
      case 'hurt':
        this.drawHurtPose(w, flip, scale);
        break;
      case 'special':
        this.drawSpecialPose(w, flip, scale);
        break;
      default:
        this.drawIdlePose(w, flip, scale);
    }
    
    // Draw character accent
    this.drawAccent(accentColor, flip, scale);
  }

  private drawIdlePose(w: () => number, flip: number, scale: number): void {
    const breathOffset = Math.sin(this.animTimer * 3) * 2;
    
    // Apply knockback lean if being knocked back
    const leanAngle = this.knockbackIntensity * 0.3;
    const bodyTilt = Math.cos(leanAngle) * 15;
    const bodyLift = Math.sin(leanAngle) * 10;
    
    // Neck position
    const neckX = w();
    const neckY = -23 + breathOffset;
    
    // Head with neck
    this.figureGraphics.lineBetween(neckX, neckY, w(), -30 + breathOffset + bodyLift);
    this.figureGraphics.strokeCircle(w(), -35 + breathOffset + bodyLift + w(), 12);
    
    // Body
    this.figureGraphics.lineBetween(neckX, neckY, bodyTilt + w(), 15 + w());
    
    // Left arm with elbow
    const leftShoulderX = neckX;
    const leftShoulderY = -15 + breathOffset;
    const leftElbowX = -12 * flip + w();
    const leftElbowY = -5 + w();
    const leftHandX = -18 * flip + w();
    const leftHandY = 8 + w();
    this.figureGraphics.lineBetween(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
    this.figureGraphics.lineBetween(leftElbowX, leftElbowY, leftHandX, leftHandY);
    
    // Right arm with elbow
    const rightShoulderX = neckX;
    const rightShoulderY = -15 + breathOffset;
    const rightElbowX = 12 * flip + w();
    const rightElbowY = -5 + w();
    const rightHandX = 18 * flip + w();
    const rightHandY = 8 + w();
    this.figureGraphics.lineBetween(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
    this.figureGraphics.lineBetween(rightElbowX, rightElbowY, rightHandX, rightHandY);
    
    // Left leg with knee
    const leftHipX = bodyTilt + w();
    const leftHipY = 15;
    const leftKneeX = -8 + bodyTilt * 0.5 + w();
    const leftKneeY = 30 + w();
    const leftFootX = -12 + w();
    const leftFootY = 45 + w();
    this.figureGraphics.lineBetween(leftHipX, leftHipY, leftKneeX, leftKneeY);
    this.figureGraphics.lineBetween(leftKneeX, leftKneeY, leftFootX, leftFootY);
    
    // Right leg with knee
    const rightHipX = bodyTilt + w();
    const rightHipY = 15;
    const rightKneeX = 8 + bodyTilt * 0.5 + w();
    const rightKneeY = 30 + w();
    const rightFootX = 12 + w();
    const rightFootY = 45 + w();
    this.figureGraphics.lineBetween(rightHipX, rightHipY, rightKneeX, rightKneeY);
    this.figureGraphics.lineBetween(rightKneeX, rightKneeY, rightFootX, rightFootY);
  }

  private drawWalkPose(w: () => number, flip: number, scale: number): void {
    const walkCycle = Math.sin(this.animTimer * 10);
    const leanAngle = this.knockbackIntensity * 0.3;
    const bodyTilt = Math.cos(leanAngle) * 3 * flip;
    
    // Neck
    const neckX = w();
    const neckY = -23;
    this.figureGraphics.lineBetween(neckX, neckY, w(), -30);
    
    // Head with bob
    this.figureGraphics.strokeCircle(w(), -35 + Math.abs(walkCycle) * 1 + w(), 12);
    
    // Body (slight lean forward)
    this.figureGraphics.lineBetween(neckX, neckY, bodyTilt + w(), 15 + w());
    
    // Left arm swinging with elbow
    const leftElbowX = (-8 - walkCycle * 5) * flip + w();
    const leftElbowY = -5 + walkCycle * 3 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), leftElbowX, leftElbowY);
    this.figureGraphics.lineBetween(leftElbowX, leftElbowY, (-15 - walkCycle * 10) * flip + w(), 5 + w());
    
    // Right arm swinging with elbow
    const rightElbowX = (8 + walkCycle * 5) * flip + w();
    const rightElbowY = -5 - walkCycle * 3 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), rightElbowX, rightElbowY);
    this.figureGraphics.lineBetween(rightElbowX, rightElbowY, (15 + walkCycle * 10) * flip + w(), 5 + w());
    
    // Left leg walking with knee
    const leftKneeX = bodyTilt + (-4 + walkCycle * 8) + w();
    const leftKneeY = 30 + Math.abs(walkCycle) * 3 + w();
    this.figureGraphics.lineBetween(bodyTilt + w(), 15, leftKneeX, leftKneeY);
    this.figureGraphics.lineBetween(leftKneeX, leftKneeY, (-8 + walkCycle * 12) + w(), 45 + w());
    
    // Right leg walking with knee
    const rightKneeX = bodyTilt + (4 - walkCycle * 8) + w();
    const rightKneeY = 30 + Math.abs(walkCycle) * 3 + w();
    this.figureGraphics.lineBetween(bodyTilt + w(), 15, rightKneeX, rightKneeY);
    this.figureGraphics.lineBetween(rightKneeX, rightKneeY, (8 - walkCycle * 12) + w(), 45 + w());
  }

  private drawJumpPose(w: () => number, flip: number, scale: number): void {
    const leanAngle = this.knockbackIntensity * 0.5;
    const bodyTilt = Math.cos(leanAngle) * 8;
    
    // Neck
    const neckX = w();
    const neckY = -23;
    this.figureGraphics.lineBetween(neckX, neckY, w(), -28);
    
    // Head
    this.figureGraphics.strokeCircle(w(), -35 + w(), 12);
    
    // Body
    this.figureGraphics.lineBetween(neckX, neckY, bodyTilt + w(), 15 + w());
    
    // Left arm raised with elbow
    const leftElbowX = -12 + w();
    const leftElbowY = -20 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), leftElbowX, leftElbowY);
    this.figureGraphics.lineBetween(leftElbowX, leftElbowY, -20 + w(), -25 + w());
    
    // Right arm raised with elbow
    const rightElbowX = 12 + w();
    const rightElbowY = -20 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), rightElbowX, rightElbowY);
    this.figureGraphics.lineBetween(rightElbowX, rightElbowY, 20 + w(), -25 + w());
    
    // Left leg tucked with knee
    const leftKneeX = bodyTilt - 10 + w();
    const leftKneeY = 25 + w();
    this.figureGraphics.lineBetween(bodyTilt + w(), 15, leftKneeX, leftKneeY);
    this.figureGraphics.lineBetween(leftKneeX, leftKneeY, -15 + w(), 30 + w());
    
    // Right leg tucked with knee
    const rightKneeX = bodyTilt + 10 + w();
    const rightKneeY = 25 + w();
    this.figureGraphics.lineBetween(bodyTilt + w(), 15, rightKneeX, rightKneeY);
    this.figureGraphics.lineBetween(rightKneeX, rightKneeY, 15 + w(), 30 + w());
  }

  private drawFallPose(w: () => number, flip: number, scale: number): void {
    const leanAngle = this.knockbackIntensity * 0.5;
    const bodyTilt = Math.cos(leanAngle) * 5;
    
    // Neck
    this.figureGraphics.lineBetween(w(), -23, w(), -28);
    
    // Head
    this.figureGraphics.strokeCircle(w(), -35 + w(), 12);
    
    // Body
    this.figureGraphics.lineBetween(w(), -23, bodyTilt + w(), 15 + w());
    
    // Left arm spread with elbow
    const leftElbowX = -18 + w();
    const leftElbowY = -10 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), leftElbowX, leftElbowY);
    this.figureGraphics.lineBetween(leftElbowX, leftElbowY, -25 + w(), -5 + w());
    
    // Right arm spread with elbow
    const rightElbowX = 18 + w();
    const rightElbowY = -10 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), rightElbowX, rightElbowY);
    this.figureGraphics.lineBetween(rightElbowX, rightElbowY, 25 + w(), -5 + w());
    
    // Left leg extended with knee
    const leftKneeX = bodyTilt - 7 + w();
    const leftKneeY = 32 + w();
    this.figureGraphics.lineBetween(bodyTilt + w(), 15, leftKneeX, leftKneeY);
    this.figureGraphics.lineBetween(leftKneeX, leftKneeY, -10 + w(), 48 + w());
    
    // Right leg extended with knee
    const rightKneeX = bodyTilt + 7 + w();
    const rightKneeY = 32 + w();
    this.figureGraphics.lineBetween(bodyTilt + w(), 15, rightKneeX, rightKneeY);
    this.figureGraphics.lineBetween(rightKneeX, rightKneeY, 10 + w(), 48 + w());
  }

  private drawAttackPose(w: () => number, flip: number, scale: number): void {
    const leanAngle = this.knockbackIntensity * 0.3;
    const bodyTilt = Math.cos(leanAngle) * 5;
    
    // Neck
    this.figureGraphics.lineBetween(w(), -23, w(), -28);
    
    // Head
    this.figureGraphics.strokeCircle(w(), -35 + w(), 12);
    
    // Body (lean into attack)
    this.figureGraphics.lineBetween(w(), -23, (5 + bodyTilt) * flip + w(), 15 + w());
    
    // Front arm punching with elbow
    const frontElbowX = 20 * flip + w();
    const frontElbowY = -12 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), frontElbowX, frontElbowY);
    this.figureGraphics.lineBetween(frontElbowX, frontElbowY, 35 * flip + w(), -10 + w());
    
    // Back arm wound up with elbow
    const backElbowX = -10 * flip + w();
    const backElbowY = -10 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), backElbowX, backElbowY);
    this.figureGraphics.lineBetween(backElbowX, backElbowY, -15 * flip + w(), 0 + w());
    
    // Front leg stable with knee
    const frontKneeX = 8 * flip + w();
    const frontKneeY = 30 + w();
    this.figureGraphics.lineBetween((5 + bodyTilt) * flip + w(), 15, frontKneeX, frontKneeY);
    this.figureGraphics.lineBetween(frontKneeX, frontKneeY, 12 * flip + w(), 45 + w());
    
    // Back leg braced with knee
    const backKneeX = -10 * flip + w();
    const backKneeY = 30 + w();
    this.figureGraphics.lineBetween((5 + bodyTilt) * flip + w(), 15, backKneeX, backKneeY);
    this.figureGraphics.lineBetween(backKneeX, backKneeY, -15 * flip + w(), 45 + w());
  }

  private drawHurtPose(w: () => number, flip: number, scale: number): void {
    // Dramatic knockback reaction based on intensity
    const knockbackLean = this.knockbackIntensity * Math.PI * 0.5;
    const bodyArch = Math.sin(knockbackLean) * 20;
    const headBack = Math.cos(knockbackLean) * 10;
    
    // Neck bent back
    this.figureGraphics.lineBetween(w(), -23 + bodyArch * 0.3, -headBack + w(), -28 + bodyArch * 0.5);
    
    // Head (tilted back dramatically)
    this.figureGraphics.strokeCircle(-headBack - 5 * flip + w(), -33 + bodyArch * 0.6 + w(), 12);
    
    // Body (arched back from impact)
    this.figureGraphics.lineBetween(w(), -23 + bodyArch * 0.3, -bodyArch * 0.8 - 8 * flip + w(), 15 + w());
    
    // Left arm flailing back with elbow
    const leftElbowX = -bodyArch * 0.6 - 18 + w();
    const leftElbowY = -13 + bodyArch * 0.4 + w();
    this.figureGraphics.lineBetween(w(), -13 + bodyArch * 0.3 + w(), leftElbowX, leftElbowY);
    this.figureGraphics.lineBetween(leftElbowX, leftElbowY, -25 - bodyArch * 0.4 + w(), -20 + bodyArch * 0.5 + w());
    
    // Right arm flailing with elbow
    const rightElbowX = bodyArch * 0.3 + 7 + w();
    const rightElbowY = -10 + bodyArch * 0.3 + w();
    this.figureGraphics.lineBetween(w(), -13 + bodyArch * 0.3 + w(), rightElbowX, rightElbowY);
    this.figureGraphics.lineBetween(rightElbowX, rightElbowY, 10 + bodyArch * 0.2 + w(), -15 + bodyArch * 0.4 + w());
    
    // Left leg pushed back with knee
    const leftKneeX = -bodyArch * 0.5 - 10 + w();
    const leftKneeY = 30 + w();
    this.figureGraphics.lineBetween(-bodyArch * 0.8 - 8 * flip + w(), 15, leftKneeX, leftKneeY);
    this.figureGraphics.lineBetween(leftKneeX, leftKneeY, -15 + w(), 43 + w());
    
    // Right leg bracing with knee
    const rightKneeX = bodyArch * 0.3 + 3 + w();
    const rightKneeY = 30 + w();
    this.figureGraphics.lineBetween(-bodyArch * 0.8 - 8 * flip + w(), 15, rightKneeX, rightKneeY);
    this.figureGraphics.lineBetween(rightKneeX, rightKneeY, 5 + w(), 45 + w());
  }

  private drawSpecialPose(w: () => number, flip: number, scale: number): void {
    const pulse = Math.sin(this.animTimer * 15) * 3;
    
    // Neck
    this.figureGraphics.lineBetween(w(), -23, w(), -28);
    
    // Head (glowing effect)
    this.figureGraphics.strokeCircle(w(), -35 + w(), 12 + pulse);
    
    // Body
    this.figureGraphics.lineBetween(w(), -23, w(), 15 + w());
    
    // Left arm raised power pose with elbow
    const leftElbowX = -15 + w();
    const leftElbowY = -22 + pulse * 0.5 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), leftElbowX, leftElbowY);
    this.figureGraphics.lineBetween(leftElbowX, leftElbowY, -20 + w(), -30 + pulse + w());
    
    // Right arm raised power pose with elbow
    const rightElbowX = 15 + w();
    const rightElbowY = -22 + pulse * 0.5 + w();
    this.figureGraphics.lineBetween(w(), -15 + w(), rightElbowX, rightElbowY);
    this.figureGraphics.lineBetween(rightElbowX, rightElbowY, 20 + w(), -30 + pulse + w());
    
    // Left leg stable with knee
    const leftKneeX = -8 + w();
    const leftKneeY = 30 + w();
    this.figureGraphics.lineBetween(w(), 15, leftKneeX, leftKneeY);
    this.figureGraphics.lineBetween(leftKneeX, leftKneeY, -12 + w(), 45 + w());
    
    // Right leg stable with knee
    const rightKneeX = 8 + w();
    const rightKneeY = 30 + w();
    this.figureGraphics.lineBetween(w(), 15, rightKneeX, rightKneeY);
    this.figureGraphics.lineBetween(rightKneeX, rightKneeY, 12 + w(), 45 + w());
    
    // Power aura
    this.figureGraphics.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.character.accentColor).color, 0.5);
    this.figureGraphics.strokeCircle(0, 0, 40 + pulse * 2);
    
    // Legs (grounded stance)
    this.figureGraphics.lineStyle(3, Phaser.Display.Color.HexStringToColor(this.character.color).color, 1);
    this.figureGraphics.lineBetween(w(), 15, -18 + w(), 45 + w());
    this.figureGraphics.lineBetween(w(), 15, 18 + w(), 45 + w());
  }

  private drawAccent(accentColor: number, flip: number, scale: number): void {
    this.accentGraphics.lineStyle(2, accentColor, 0.9);
    
    // Simplified accent based on character
    switch (this.character.id) {
      case 'python':
        // Snake coil around body - simplified zigzag
        this.accentGraphics.beginPath();
        this.accentGraphics.moveTo(-8, -5);
        this.accentGraphics.lineTo(8, -2);
        this.accentGraphics.lineTo(-8, 3);
        this.accentGraphics.lineTo(8, 8);
        this.accentGraphics.lineTo(-8, 13);
        this.accentGraphics.strokePath();
        break;
        
      case 'rust':
        // Gear around head
        this.accentGraphics.strokeCircle(0, -35, 16);
        break;
        
      case 'go':
        // Gopher features
        this.accentGraphics.fillStyle(accentColor, 1);
        this.accentGraphics.fillCircle(-8, -45, 4);
        this.accentGraphics.fillCircle(8, -45, 4);
        break;
        
      case 'haskell':
        // Lambda aura
        this.accentGraphics.lineBetween(-10, 10, 0, -5);
        this.accentGraphics.lineBetween(0, -5, 10, 10);
        break;
        
      default:
        // Small accent mark
        this.accentGraphics.strokeCircle(0, -8, 6);
    }
  }

  private setupPhysics(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(30, 70);
    body.setOffset(-15, -25);
    body.setCollideWorldBounds(false);
    body.setMaxVelocity(600, 800);
    body.setDrag(800, 0);
  }

  private applySubComponentPassive(): void {
    if (this.subComponent?.ability.passive.effect) {
      this.subComponent.ability.passive.effect(this);
    }
  }

  // Update called every frame
  update(delta: number): void {
    this.animTimer += delta / 1000;
    
    // Update cooldowns
    if (this.specialCooldown > 0) this.specialCooldown -= delta;
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.subAbilityCooldown > 0) this.subAbilityCooldown -= delta;
    
    // Update animation state based on physics
    this.updateAnimationState();
    
    // Redraw figure
    this.drawFigure();
    
    // Update grounded state
    this.isGrounded = this.body.blocked.down || this.body.touching.down;
    if (this.isGrounded) {
      this.jumpsRemaining = 2;
      this.canDoubleJump = true;
      // Store safe position
      this.lastSafePosition = { x: this.x, y: this.y };
    }
    
    // Flash effect when invincible
    if (this.isInvincible) {
      this.setAlpha(Math.sin(this.animTimer * 20) * 0.3 + 0.7);
    } else {
      this.setAlpha(1);
    }
  }

  private updateAnimationState(): void {
    if (this.isAttacking) {
      // Keep attack state
      return;
    }
    
    if (this.isHitstun) {
      this.animState = 'hurt';
      return;
    }
    
    if (!this.isGrounded) {
      if (this.body.velocity.y < 0) {
        this.animState = 'jump';
      } else {
        this.animState = 'fall';
      }
      return;
    }
    
    if (Math.abs(this.body.velocity.x) > 20) {
      this.animState = 'walk';
    } else {
      this.animState = 'idle';
    }
  }

  // Movement methods
  moveLeft(): void {
    if (this.isHitstun || this.isAttacking) return;
    
    const control = this.isGrounded ? 1 : this.airControl;
    this.body.setVelocityX(-this.moveSpeed * control);
    this.facingRight = false;
  }

  moveRight(): void {
    if (this.isHitstun || this.isAttacking) return;
    
    const control = this.isGrounded ? 1 : this.airControl;
    this.body.setVelocityX(this.moveSpeed * control);
    this.facingRight = true;
  }

  jump(): boolean {
    if (this.isHitstun) return false;
    
    if (this.isGrounded) {
      this.body.setVelocityY(-this.jumpForce);
      this.jumpsRemaining--;
      return true;
    } else if (this.jumpsRemaining > 0) {
      this.body.setVelocityY(-this.jumpForce * 0.85);
      this.jumpsRemaining--;
      return true;
    }
    return false;
  }

  // Combat methods
  attack(type: AttackType = 'light'): void {
    if (this.isHitstun || this.attackCooldown > 0) return;
    
    this.isAttacking = true;
    this.currentAttackType = type;
    this.animState = 'attack';
    this.hitTargets.clear();
    
    // Different cooldowns for different attack types
    const cooldowns = { light: 200, medium: 400, heavy: 600 };
    const durations = { light: 150, medium: 250, heavy: 400 };
    
    this.attackCooldown = cooldowns[type] * this.skillDelayMultiplier;
    
    // Attack ends after duration
    this.scene.time.delayedCall(durations[type], () => {
      this.isAttacking = false;
      this.hitTargets.clear();
    });
  }

  // Check if already hit this target in current attack
  hasHitThisAttack(target: Fighter): boolean {
    return this.hitTargets.has(target);
  }

  // Mark target as hit
  markHit(target: Fighter): void {
    this.hitTargets.add(target);
  }

  // Set bug effects
  setBugEffects(effects: BugEffect[]): void {
    this.activeBugEffects = effects;
  }

  // Get active bug effects
  getBugEffects(): BugEffect[] {
    return this.activeBugEffects;
  }

  // Lose a stock
  loseStock(): void {
    this.stocks = Math.max(0, this.stocks - 1);
  }

  useSpecial(): void {
    if (this.isHitstun || this.specialCooldown > 0) return;
    
    this.isUsingSpecial = true;
    this.animState = 'special';
    this.specialCooldown = this.character.special_move.cooldown * this.skillDelayMultiplier;
    
    // Special animation duration
    this.scene.time.delayedCall(500, () => {
      if (this.animState === 'special') {
        this.animState = 'idle';
      }
      this.isUsingSpecial = false;
    });
  }

  useSubAbility(): void {
    if (!this.subComponent || this.subAbilityCooldown > 0) return;
    
    this.subAbilityCooldown = this.subComponent.ability.active.cooldown * this.skillDelayMultiplier;
    this.subComponent.ability.active.execute(this, this.scene);
  }

  // Take damage
  takeDamage(amount: number, knockbackX: number, knockbackY: number): void {
    // Check invincibility first - prevents spawn camping
    if (this.isInvincible) return;
    
    this.damage += amount;
    this.isHitstun = true;
    
    // Knockback scales with damage percentage (Smash-style)
    const knockbackMultiplier = 1 + (this.damage / 100);
    this.body.setVelocity(
      knockbackX * knockbackMultiplier,
      knockbackY * knockbackMultiplier
    );
    
    // Calculate knockback intensity for visual reaction (0-1 range, can exceed 1 for dramatic effect)
    const velocityMagnitude = Math.sqrt(knockbackX * knockbackX + knockbackY * knockbackY);
    this.knockbackIntensity = Math.min((velocityMagnitude * knockbackMultiplier) / 1000, 2);
    this.knockbackAngle = Math.atan2(knockbackY, knockbackX);
    
    // Decay knockback intensity over time
    const decayDuration = 800;
    const startIntensity = this.knockbackIntensity;
    this.scene.tweens.add({
      targets: this,
      knockbackIntensity: 0,
      duration: decayDuration,
      ease: 'Cubic.easeOut'
    });
    
    // Hitstun duration based on damage
    const hitstunDuration = Math.min(100 + this.damage * 2, 500);
    this.scene.time.delayedCall(hitstunDuration, () => {
      this.isHitstun = false;
    });
  }

  // Respawn after KO
  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.body.setVelocity(0, 0);
    this.damage = 0;
    this.isHitstun = false;
    this.isAttacking = false;
    this.isUsingSpecial = false;
    this.knockbackIntensity = 0;
    this.knockbackAngle = 0;
    this.hitTargets.clear();
    this.activeBugEffects = [];
  }

  // Activate invincibility
  activateInvincibility(duration: number): void {
    this.isInvincible = true;
    this.scene.time.delayedCall(duration, () => {
      this.isInvincible = false;
    });
  }

  // Speed boost
  speedBoost(multiplier: number, duration: number): void {
    const originalSpeed = this.moveSpeed;
    this.moveSpeed *= multiplier;
    this.scene.time.delayedCall(duration, () => {
      this.moveSpeed = originalSpeed;
    });
  }

  // Reset to last safe position
  resetToLastSafePosition(): void {
    this.setPosition(this.lastSafePosition.x, this.lastSafePosition.y);
    this.body.setVelocity(0, 0);
  }

  // Get attack hitbox
  getAttackHitbox(): Phaser.Geom.Rectangle | null {
    if (!this.isAttacking) return null;
    
    const range = 50 * this.attackRangeMultiplier;
    const dir = this.facingRight ? 1 : -1;
    
    return new Phaser.Geom.Rectangle(
      this.x + (dir * 20),
      this.y - 30,
      range * dir,
      60
    );
  }

  // Calculate damage output
  calculateDamage(isSpecial: boolean = false): { amount: number; knockbackX: number; knockbackY: number } {
    if (isSpecial) {
      const base = this.character.special_move.damage;
      const type = this.character.special_move.type;
      
      let amount = base;
      if (type === 'logic') {
        amount *= this.logicAtkMultiplier;
        amount += this.character.stats.logic_atk * 0.5;
      } else if (type === 'physical') {
        amount += this.character.stats.physical_atk * 0.5;
      }
      
      return {
        amount,
        knockbackX: (this.facingRight ? 1 : -1) * (200 + amount),
        knockbackY: -150
      };
    } else {
      // Different damage for attack types
      const multipliers = { light: 1.0, medium: 1.5, heavy: 2.2 };
      const knockbackMult = { light: 1.0, medium: 1.3, heavy: 1.8 };
      
      const base = 8 + this.character.stats.physical_atk * 0.15;
      const mult = multipliers[this.currentAttackType];
      const kbMult = knockbackMult[this.currentAttackType];
      
      return {
        amount: base * mult,
        knockbackX: (this.facingRight ? 1 : -1) * 150 * kbMult,
        knockbackY: -50 * kbMult
      };
    }
  }
}
