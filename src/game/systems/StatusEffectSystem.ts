// Status Effect System - Bug Mode and Stack Overflow
// Based on specification: 仕様書② ゲーム性

import type { Fighter } from '../entities/Fighter';

export enum StatusEffect {
  NONE = 'none',
  BUG = 'bug',
  STACK_OVERFLOW = 'stack_overflow',
  INVINCIBLE = 'invincible',
  SHIELD = 'shield',
  BOOST = 'boost'
}

export interface StatusState {
  effect: StatusEffect;
  duration: number;
  severity: number; // 1-3 for bug levels
}

export interface StackOverflowState {
  attackCounter: number;     // Number of attacks in window
  windowStart: number;       // Start of counting window
  threshold: number;         // Character-specific threshold
  stunDuration: number;      // How long stun lasts
  isStunned: boolean;
  stunTimer: number;
}

export interface BugState {
  isActive: boolean;
  duration: number;
  effects: BugEffect[];
  probability: number;       // Character-specific bug probability
}

export enum BugEffect {
  REVERSED_CONTROLS = 'reversed_controls',
  NO_JUMP = 'no_jump',
  RANDOM_ATTACK = 'random_attack',
  SLOW_MOVEMENT = 'slow_movement',
  VISUAL_GLITCH = 'visual_glitch'
}

// Character memory management ratings (affects stack overflow)
const MEMORY_MANAGEMENT: Record<string, number> = {
  'c': 0.3,           // Very prone to stack overflow
  'cpp': 0.35,
  'rust': 0.9,        // Excellent memory safety
  'go': 0.7,
  'java': 0.8,        // Garbage collection helps
  'csharp': 0.75,
  'python': 0.65,
  'javascript': 0.6,
  'typescript': 0.65,
  'haskell': 0.85,    // Functional purity helps
  'swift': 0.7,
  'kotlin': 0.7,
  'ruby': 0.55,
  'php': 0.4,
  'lua': 0.5,
  'assembly': 0.2     // Most vulnerable
};

// Character robustness ratings (affects bug frequency)
const ROBUSTNESS: Record<string, number> = {
  'c': 0.3,           // Many bugs
  'cpp': 0.4,
  'rust': 0.95,       // Very robust
  'go': 0.7,
  'java': 0.65,
  'csharp': 0.6,
  'python': 0.5,      // Dynamic = more runtime bugs
  'javascript': 0.35, // Quirky behavior
  'typescript': 0.55,
  'haskell': 0.9,     // Type safety
  'swift': 0.65,
  'kotlin': 0.65,
  'ruby': 0.45,
  'php': 0.3,         // Notorious
  'lua': 0.5,
  'assembly': 0.25    // No safety net
};

export class StatusEffectSystem {
  private fighterStates: Map<Fighter, {
    stackOverflow: StackOverflowState;
    bug: BugState;
    activeEffects: StatusState[];
  }> = new Map();

  private static readonly ATTACK_WINDOW = 5000;      // 5 second window for SO tracking
  private static readonly BASE_SO_THRESHOLD = 15;    // Base attack count for SO
  private static readonly SO_STUN_DURATION = 2000;   // 2 second stun
  private static readonly BUG_BASE_CHANCE = 0.01;    // 1% base chance per hit
  private static readonly BUG_DURATION = 3000;       // 3 second bug duration

  registerFighter(fighter: Fighter): void {
    const characterId = fighter.character.id;
    const memoryMgmt = MEMORY_MANAGEMENT[characterId] || 0.5;
    const robustness = ROBUSTNESS[characterId] || 0.5;

    this.fighterStates.set(fighter, {
      stackOverflow: {
        attackCounter: 0,
        windowStart: 0,
        threshold: Math.floor(StatusEffectSystem.BASE_SO_THRESHOLD * (1 + memoryMgmt)),
        stunDuration: StatusEffectSystem.SO_STUN_DURATION,
        isStunned: false,
        stunTimer: 0
      },
      bug: {
        isActive: false,
        duration: 0,
        effects: [],
        probability: StatusEffectSystem.BUG_BASE_CHANCE * (2 - robustness)
      },
      activeEffects: []
    });
  }

