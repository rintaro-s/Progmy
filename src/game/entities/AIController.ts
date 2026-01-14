// AI System - Intelligent CPU opponents with skill-based difficulty
import Phaser from 'phaser';
import { Fighter } from './Fighter';
import type { Character } from '../data/characters';

export enum AIDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  EXPERT = 'expert'
}

interface AIState {
  currentAction: 'idle' | 'chase' | 'attack' | 'defend' | 'recover' | 'retreat' | 'special' | 'edgeguard';
  targetEnemy: Fighter | null;
  actionTimer: number;
  decisionCooldown: number;
  comboCounter: number;
  lastMoveDirection: 'left' | 'right' | 'none';
}

interface AISkill {
  reactionSpeed: number;      // How fast to react (ms delay)
  movementPrecision: number;  // 0-1: How precise movement is
  spacingSkill: number;       // 0-1: How well to maintain distance
  comboAbility: number;       // 0-1: How often to execute combos
  dodgeSkill: number;         // 0-1: How well to avoid attacks
  edgeguardSkill: number;     // 0-1: How well to edgeguard
  recoverySkill: number;      // 0-1: How well to recover from offstage
  inputAccuracy: number;      // 0-1: Chance to execute intended action
  adaptationRate: number;     // 0-1: How fast to adapt to player patterns
}

interface AIPersonality {
  aggression: number;      // 0-1: How often to attack vs defend
  specialUsage: number;    // 0-1: How often to use special moves
}

export class AIController {
  private fighter: Fighter;
  private scene: Phaser.Scene;
  private difficulty: AIDifficulty;
  private state: AIState;
  private personality: AIPersonality;
  private skill: AISkill;
  private enemies: Fighter[] = [];
  
  // Decision making
  private lastDecisionTime: number = 0;
  private decisionInterval: number;
  
  // Movement smoothing
  private targetX: number = 0;
  private optimalDistance: number = 60;
  
  // Learning/adaptation
  private enemyPatterns: Map<string, number[]> = new Map();
  private playerAttackTimings: number[] = [];
  private lastEnemyX: number = 0;
  private lastEnemyY: number = 0;

  constructor(
    fighter: Fighter,
    scene: Phaser.Scene,
    difficulty: AIDifficulty = AIDifficulty.NORMAL
  ) {
    this.fighter = fighter;
    this.scene = scene;
    this.difficulty = difficulty;
    
    this.state = {
      currentAction: 'idle',
      targetEnemy: null,
      actionTimer: 0,
      decisionCooldown: 0,
      comboCounter: 0,
      lastMoveDirection: 'none'
    };
    
    // Set skill levels based on difficulty - THIS IS THE KEY DIFFERENCE
    this.skill = this.generateSkillLevel();
    
    // Set personality based on character type
    this.personality = this.generatePersonality();
    
    // Decision interval scales with skill
    this.decisionInterval = Math.max(80, 400 - (this.skill.reactionSpeed * 300));
  }

  private generateSkillLevel(): AISkill {
    // Skill levels that affect HOW WELL the AI plays, not HOW STRONG it is
    switch (this.difficulty) {
      case AIDifficulty.EASY:
        return {
          reactionSpeed: 0.3,      // Slow reactions
          movementPrecision: 0.4,  // Often overshoots or undershoots
          spacingSkill: 0.3,       // Poor spacing
          comboAbility: 0.2,       // Rarely combos
          dodgeSkill: 0.2,         // Rarely dodges
          edgeguardSkill: 0.1,     // Doesn't edgeguard
          recoverySkill: 0.4,      // Basic recovery
          inputAccuracy: 0.6,      // Sometimes mis-inputs
          adaptationRate: 0.1      // Doesn't adapt
        };
      case AIDifficulty.NORMAL:
        return {
          reactionSpeed: 0.5,
          movementPrecision: 0.6,
          spacingSkill: 0.5,
          comboAbility: 0.4,
          dodgeSkill: 0.4,
          edgeguardSkill: 0.3,
          recoverySkill: 0.6,
          inputAccuracy: 0.8,
          adaptationRate: 0.3
        };
      case AIDifficulty.HARD:
        return {
          reactionSpeed: 0.75,
          movementPrecision: 0.8,
          spacingSkill: 0.7,
          comboAbility: 0.6,
          dodgeSkill: 0.65,
          edgeguardSkill: 0.6,
          recoverySkill: 0.8,
          inputAccuracy: 0.9,
          adaptationRate: 0.5
        };
      case AIDifficulty.EXPERT:
        return {
          reactionSpeed: 0.95,
          movementPrecision: 0.95,
          spacingSkill: 0.9,
          comboAbility: 0.85,
          dodgeSkill: 0.85,
          edgeguardSkill: 0.8,
          recoverySkill: 0.95,
          inputAccuracy: 0.98,
          adaptationRate: 0.8
        };
    }
  }

