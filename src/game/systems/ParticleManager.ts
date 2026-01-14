// Particle System - Visual Effects
import Phaser from 'phaser';

export interface ParticleConfig {
  color: number;
  count: number;
  speed?: { min: number; max: number };
  scale?: { start: number; end: number };
  lifespan?: number;
  alpha?: { start: number; end: number };
  gravity?: number;
  angle?: { min: number; max: number };
}

export class ParticleManager {
  private scene: Phaser.Scene;
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private particleGraphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTexture();
  }

  private createParticleTexture(): void {
    // Create various particle textures
    const graphics = this.scene.add.graphics();
    
    // Basic circle particle
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle_circle', 8, 8);
    
    // Square particle
    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 6, 6);
    graphics.generateTexture('particle_square', 6, 6);
    
    // Star particle
    graphics.clear();
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.lineBetween(4, 0, 4, 8);
    graphics.lineBetween(0, 4, 8, 4);
    graphics.lineBetween(1, 1, 7, 7);
    graphics.lineBetween(7, 1, 1, 7);
    graphics.generateTexture('particle_star', 8, 8);
    
    // Code symbol particle
    graphics.clear();
    graphics.lineStyle(1, 0xffffff, 1);
    // < >
    graphics.lineBetween(0, 4, 3, 1);
    graphics.lineBetween(0, 4, 3, 7);
    graphics.lineBetween(7, 4, 4, 1);
    graphics.lineBetween(7, 4, 4, 7);
    graphics.generateTexture('particle_code', 8, 8);
    
    graphics.destroy();
  }

  // Hit effect - when attack connects
  createHitEffect(x: number, y: number, color: number = 0xffffff): void {
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 100, max: 300 },
      scale: { start: 1.5, end: 0 },
      lifespan: 300,
      tint: color,
      gravityY: 200,
      angle: { min: 0, max: 360 },
      quantity: 1,
      emitting: false
    });
    
    emitter.explode(15);
    
    // Auto destroy
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  // KO effect - when someone is eliminated
  createKOEffect(x: number, y: number, color: number): void {
    // Main burst
    const mainEmitter = this.scene.add.particles(x, y, 'particle_star', {
      speed: { min: 200, max: 500 },
      scale: { start: 2, end: 0 },
      lifespan: 800,
      tint: color,
      gravityY: -50,
      angle: { min: 0, max: 360 },
      quantity: 1,
      emitting: false
    });
    mainEmitter.explode(30);

    // Secondary particles
    const secondaryEmitter = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      tint: 0xffffff,
      gravityY: 100,
      angle: { min: 0, max: 360 },
      quantity: 1,
      emitting: false
    });
    secondaryEmitter.explode(20);

    // Code fragments
    const codeEmitter = this.scene.add.particles(x, y, 'particle_code', {
      speed: { min: 100, max: 250 },
      scale: { start: 1.5, end: 0 },
      lifespan: 1000,
      tint: 0x00ff00,
      gravityY: 150,
      angle: { min: 0, max: 360 },
      rotate: { start: 0, end: 360 },
      quantity: 1,
      emitting: false
    });
    codeEmitter.explode(10);

    this.scene.time.delayedCall(1200, () => {
      mainEmitter.destroy();
      secondaryEmitter.destroy();
      codeEmitter.destroy();
    });
  }

  // Special move charge effect
  createChargeEffect(x: number, y: number, color: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 20, max: 60 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      tint: color,
      angle: { min: 0, max: 360 },
      frequency: 30,
      emitting: true
    });
    
    return emitter;
  }

  // Special move activation effect
  createSpecialEffect(x: number, y: number, color: number): void {
    // Ring expansion
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(4, color, 1);
    graphics.strokeCircle(x, y, 10);
    
    this.scene.tweens.add({
      targets: graphics,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 400,
      onComplete: () => graphics.destroy()
    });

    // Energy burst
    const emitter = this.scene.add.particles(x, y, 'particle_star', {
      speed: { min: 300, max: 600 },
      scale: { start: 2, end: 0 },
      lifespan: 500,
      tint: color,
      angle: { min: 0, max: 360 },
      quantity: 1,
      emitting: false
    });
    emitter.explode(25);

    this.scene.time.delayedCall(600, () => emitter.destroy());
  }

  // Stack overflow stun effect
  createStackOverflowEffect(x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
    // Error symbols floating up
    const emitter = this.scene.add.particles(x, y, 'particle_code', {
      speedY: { min: -80, max: -40 },
      speedX: { min: -30, max: 30 },
      scale: { start: 1, end: 0.5 },
      lifespan: 1000,
      tint: 0xff0000,
      angle: { min: -10, max: 10 },
      frequency: 100,
      emitting: true
    });
    
    return emitter;
  }

  // Bug mode visual effect
  createBugEffect(x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(x, y, 'particle_square', {
      speedY: { min: -50, max: -20 },
      speedX: { min: -40, max: 40 },
      scale: { start: 0.8, end: 0 },
      lifespan: 800,
      tint: [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff], // Glitchy colors
      angle: { min: 0, max: 360 },
      rotate: { start: 0, end: 180 },
      frequency: 150,
      emitting: true
    });
    
    return emitter;
  }

  // Dash/movement trail
  createDashTrail(x: number, y: number, color: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speed: 0,
      scale: { start: 1, end: 0 },
      lifespan: 200,
      tint: color,
      alpha: { start: 0.6, end: 0 },
      quantity: 1,
      emitting: false
    });
    emitter.explode(3);
    
    this.scene.time.delayedCall(300, () => emitter.destroy());
  }

  // Jump effect
  createJumpEffect(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speedX: { min: -100, max: 100 },
      speedY: { min: 50, max: 100 },
      scale: { start: 0.8, end: 0 },
      lifespan: 300,
      tint: 0xcccccc,
      quantity: 1,
      emitting: false
    });
    emitter.explode(5);
    
    this.scene.time.delayedCall(400, () => emitter.destroy());
  }

  // Landing effect
  createLandingEffect(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speedX: { min: -80, max: 80 },
      speedY: { min: -30, max: 0 },
      scale: { start: 0.6, end: 0 },
      lifespan: 250,
      tint: 0x888888,
      quantity: 1,
      emitting: false
    });
    emitter.explode(8);
    
    this.scene.time.delayedCall(350, () => emitter.destroy());
  }

  // Respawn effect
  createRespawnEffect(x: number, y: number, color: number): void {
    // Teleport ring
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, color, 1 - i * 0.2);
        graphics.strokeCircle(x, y, 20);
        
        this.scene.tweens.add({
          targets: graphics,
          scaleX: 3,
          scaleY: 3,
          alpha: 0,
          duration: 400,
          onComplete: () => graphics.destroy()
        });
      });
    }

    // Sparkles
    const emitter = this.scene.add.particles(x, y, 'particle_star', {
      speed: { min: 50, max: 150 },
      scale: { start: 1.2, end: 0 },
      lifespan: 600,
      tint: color,
      angle: { min: 0, max: 360 },
      quantity: 1,
      emitting: false
    });
    emitter.explode(15);
    
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  // Countdown number effect
  createCountdownEffect(x: number, y: number, number: string): void {
    const text = this.scene.add.text(x, y, number, {
      fontFamily: 'Courier New, monospace',
      fontSize: '120px',
      color: '#00ff00',
      stroke: '#003300',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }
}