  // Called when fighter performs an attack
  onAttack(fighter: Fighter, time: number): boolean {
    const state = this.fighterStates.get(fighter);
    if (!state) return true;

    // Check if currently stunned
    if (state.stackOverflow.isStunned) {
      return false; // Cannot attack while stunned
    }

    // Reset window if expired
    if (time - state.stackOverflow.windowStart > StatusEffectSystem.ATTACK_WINDOW) {
      state.stackOverflow.attackCounter = 0;
      state.stackOverflow.windowStart = time;
    }

    state.stackOverflow.attackCounter++;

    // Check for stack overflow
    if (state.stackOverflow.attackCounter >= state.stackOverflow.threshold) {
      this.triggerStackOverflow(fighter);
      return false;
    }

    return true;
  }

  // Called when fighter takes damage
  onTakeDamage(fighter: Fighter): void {
    const state = this.fighterStates.get(fighter);
    if (!state) return;

    // Random chance to trigger bug
    if (Math.random() < state.bug.probability) {
      this.triggerBug(fighter);
    }

    // If already bugged, damage makes it worse
    if (state.bug.isActive) {
      state.bug.duration += 500; // Extend duration
      if (state.bug.effects.length < 3 && Math.random() < 0.3) {
        // Add another bug effect
        const newEffect = this.getRandomBugEffect(state.bug.effects);
        if (newEffect) {
          state.bug.effects.push(newEffect);
        }
      }
    }
  }

  private triggerStackOverflow(fighter: Fighter): void {
    const state = this.fighterStates.get(fighter);
    if (!state) return;

    state.stackOverflow.isStunned = true;
    state.stackOverflow.stunTimer = state.stackOverflow.stunDuration;
    state.stackOverflow.attackCounter = 0;

    console.log(`${fighter.character.name.en} triggered STACK OVERFLOW!`);
  }

  private triggerBug(fighter: Fighter): void {
    const state = this.fighterStates.get(fighter);
    if (!state) return;

    state.bug.isActive = true;
    state.bug.duration = StatusEffectSystem.BUG_DURATION;
    state.bug.effects = [this.getRandomBugEffect([])!];

    console.log(`${fighter.character.name.en} entered BUG state!`);
  }

  private getRandomBugEffect(existing: BugEffect[]): BugEffect | null {
    const allEffects = Object.values(BugEffect);
    const available = allEffects.filter(e => !existing.includes(e));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  update(fighter: Fighter, delta: number): void {
    const state = this.fighterStates.get(fighter);
    if (!state) return;

    // Update stack overflow stun
    if (state.stackOverflow.isStunned) {
      state.stackOverflow.stunTimer -= delta;
      if (state.stackOverflow.stunTimer <= 0) {
        state.stackOverflow.isStunned = false;
      }
    }

    // Update bug state
    if (state.bug.isActive) {
      state.bug.duration -= delta;
      if (state.bug.duration <= 0) {
        state.bug.isActive = false;
        state.bug.effects = [];
      }
    }

    // Update other effects
    state.activeEffects = state.activeEffects.filter(effect => {
      effect.duration -= delta;
      return effect.duration > 0;
    });
  }

  isStunned(fighter: Fighter): boolean {
    const state = this.fighterStates.get(fighter);
    return state?.stackOverflow.isStunned || false;
  }

  isBugged(fighter: Fighter): boolean {
    const state = this.fighterStates.get(fighter);
    return state?.bug.isActive || false;
  }

  getBugEffects(fighter: Fighter): BugEffect[] {
    const state = this.fighterStates.get(fighter);
    return state?.bug.effects || [];
  }

  getStackOverflowProgress(fighter: Fighter): number {
    const state = this.fighterStates.get(fighter);
    if (!state) return 0;
    return state.stackOverflow.attackCounter / state.stackOverflow.threshold;
  }

  addEffect(fighter: Fighter, effect: StatusEffect, duration: number, severity: number = 1): void {
    const state = this.fighterStates.get(fighter);
    if (!state) return;

    state.activeEffects.push({
      effect,
      duration,
      severity
    });
  }

  hasEffect(fighter: Fighter, effect: StatusEffect): boolean {
    const state = this.fighterStates.get(fighter);
    if (!state) return false;
    return state.activeEffects.some(e => e.effect === effect);
  }

  clearEffects(fighter: Fighter): void {
    const state = this.fighterStates.get(fighter);
    if (!state) return;
    state.activeEffects = [];
    state.bug.isActive = false;
    state.bug.effects = [];
    state.stackOverflow.isStunned = false;
    state.stackOverflow.attackCounter = 0;
  }
}