  private generatePersonality(): AIPersonality {
    const char = this.fighter.character;
    
    // Base personality from character type
    let aggression = 0.5;
    let specialUsage = 0.3;
    
    // Adjust based on character archetype
    if (char.type.includes('Attacker') || char.type.includes('Cannon')) {
      aggression = 0.75;
      specialUsage = 0.4;
    } else if (char.type.includes('Defender') || char.type.includes('Tank')) {
      aggression = 0.35;
    } else if (char.type.includes('Trickster')) {
      aggression = 0.5;
      specialUsage = 0.5;
    } else if (char.type.includes('Mage') || char.type.includes('Tactician')) {
      aggression = 0.45;
      specialUsage = 0.55;
    } else if (char.type.includes('Speedster') || char.type.includes('Agile')) {
      aggression = 0.65;
    }
    
    return { aggression, specialUsage };
  }

  setEnemies(enemies: Fighter[]): void {
    this.enemies = enemies.filter(e => e !== this.fighter);
  }

  update(time: number, delta: number): void {
    // Update state timers
    this.state.actionTimer += delta;
    this.state.decisionCooldown -= delta;
    
    // Track enemy movement for prediction
    const target = this.state.targetEnemy;
    if (target) {
      this.trackEnemyMovement(target);
    }
    
    // Skip if in hitstun
    if (this.fighter.isHitstun) {
      this.handleHitstun();
      return;
    }
    
    // Check if need to recover (off stage)
    if (this.needsRecovery()) {
      this.handleRecovery();
      return;
    }
    
    // Make decisions at intervals (based on reaction speed)
    if (time - this.lastDecisionTime > this.decisionInterval) {
      this.makeDecision();
      this.lastDecisionTime = time;
    }
    
    // Execute current action with potential input error
    if (Math.random() < this.skill.inputAccuracy) {
      this.executeAction(delta);
    } else {
      // Input error - do something slightly wrong
      this.executeErrorAction();
    }
  }
  
  private trackEnemyMovement(target: Fighter): void {
    // Track for prediction (higher skill = better tracking)
    if (target.isAttacking && this.skill.adaptationRate > 0.2) {
      this.playerAttackTimings.push(Date.now());
      if (this.playerAttackTimings.length > 10) {
        this.playerAttackTimings.shift();
      }
    }
    this.lastEnemyX = target.x;
    this.lastEnemyY = target.y;
  }
  
  private executeErrorAction(): void {
    // Low skill = more random/wrong inputs
    const errorRoll = Math.random();
    if (errorRoll < 0.3) {
      // Do nothing (hesitation)
    } else if (errorRoll < 0.5) {
      // Move wrong direction briefly
      if (this.state.lastMoveDirection === 'right') {
        this.fighter.moveLeft();
      } else {
        this.fighter.moveRight();
      }
    } else {
      // Attack at wrong time
      if (Math.random() < 0.2) this.fighter.attack();
    }
  }

