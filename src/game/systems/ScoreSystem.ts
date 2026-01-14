// Score System - Git-style scoring (Push, Stage, Commit)
// Based on specification: 仕様書② ゲーム性

import type { Fighter } from '../entities/Fighter';

export interface ScoreBreakdown {
  push: number;      // KO points (main score)
  stage: number;     // Damage dealt (intermediate)
  commit: number;    // Assist points (intermediate)
  bonus: number;     // Combo bonuses
}

export interface DamageRecord {
  attacker: Fighter;
  amount: number;
  timestamp: number;
}

export class ScoreSystem {
  // Track who damaged whom (for commit points)
  private damageHistory: Map<Fighter, DamageRecord[]> = new Map();
  
  // Score breakdown per fighter
  private scores: Map<Fighter, ScoreBreakdown> = new Map();
  
  // Constants
  private static readonly PUSH_POINTS = 100;
  private static readonly STAGE_MULTIPLIER = 0.5;  // Points per damage dealt
  private static readonly COMMIT_MULTIPLIER = 0.3; // Points for assisted KO
  private static readonly COMBO_BONUS = 10;
  private static readonly DAMAGE_EXPIRE_TIME = 15000; // 15 seconds

  constructor() {}

  registerFighter(fighter: Fighter): void {
    this.scores.set(fighter, {
      push: 0,
      stage: 0,
      commit: 0,
      bonus: 0
    });
    this.damageHistory.set(fighter, []);
  }

  // Called when damage is dealt
  recordDamage(attacker: Fighter, victim: Fighter, amount: number): void {
    const now = Date.now();
    
    // Add to attacker's stage points
    const score = this.scores.get(attacker);
    if (score) {
      score.stage += amount * ScoreSystem.STAGE_MULTIPLIER;
    }
    
    // Record for commit calculation
    const victimHistory = this.damageHistory.get(victim) || [];
    victimHistory.push({
      attacker,
      amount,
      timestamp: now
    });
    this.damageHistory.set(victim, victimHistory);
    
    // Clean old records
    this.cleanExpiredRecords(victim, now);
  }

  // Called when a fighter is KO'd
  recordKO(victim: Fighter, killer: Fighter | null): void {
    const now = Date.now();
    
    // Award push points to killer
    if (killer) {
      const killerScore = this.scores.get(killer);
      if (killerScore) {
        killerScore.push += ScoreSystem.PUSH_POINTS;
      }
    }
    
    // Award commit points to all who damaged the victim
    const history = this.damageHistory.get(victim) || [];
    const recentDamagers = new Set<Fighter>();
    
    history.forEach(record => {
      if (now - record.timestamp < ScoreSystem.DAMAGE_EXPIRE_TIME) {
        if (record.attacker !== killer) {
          recentDamagers.add(record.attacker);
        }
      }
    });
    
    recentDamagers.forEach(damager => {
      const damagerScore = this.scores.get(damager);
      if (damagerScore) {
        // Calculate commit points based on damage contribution
        const contribution = history
          .filter(r => r.attacker === damager && now - r.timestamp < ScoreSystem.DAMAGE_EXPIRE_TIME)
          .reduce((sum, r) => sum + r.amount, 0);
        
        damagerScore.commit += contribution * ScoreSystem.COMMIT_MULTIPLIER;
      }
    });
    
    // Clear victim's damage history
    this.damageHistory.set(victim, []);
  }

  // Called for combo bonuses
  addComboBonus(fighter: Fighter, comboCount: number): void {
    const score = this.scores.get(fighter);
    if (score) {
      score.bonus += ScoreSystem.COMBO_BONUS * comboCount;
    }
  }

  // Get total score (Push is main, others are weighted)
  getTotalScore(fighter: Fighter): number {
    const score = this.scores.get(fighter);
    if (!score) return 0;
    
    // Push is the main score, stage/commit are intermediate
    return Math.floor(
      score.push + 
      score.stage * 0.3 + 
      score.commit * 0.2 + 
      score.bonus
    );
  }

  getScoreBreakdown(fighter: Fighter): ScoreBreakdown {
    return this.scores.get(fighter) || {
      push: 0,
      stage: 0,
      commit: 0,
      bonus: 0
    };
  }

  // Get "grass" level (push count for victory display)
  getPushCount(fighter: Fighter): number {
    const score = this.scores.get(fighter);
    return score ? Math.floor(score.push / ScoreSystem.PUSH_POINTS) : 0;
  }

  private cleanExpiredRecords(victim: Fighter, now: number): void {
    const history = this.damageHistory.get(victim) || [];
    const filtered = history.filter(
      record => now - record.timestamp < ScoreSystem.DAMAGE_EXPIRE_TIME
    );
    this.damageHistory.set(victim, filtered);
  }

  reset(): void {
    this.damageHistory.clear();
    this.scores.clear();
  }
}