  private makeDecision(): void {
    // Find best target
    this.state.targetEnemy = this.findBestTarget();
    
    if (!this.state.targetEnemy) {
      this.state.currentAction = 'idle';
      return;
    }
    
    const target = this.state.targetEnemy;
    const distance = this.getDistanceTo(target);
    const myDamage = this.fighter.damage;
    const enemyDamage = target.damage;
    
    // Decision tree
    const roll = Math.random();
    
    // Skilled AI checks for dodge opportunity first
    if (this.shouldDodge(target)) {
      this.state.currentAction = 'defend';
      return;
    }
    
    // Skilled AI does edgeguarding
    if (this.skill.edgeguardSkill > 0.3 && this.shouldEdgeguard(target)) {
      this.state.currentAction = 'edgeguard';
      return;
    }
    
    // Check for special opportunity
    if (this.shouldUseSpecial(target, distance)) {
      this.state.currentAction = 'special';
      return;
    }
    
    // Optimal spacing based on skill
    this.optimalDistance = 40 + (1 - this.skill.spacingSkill) * 40;
    
    // In attack range
    if (distance < this.optimalDistance + 30) {
      if (roll < this.personality.aggression) {
        // Attack - combo counter based on skill
        this.state.currentAction = 'attack';
        this.state.comboCounter = Math.random() < this.skill.comboAbility 
          ? Math.floor(Math.random() * 3) + 2  // 2-4 hit combo
          : 1;  // Single hit
      } else if (myDamage > 80 && roll < 0.5) {
        // Retreat if taking too much damage
        this.state.currentAction = 'retreat';
      } else {
        // Defend/wait
        this.state.currentAction = 'defend';
      }
    }
    // Medium range - spacing
    else if (distance < 200) {
      // Skilled AI maintains spacing
      if (this.skill.spacingSkill > 0.5 && Math.abs(distance - this.optimalDistance) < 30) {
        // Good position - wait for opening
        this.state.currentAction = 'idle';
      } else if (roll < this.personality.aggression * 0.8) {
        this.state.currentAction = 'chase';
      } else {
        this.state.currentAction = 'idle';
      }
    }
    // Far away
    else {
      this.state.currentAction = 'chase';
    }
    
    // Adapt to player patterns (higher skill = better prediction)
    if (this.skill.adaptationRate > 0.4 && target.isAttacking) {
      if (Math.random() < this.skill.dodgeSkill) {
        this.state.currentAction = 'defend';
      }
    }
  }
  
  private shouldDodge(target: Fighter): boolean {
    // Check if enemy is attacking and in range
    if (!target.isAttacking) return false;
    
    const distance = this.getDistanceTo(target);
    if (distance > 120) return false;
    
    // Dodge based on skill
    return Math.random() < this.skill.dodgeSkill;
  }
  
  private shouldEdgeguard(target: Fighter): boolean {
    // Check if enemy is offstage
    const bounds = { left: 100, right: 1180 };
    const isOffstage = target.x < bounds.left + 50 || target.x > bounds.right - 50;
    const isFalling = target.body.velocity.y > 100;
    
    return isOffstage && isFalling && this.fighter.isGrounded;
  }

  private executeAction(delta: number): void {
    const target = this.state.targetEnemy;
    
    switch (this.state.currentAction) {
      case 'idle':
        // Skilled AI maintains good position, unskilled wanders
        if (this.skill.spacingSkill > 0.5 && target) {
          this.maintainSpacing(target);
        } else if (Math.random() < 0.02) {
          Math.random() < 0.5 ? this.fighter.moveLeft() : this.fighter.moveRight();
        }
        break;
        
      case 'chase':
        if (target) {
          this.chaseTarget(target);
        }
        break;
        
      case 'attack':
        if (target) {
          this.attackTarget(target);
        }
        break;
        
      case 'defend':
        this.performDefense();
        break;
        
      case 'retreat':
        if (target) {
          this.retreatFrom(target);
        }
        break;
        
      case 'special':
        if (target) {
          this.performSpecial(target);
        }
        break;
        
      case 'recover':
        this.handleRecovery();
        break;
        
      case 'edgeguard':
        if (target) {
          this.performEdgeguard(target);
        }
        break;
    }
  }
  
  private maintainSpacing(target: Fighter): void {
    const dx = target.x - this.fighter.x;
    const distance = Math.abs(dx);
    
    // Edge safety check
    const nearLeftEdge = this.fighter.x < 150;
    const nearRightEdge = this.fighter.x > 1130;
    
    // Move to optimal distance
    if (distance < this.optimalDistance - 10) {
      // Too close - back up (but respect edges)
      if (dx > 0 && !nearLeftEdge) {
        this.fighter.moveLeft();
        this.state.lastMoveDirection = 'left';
      } else if (dx < 0 && !nearRightEdge) {
        this.fighter.moveRight();
        this.state.lastMoveDirection = 'right';
      } else {
        // Near edge, can't back up - just stay or jump
        if (Math.random() < 0.3) {
          this.fighter.jump();
        }
      }
    } else if (distance > this.optimalDistance + 20) {
      // Too far - approach (but respect edges)
      if (dx > 0 && !nearRightEdge) {
        this.fighter.moveRight();
        this.state.lastMoveDirection = 'right';
      } else if (dx < 0 && !nearLeftEdge) {
        this.fighter.moveLeft();
        this.state.lastMoveDirection = 'left';
      }
    }
  }
  
  private performEdgeguard(target: Fighter): void {
    // Move to edge
    const edgeX = target.x < 640 ? 150 : 1130;
    const dx = edgeX - this.fighter.x;
    
    if (Math.abs(dx) > 30) {
      if (dx > 0) {
        this.fighter.moveRight();
      } else {
        this.fighter.moveLeft();
      }
    } else {
      // At edge - attack if target is nearby
      if (this.getDistanceTo(target) < 150) {
        this.fighter.attack();
      }
    }
    
    // Reset after time
    if (this.state.actionTimer > 2000) {
      this.state.currentAction = 'idle';
      this.state.actionTimer = 0;
    }
  }

  private findBestTarget(): Fighter | null {
    if (this.enemies.length === 0) return null;
    
    let bestTarget: Fighter | null = null;
    let bestScore = -Infinity;
    
    for (const enemy of this.enemies) {
      if (enemy.stocks <= 0) continue;
      
      let score = 0;
      
      // Prefer closer enemies
      const distance = this.getDistanceTo(enemy);
      score -= distance * 0.5;
      
      // Prefer damaged enemies (easier to KO)
      score += enemy.damage * 2;
      
      // Prefer enemies with fewer stocks
      score += (3 - enemy.stocks) * 50;
      
      // Avoid enemies that are currently invincible
      if (enemy.isInvincible) {
        score -= 500;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }
    
    return bestTarget;
  }

  private getDistanceTo(target: Fighter): number {
    return Phaser.Math.Distance.Between(
      this.fighter.x, this.fighter.y,
      target.x, target.y
    );
  }

  private chaseTarget(target: Fighter): void {
    const dx = target.x - this.fighter.x;
    const dy = target.y - this.fighter.y;
    
    // Check edge safety FIRST
    const edgeCheck = this.isNearEdge();
    if (edgeCheck.nearEdge && this.fighter.isGrounded) {
      // Near edge - prioritize moving away from it
      if (edgeCheck.edgeSide === 'left') {
        this.fighter.moveRight();
        this.state.lastMoveDirection = 'right';
        return; // Don't continue chasing if near edge
      } else if (edgeCheck.edgeSide === 'right') {
        this.fighter.moveLeft();
        this.state.lastMoveDirection = 'left';
        return;
      }
    }
    
    // Movement precision affects how well AI tracks
    const precisionOffset = (1 - this.skill.movementPrecision) * 50 * (Math.random() - 0.5);
    const adjustedDx = dx + precisionOffset;
    
    // Don't chase if it would go off edge
    const wouldGoLeft = adjustedDx < -20;
    const wouldGoRight = adjustedDx > 20;
    const nearLeftEdge = this.fighter.x < 150;
    const nearRightEdge = this.fighter.x > 1130;
    
    // Horizontal movement (with edge awareness)
    if (Math.abs(adjustedDx) > 20) {
      if (adjustedDx > 0 && !nearRightEdge) {
        this.fighter.moveRight();
        this.state.lastMoveDirection = 'right';
      } else if (adjustedDx < 0 && !nearLeftEdge) {
        this.fighter.moveLeft();
        this.state.lastMoveDirection = 'left';
      } else if (nearLeftEdge && wouldGoLeft) {
        // Target is off-stage left, stay safe
        this.fighter.moveRight();
        this.state.lastMoveDirection = 'right';
      } else if (nearRightEdge && wouldGoRight) {
        // Target is off-stage right, stay safe
        this.fighter.moveLeft();
        this.state.lastMoveDirection = 'left';
      }
    }
    
    // Jump to reach higher platforms (skill affects timing)
    if (dy < -50) {
      const jumpChance = 0.05 + this.skill.movementPrecision * 0.1;
      if (Math.random() < jumpChance) {
        this.fighter.jump();
      }
    }
    
    // Skilled AI predicts landing position
    if (this.skill.movementPrecision > 0.6 && !target.isGrounded) {
      // Predict where enemy will land
      const predictedX = target.x + target.body.velocity.x * 0.3;
      // Only chase if prediction is within safe bounds
      if (predictedX > 150 && predictedX < 1130) {
        if (Math.abs(predictedX - this.fighter.x) > 50) {
          if (predictedX > this.fighter.x && !nearRightEdge) {
            this.fighter.moveRight();
          } else if (predictedX < this.fighter.x && !nearLeftEdge) {
            this.fighter.moveLeft();
          }
        }
      }
    }
    
    // Recovery jump if falling
    if (!this.fighter.isGrounded && this.fighter.body.velocity.y > 100) {
      if (Math.random() < this.skill.recoverySkill * 0.3) {
        this.fighter.jump();
      }
    }
  }

  private attackTarget(target: Fighter): void {
    const dx = target.x - this.fighter.x;
    const distance = Math.abs(dx);
    
    // Face target
    if (dx > 0 && !this.fighter.facingRight) {
      this.fighter.moveRight();
      this.state.lastMoveDirection = 'right';
    } else if (dx < 0 && this.fighter.facingRight) {
      this.fighter.moveLeft();
      this.state.lastMoveDirection = 'left';
    }
    
    // Attack range - skilled AI uses optimal range
    const attackRange = 40 + this.skill.spacingSkill * 20;
    
    // Attack if in range
    if (distance < attackRange + 20) {
      // Skilled AI times attacks better
      const attackChance = 0.3 + this.skill.comboAbility * 0.5;
      
      if (Math.random() < attackChance) {
        this.fighter.attack();
        this.state.comboCounter--;
        
        // Skilled AI continues combos
        if (this.state.comboCounter <= 0 || Math.random() > this.skill.comboAbility) {
          this.state.currentAction = 'idle';
          this.state.actionTimer = 0;
        }
      }
    } else {
      // Move closer - skilled AI approaches more precisely
      const approachSpeed = this.skill.movementPrecision > 0.7 ? 0.5 : 1;
      if (Math.random() < approachSpeed) {
        if (dx > 0) {
          this.fighter.moveRight();
          this.state.lastMoveDirection = 'right';
        } else {
          this.fighter.moveLeft();
          this.state.lastMoveDirection = 'left';
        }
      }
    }
  }

  private performDefense(): void {
    const target = this.state.targetEnemy;
    if (!target) return;
    
    const dx = target.x - this.fighter.x;
    
    // Move away from enemy attacks - skilled AI times better
    if (target.isAttacking && Math.abs(dx) < 100) {
      // Direction to move
      if (dx > 0) {
        this.fighter.moveLeft();
        this.state.lastMoveDirection = 'left';
      } else {
        this.fighter.moveRight();
        this.state.lastMoveDirection = 'right';
      }
      
      // Skilled AI jumps to avoid more effectively
      const jumpChance = this.skill.dodgeSkill * 0.5;
      if (Math.random() < jumpChance) {
        this.fighter.jump();
      }
    } else if (!target.isAttacking && this.skill.spacingSkill > 0.5) {
      // Skilled AI returns to neutral after dodging
      this.state.currentAction = 'idle';
      this.state.actionTimer = 0;
      return;
    }
    
    // Reset after short time - unskilled AI stays in defense longer
    const defenseTime = 300 + (1 - this.skill.reactionSpeed) * 400;
    if (this.state.actionTimer > defenseTime) {
      this.state.currentAction = 'idle';
      this.state.actionTimer = 0;
    }
  }

  private retreatFrom(target: Fighter): void {
    const dx = target.x - this.fighter.x;
    
    // Edge safety check
    const nearLeftEdge = this.fighter.x < 150;
    const nearRightEdge = this.fighter.x > 1130;
    
    // Move away (but don't go off edge)
    if (dx > 0 && !nearLeftEdge) {
      this.fighter.moveLeft();
    } else if (dx < 0 && !nearRightEdge) {
      this.fighter.moveRight();
    } else {
      // Near edge, can't retreat further - jump over enemy instead
      this.fighter.jump();
      // Move toward center
      if (this.fighter.x < 640) {
        this.fighter.moveRight();
      } else {
        this.fighter.moveLeft();
      }
    }
    
    // Jump to create distance
    if (Math.random() < 0.05) {
      this.fighter.jump();
    }
    
    // Stop retreating after gaining distance
    if (this.getDistanceTo(target) > 200) {
      this.state.currentAction = 'idle';
    }
  }

  private shouldUseSpecial(target: Fighter, distance: number): boolean {
    // Check cooldown
    if (this.fighter.specialCooldown > 0) return false;
    
    // Check range
    const specialRange = this.fighter.character.special_move.range;
    if (distance > specialRange) return false;
    
    // Decision based on situation
    const roll = Math.random();
    
    // Use special on high damage enemies (KO opportunity)
    if (target.damage > 80 && roll < this.personality.specialUsage * 1.5) {
      return true;
    }
    
    // Use utility specials more often
    if (this.fighter.character.special_move.type === 'utility') {
      return roll < this.personality.specialUsage * 0.8;
    }
    
    // Normal usage chance
    return roll < this.personality.specialUsage * 0.3;
  }

  private performSpecial(target: Fighter): void {
    const dx = target.x - this.fighter.x;
    
    // Face target
    if (dx > 0 && !this.fighter.facingRight) {
      this.fighter.moveRight();
    } else if (dx < 0 && this.fighter.facingRight) {
      this.fighter.moveLeft();
    }
    
    // Use special
    this.fighter.useSpecial();
    this.state.currentAction = 'idle';
  }

  private needsRecovery(): boolean {
    // Check if off stage or falling to death
    const bounds = {
      left: 50,
      right: 1230,
      bottom: 620
    };
    
    return (
      this.fighter.x < bounds.left ||
      this.fighter.x > bounds.right ||
      this.fighter.y > bounds.bottom
    );
  }
  
  // Check if near edge and should avoid moving further
  private isNearEdge(): { nearEdge: boolean; edgeSide: 'left' | 'right' | null } {
    const safeLeft = 100;
    const safeRight = 1180;
    
    if (this.fighter.x < safeLeft) {
      return { nearEdge: true, edgeSide: 'left' };
    }
    if (this.fighter.x > safeRight) {
      return { nearEdge: true, edgeSide: 'right' };
    }
    return { nearEdge: false, edgeSide: null };
  }

  private handleRecovery(): void {
    this.state.currentAction = 'recover';
    
    // Move toward center - skilled AI recovers more efficiently
    const centerX = 640;
    const dx = centerX - this.fighter.x;
    
    // Skilled AI takes optimal path back
    if (this.skill.recoverySkill > 0.6) {
      // Move directly toward stage
      if (dx > 0) {
        this.fighter.moveRight();
      } else {
        this.fighter.moveLeft();
      }
    } else {
      // Less skilled - sometimes moves wrong direction briefly
      if (Math.random() < this.skill.recoverySkill) {
        if (dx > 0) {
          this.fighter.moveRight();
        } else {
          this.fighter.moveLeft();
        }
      }
    }
    
    // Jump to recover - skilled AI times jumps better
    if (this.fighter.jumpsRemaining > 0) {
      // Save second jump for higher recovery
      if (this.skill.recoverySkill > 0.7 && this.fighter.y < 500 && this.fighter.jumpsRemaining > 1) {
        // Don't jump yet - wait for better timing
        if (this.fighter.y > 400) {
          this.fighter.jump();
        }
      } else {
        // Lower skill or emergency - just jump
        this.fighter.jump();
      }
    }
    
    // Use special if it helps recovery
    if (
      this.fighter.character.special_move.type === 'utility' &&
      this.fighter.specialCooldown <= 0 &&
      Math.random() < this.skill.recoverySkill
    ) {
      this.fighter.useSpecial();
    }
  }

  private handleHitstun(): void {
    // DI (Directional Influence) - based on skill level
    if (this.skill.recoverySkill > 0.7) {
      // Try to influence trajectory away from blast zones
      const body = this.fighter.body;
      const diStrength = 0.9 + this.skill.recoverySkill * 0.08; // 0.9-0.98
      
      if (body.velocity.x > 0 && this.fighter.x > 640) {
        // Being knocked right, near right edge - DI left
        body.velocity.x *= diStrength;
      } else if (body.velocity.x < 0 && this.fighter.x < 640) {
        // Being knocked left, near left edge - DI right
        body.velocity.x *= diStrength;
      }
    }
  }

  // Track enemy patterns for adaptation
  trackEnemyAction(enemy: Fighter, action: string): void {
    const key = enemy.character.id;
    if (!this.enemyPatterns.has(key)) {
      this.enemyPatterns.set(key, []);
    }
    
    const patterns = this.enemyPatterns.get(key)!;
    const actionCode = this.actionToCode(action);
    patterns.push(actionCode);
    
    // Keep only recent actions
    if (patterns.length > 20) {
      patterns.shift();
    }
  }

  private actionToCode(action: string): number {
    switch (action) {
      case 'attack': return 1;
      case 'jump': return 2;
      case 'special': return 3;
      case 'left': return 4;
      case 'right': return 5;
      default: return 0;
    }
  }

  // Predict enemy's next move based on patterns
  predictEnemyAction(enemy: Fighter): string | null {
    if (this.personality.prediction < 0.5) return null;
    
    const key = enemy.character.id;
    const patterns = this.enemyPatterns.get(key);
    if (!patterns || patterns.length < 5) return null;
    
    // Simple pattern matching - look for repeating sequences
    const recent = patterns.slice(-3);
    for (let i = 0; i < patterns.length - 4; i++) {
      if (
        patterns[i] === recent[0] &&
        patterns[i + 1] === recent[1] &&
        patterns[i + 2] === recent[2]
      ) {
        // Found matching pattern, predict next action
        const predicted = patterns[i + 3];
        return this.codeToAction(predicted);
      }
    }
    
    return null;
  }

  private codeToAction(code: number): string {
    switch (code) {
      case 1: return 'attack';
      case 2: return 'jump';
      case 3: return 'special';
      case 4: return 'left';
      case 5: return 'right';
      default: return 'idle';
    }
  }
}
