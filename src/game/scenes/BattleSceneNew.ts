// Battle Scene - Complete rewrite with all game features
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ControlMode, loadSettings } from '../config';
import type { Character } from '../data/characters';
import type { SubComponent } from '../data/subcomponents';
import { stages } from '../data/stages';
import type { Stage } from '../data/stages';
import { Fighter } from '../entities/Fighter';
import { AIController, AIDifficulty } from '../entities/AIController';
import { characters } from '../data/characters';
import { subComponents } from '../data/subcomponents';
import { ScoreSystem } from '../systems/ScoreSystem';
import { StatusEffectSystem, BugEffect } from '../systems/StatusEffectSystem';
import { ParticleManager } from '../systems/ParticleManager';

interface BattleSceneData {
  mode: 'pve' | 'cpu' | 'training';
  playerCharacter: Character;
  playerSub: SubComponent;
  stage: Stage;
  aiDifficulty?: AIDifficulty;
}

// Game states
enum GameState {
  COUNTDOWN,
  PLAYING,
  PAUSED,
  GAME_OVER,
  ROUND_END
}

export class BattleScene extends Phaser.Scene {
  private mode!: string;
  private stage!: Stage;
  private gameState: GameState = GameState.COUNTDOWN;
  private aiDifficulty: AIDifficulty = AIDifficulty.NORMAL;
  
  // Fighters
  private player!: Fighter;
  private enemies: Fighter[] = [];
  private allFighters: Fighter[] = [];
  
  // AI
  private aiControllers: AIController[] = [];
  
  // Platforms
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private passthroughPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  
  // Systems
  private scoreSystem!: ScoreSystem;
  private statusSystem!: StatusEffectSystem;
  private particleManager!: ParticleManager;
  
  // Sound
  private soundEnabled: boolean = true;
  private sfxVolume: number = 0.5;
  
  // UI
  private uiContainer!: Phaser.GameObjects.Container;
  private damageTexts: Map<Fighter, Phaser.GameObjects.Text> = new Map();
  private stockIcons: Map<Fighter, Phaser.GameObjects.Graphics[]> = new Map();
  private specialGauges: Map<Fighter, Phaser.GameObjects.Graphics> = new Map();
  private statusIcons: Map<Fighter, Phaser.GameObjects.Container> = new Map();
  
  // Game timing
  private gameTime: number = 180; // 3 minutes
  private gameTimer!: Phaser.Time.TimerEvent;
  private timerText!: Phaser.GameObjects.Text;
  private countdownValue: number = 3;
  
  // Respawn
  private respawnTimers: Map<Fighter, number> = new Map();
  private static readonly RESPAWN_DELAY = 2000;
  private static readonly INVINCIBILITY_TIME = 3000;
  
  // Attack cooldowns
  private lightAttackCooldown: number = 0;
  private mediumAttackCooldown: number = 0;
  private heavyAttackCooldown: number = 0;
  private static readonly LIGHT_COOLDOWN = 200;
  private static readonly MEDIUM_COOLDOWN = 600;
  private static readonly HEAVY_COOLDOWN = 1200;
  
  // Combo tracking
  private comboCounter: number = 0;
  private comboTimer: number = 0;
  private static readonly COMBO_WINDOW = 1500;
  
  // Controls
  private controlMode!: ControlMode;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { [key: string]: Phaser.Input.Keyboard.Key };
  private vim!: { [key: string]: Phaser.Input.Keyboard.Key };
  private actionKeys!: { [key: string]: Phaser.Input.Keyboard.Key };
  
  // Last attacker tracking for KO attribution
  private lastAttackers: Map<Fighter, { attacker: Fighter; time: number }> = new Map();
  
  // Bug mode visuals
  private bugEffectEmitters: Map<Fighter, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private soEffectEmitters: Map<Fighter, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleSceneData): void {
    this.mode = data.mode;
    this.stage = data.stage;
    this.aiDifficulty = data.aiDifficulty || AIDifficulty.NORMAL;
    this.gameState = GameState.COUNTDOWN;
    this.countdownValue = 3;
    this.gameTime = 180;
    this.comboCounter = 0;
    this.comboTimer = 0;
    
    // Store player selection
    this.registry.set('playerCharacter', data.playerCharacter);
    this.registry.set('playerSub', data.playerSub);
    
    // Load control settings
    const settings = loadSettings();
    this.controlMode = settings.controlMode;
    
    // Clear previous data
    this.enemies = [];
    this.allFighters = [];
    this.aiControllers = [];
    this.damageTexts.clear();
    this.stockIcons.clear();
    this.specialGauges.clear();
    this.statusIcons.clear();
    this.lastAttackers.clear();
    this.respawnTimers.clear();
    this.bugEffectEmitters.clear();
    this.soEffectEmitters.clear();
  }

  create(): void {
    // Setup camera
    this.cameras.main.setBackgroundColor(this.stage.backgroundColor);
    
    // Initialize systems
    this.scoreSystem = new ScoreSystem();
    this.statusSystem = new StatusEffectSystem();
    this.particleManager = new ParticleManager(this);
    
    // Load sound settings
    const settings = loadSettings();
    this.soundEnabled = settings.soundEnabled;
    this.sfxVolume = settings.sfxVolume;
    
    // Create stage
    this.createStage();
    
    // Create fighters
    this.createFighters();
    
    // Setup physics
    this.setupCollisions();
    
    // Setup controls
    this.setupControls();
    
    // Create UI
    this.createUI();
    
    // Start countdown
    this.startCountdown();
    
    // Pause handling
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
  }

  private startCountdown(): void {
    this.gameState = GameState.COUNTDOWN;
    
    // Freeze all fighters during countdown
    this.allFighters.forEach(f => {
      f.body.setVelocity(0, 0);
      f.body.setAllowGravity(false);
    });
    
    // Countdown display
    const doCountdown = () => {
      if (this.countdownValue > 0) {
        this.particleManager.createCountdownEffect(
          GAME_WIDTH / 2, 
          GAME_HEIGHT / 2, 
          this.countdownValue.toString()
        );
        this.playCountdownSE();
        this.countdownValue--;
        this.time.delayedCall(1000, doCountdown);
      } else {
        // GO!
        const goText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'FIGHT!', {
          fontFamily: 'Courier New, monospace',
          fontSize: '80px',
          color: '#00ff00',
          stroke: '#003300',
          strokeThickness: 6
        }).setOrigin(0.5);
        
        this.tweens.add({
          targets: goText,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 800,
          onComplete: () => goText.destroy()
        });
        
        // Start game
        this.gameState = GameState.PLAYING;
        this.allFighters.forEach(f => {
          f.body.setAllowGravity(true);
        });
        this.startGameTimer();
      }
    };
    
    this.time.delayedCall(500, doCountdown);
  }

  private createStage(): void {
    // Draw background elements
    this.drawStageBackground();
    
    // Create platform groups
    this.platforms = this.physics.add.staticGroup();
    this.passthroughPlatforms = this.physics.add.staticGroup();
    
    // Create platforms from stage data
    this.stage.platforms.forEach(platform => {
      const graphics = this.add.graphics();
      
      // Hand-drawn style platform
      graphics.lineStyle(3, 0xffffff, 0.8);
      
      // Slightly wobbly lines for hand-drawn effect
      const wobble = () => (Math.random() - 0.5) * 3;
      
      // Top line
      graphics.beginPath();
      graphics.moveTo(platform.x - platform.width / 2 + wobble(), platform.y - platform.height / 2 + wobble());
      for (let i = 0; i <= platform.width; i += 20) {
        graphics.lineTo(
          platform.x - platform.width / 2 + i + wobble(),
          platform.y - platform.height / 2 + wobble()
        );
      }
      graphics.strokePath();
      
      // Fill for solid platforms
      if (platform.type === 'solid') {
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(
          platform.x - platform.width / 2,
          platform.y - platform.height / 2,
          platform.width,
          platform.height
        );
        
        // Side lines
        graphics.lineStyle(2, 0x888888, 0.5);
        graphics.lineBetween(
          platform.x - platform.width / 2, platform.y - platform.height / 2,
          platform.x - platform.width / 2, platform.y + platform.height / 2
        );
        graphics.lineBetween(
          platform.x + platform.width / 2, platform.y - platform.height / 2,
          platform.x + platform.width / 2, platform.y + platform.height / 2
        );
      } else {
        // Dashed line for passthrough
        graphics.lineStyle(2, 0x666666, 0.6);
        for (let i = 0; i < platform.width; i += 15) {
          graphics.lineBetween(
            platform.x - platform.width / 2 + i,
            platform.y,
            platform.x - platform.width / 2 + i + 8,
            platform.y
          );
        }
      }
      
      // Create physics body
      const zone = this.add.zone(platform.x, platform.y, platform.width, platform.height);
      
      if (platform.type === 'solid') {
        this.platforms.add(zone);
      } else {
        this.passthroughPlatforms.add(zone);
      }
      
      this.physics.add.existing(zone, true);
    });
  }

  private drawStageBackground(): void {
    const graphics = this.add.graphics();
    
    // Grid pattern
    graphics.lineStyle(1, 0x1a1a1a, 0.5);
    for (let x = 0; x < GAME_WIDTH; x += 50) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 50) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }
    
    // Death boundary indicators
    graphics.lineStyle(2, 0xff0000, 0.3);
    const bounds = this.stage.deathBoundary;
    
    // Warning lines near boundaries
    graphics.lineBetween(bounds.left + 50, 0, bounds.left + 50, GAME_HEIGHT);
    graphics.lineBetween(bounds.right - 50, 0, bounds.right - 50, GAME_HEIGHT);
    graphics.lineBetween(0, bounds.bottom - 50, GAME_WIDTH, bounds.bottom - 50);
    
    // Stage name
    this.add.text(20, 20, this.stage.name.en, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#333333'
    });
  }

  private createFighters(): void {
    const playerChar = this.registry.get('playerCharacter') as Character;
    const playerSub = this.registry.get('playerSub') as SubComponent;
    
    // Create player
    const playerSpawn = this.stage.spawnPoints[0];
    this.player = new Fighter({
      scene: this,
      x: playerSpawn.x,
      y: playerSpawn.y,
      character: playerChar,
      subComponent: playerSub,
      isPlayer: true,
      playerIndex: 0
    });
    this.allFighters.push(this.player);
    this.scoreSystem.registerFighter(this.player);
    this.statusSystem.registerFighter(this.player);
    
    // Create CPU enemies based on mode
    const enemyCount = this.mode === 'training' ? 1 : (this.mode === 'pve' ? 3 : 1);
    const difficulty = this.mode === 'training' ? AIDifficulty.EASY : this.aiDifficulty;
    
    for (let i = 0; i < enemyCount; i++) {
      // Select random character for CPU
      const cpuChar = characters[Math.floor(Math.random() * characters.length)];
      const cpuSub = subComponents[Math.floor(Math.random() * subComponents.length)];
      const spawn = this.stage.spawnPoints[(i + 1) % this.stage.spawnPoints.length];
      
      const enemy = new Fighter({
        scene: this,
        x: spawn.x,
        y: spawn.y,
        character: cpuChar,
        subComponent: cpuSub,
        isPlayer: false,
        playerIndex: i + 1
      });
      
      this.enemies.push(enemy);
      this.allFighters.push(enemy);
      this.scoreSystem.registerFighter(enemy);
      this.statusSystem.registerFighter(enemy);
      
      // Create AI controller
      const ai = new AIController(enemy, this, difficulty);
      ai.setEnemies([this.player, ...this.enemies.filter(e => e !== enemy)]);
      this.aiControllers.push(ai);
    }
    
    // Update all AI with enemy references
    this.aiControllers.forEach(ai => {
      ai.setEnemies(this.allFighters);
    });
  }

  private setupCollisions(): void {
    // All fighters collide with solid platforms
    this.allFighters.forEach(fighter => {
      this.physics.add.collider(fighter, this.platforms, () => {
        if (fighter.body.velocity.y >= 0 && !fighter.isGrounded) {
          fighter.isGrounded = true;
          this.particleManager.createLandingEffect(fighter.x, fighter.y + 45);
        }
      });
      
      // Passthrough platforms - only collide from above
      this.physics.add.collider(
        fighter, 
        this.passthroughPlatforms,
        undefined,
        (fighterObj, platform) => {
          const f = fighterObj as Fighter;
          const p = platform as Phaser.GameObjects.Zone;
          return f.body.velocity.y > 0 && f.y < p.y - 10;
        }
      );
    });
    
    // Fighter vs fighter collision for attacks
    this.allFighters.forEach(fighter1 => {
      this.allFighters.forEach(fighter2 => {
        if (fighter1 !== fighter2) {
          this.physics.add.overlap(fighter1, fighter2, () => {
            this.checkAttackHit(fighter1, fighter2);
          });
        }
      });
    });
  }

  private checkAttackHit(attacker: Fighter, victim: Fighter): void {
    if (!attacker.isAttacking) return;
    if (victim.isInvincible) return;
    if (attacker.hasHitThisAttack(victim)) return;
    
    // Check if attack can proceed (stack overflow check)
    const canAttack = this.statusSystem.onAttack(attacker, this.time.now);
    if (!canAttack) {
      // Show stack overflow effect
      if (!this.soEffectEmitters.has(attacker)) {
        const emitter = this.particleManager.createStackOverflowEffect(attacker.x, attacker.y - 50);
        this.soEffectEmitters.set(attacker, emitter);
      }
      return;
    }
    
    const damage = attacker.calculateDamage(attacker.isUsingSpecial);
    victim.takeDamage(damage.amount, damage.knockbackX, damage.knockbackY);
    attacker.markHit(victim);
    
    // Record damage for scoring
    this.scoreSystem.recordDamage(attacker, victim, damage.amount);
    
    // Check for bug trigger
    this.statusSystem.onTakeDamage(victim);
    
    // Track last attacker for KO attribution
    this.lastAttackers.set(victim, { attacker, time: this.time.now });
    
    // Hit effect and sound
    const hitX = (attacker.x + victim.x) / 2;
    const hitY = (attacker.y + victim.y) / 2;
    const color = Phaser.Display.Color.HexStringToColor(attacker.character.color).color;
    this.particleManager.createHitEffect(hitX, hitY, color);
    this.playHitSE();
    
    // Update combo
    if (attacker.isPlayer) {
      this.comboCounter++;
      this.comboTimer = BattleScene.COMBO_WINDOW;
      
      if (this.comboCounter >= 3) {
        this.scoreSystem.addComboBonus(attacker, this.comboCounter);
        this.showComboText(this.comboCounter);
      }
    }
    
    // Minimal camera shake only on very big hits
    // Reduced significantly to prevent motion sickness
    if (damage.amount > 30) {
      this.cameras.main.shake(50, 0.003);
    }
  }

  private showComboText(combo: number): void {
    const text = this.add.text(GAME_WIDTH / 2, 150, `${combo} HIT COMBO!`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: 120,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy()
    });
  }

  private setupControls(): void {
    const keyboard = this.input.keyboard!;
    
    // Cursor keys
    this.cursors = keyboard.createCursorKeys();
    
    // WASD
    this.wasd = {
      up: keyboard.addKey('W'),
      down: keyboard.addKey('S'),
      left: keyboard.addKey('A'),
      right: keyboard.addKey('D')
    };
    
    // VIM-style
    this.vim = {
      up: keyboard.addKey('K'),
      down: keyboard.addKey('J'),
      left: keyboard.addKey('H'),
      right: keyboard.addKey('L')
    };
    
    // Action keys (WASD mode uses JKL, others use Z/X/C/V)
    this.actionKeys = {
      lightAttack: keyboard.addKey('Z'),
      attackAlt: keyboard.addKey('J'),        // WASD mode: J for light attack
      mediumAttack: keyboard.addKey('X'),
      heavyAttack: keyboard.addKey('K'),      // WASD mode: K for heavy attack
      subAbility: keyboard.addKey('C'),
      special: keyboard.addKey('V')
    };
  }

  private createUI(): void {
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setDepth(100);
    
    // Timer
    this.timerText = this.add.text(GAME_WIDTH / 2, 30, this.formatTime(this.gameTime), {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#00ff00'
    }).setOrigin(0.5);
    this.uiContainer.add(this.timerText);
    
    // Player indicators
    this.allFighters.forEach((fighter, index) => {
      const isLeft = index < 2;
      const x = isLeft ? 100 + (index % 2) * 250 : GAME_WIDTH - 100 - (index % 2) * 250;
      const y = GAME_HEIGHT - 100;
      
      // Character name
      const nameText = this.add.text(x, y - 60, fighter.character.name.en, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: fighter.character.color
      }).setOrigin(0.5);
      this.uiContainer.add(nameText);
      
      // Player label
      const label = fighter.isPlayer ? 'P1' : `CPU${index}`;
      const labelText = this.add.text(x, y - 75, label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#888888'
      }).setOrigin(0.5);
      this.uiContainer.add(labelText);
      
      // Damage percentage
      const damageText = this.add.text(x, y - 25, '0%', {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.damageTexts.set(fighter, damageText);
      this.uiContainer.add(damageText);
      
      // Stock icons
      const stocksContainer: Phaser.GameObjects.Graphics[] = [];
      for (let i = 0; i < 3; i++) {
        const stockIcon = this.add.graphics();
        stockIcon.fillStyle(Phaser.Display.Color.HexStringToColor(fighter.character.color).color, 1);
        stockIcon.fillCircle(x - 30 + i * 20, y + 10, 6);
        stocksContainer.push(stockIcon);
        this.uiContainer.add(stockIcon);
      }
      this.stockIcons.set(fighter, stocksContainer);
      
      // Special gauge
      const gaugeGraphics = this.add.graphics();
      gaugeGraphics.x = x - 40;
      gaugeGraphics.y = y + 30;
      this.specialGauges.set(fighter, gaugeGraphics);
      this.uiContainer.add(gaugeGraphics);
      
      // Status icons container
      const statusContainer = this.add.container(x, y - 90);
      this.statusIcons.set(fighter, statusContainer);
      this.uiContainer.add(statusContainer);
    });
    
    // Player-specific UI
    this.createPlayerUI();
  }

  private createPlayerUI(): void {
    // Cooldown bars on the left
    const barX = 30;
    const barY = 200;
    const barWidth = 100;
    const barHeight = 15;
    const barSpacing = 25;
    
    // Get control mode for key display
    const settings = loadSettings();
    const mode = settings.controlMode;
    
    let lightKey = 'Z';
    let heavyKey = 'SHIFT';
    
    if (mode === ControlMode.WASD) {
      lightKey = 'J';
      heavyKey = 'K';
    }
    
    // Light attack cooldown
    this.add.text(barX, barY, `${lightKey} Light`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#666666'
    });
    
    // Medium attack cooldown
    this.add.text(barX, barY + barSpacing, 'X Medium', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#666666'
    });
    
    // Heavy attack cooldown
    this.add.text(barX, barY + barSpacing * 2, `${heavyKey} Heavy`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#666666'
    });
    
    // Sub ability
    this.add.text(barX, barY + barSpacing * 3, 'C Sub', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#666666'
    });
    
    // Special
    this.add.text(barX, barY + barSpacing * 4, 'V Special', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#666666'
    });
    
    // Stack overflow meter
    this.add.text(barX, barY + barSpacing * 6, 'STACK METER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#ff6666'
    });
  }

  private startGameTimer(): void {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameState === GameState.PLAYING) {
          this.gameTime--;
          this.timerText.setText(this.formatTime(this.gameTime));
          
          // Warning flash at 30 seconds
          if (this.gameTime === 30) {
            this.timerText.setStyle({ color: '#ffff00' });
          } else if (this.gameTime === 10) {
            this.timerText.setStyle({ color: '#ff0000' });
          }
          
          if (this.gameTime <= 0) {
            this.endGame();
          }
        }
      },
      loop: true
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  update(time: number, delta: number): void {
    if (this.gameState !== GameState.PLAYING) return;
    
    // Update cooldowns
    this.lightAttackCooldown = Math.max(0, this.lightAttackCooldown - delta);
    this.mediumAttackCooldown = Math.max(0, this.mediumAttackCooldown - delta);
    this.heavyAttackCooldown = Math.max(0, this.heavyAttackCooldown - delta);
    
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCounter = 0;
      }
    }
    
    // Handle player input
    this.handlePlayerInput();
    
    // Update all fighters
    this.allFighters.forEach(fighter => {
      // Skip update if fighter is waiting to respawn
      if (this.respawnTimers.has(fighter)) {
        // Only update respawn timer
        this.updateRespawnTimer(fighter, delta);
        return;
      }
      
      // Update status effects
      this.statusSystem.update(fighter, delta);
      
      // Apply bug effects
      this.applyBugEffects(fighter);
      
      // Update fighter
      fighter.update(delta);
      
      // Check death boundary only for active fighters
      if (fighter.body.enable && fighter.visible) {
        this.checkDeathBoundary(fighter);
      }
    });
    
    // Update AI
    this.aiControllers.forEach(ai => {
      ai.update(time, delta);
    });
    
    // Update bug/SO effect positions
    this.updateEffectPositions();
    
    // Update UI
    this.updateUI();
    
    // Check win condition
    this.checkWinCondition();
  }

  private applyBugEffects(fighter: Fighter): void {
    if (this.statusSystem.isBugged(fighter)) {
      // Show bug particles if not already showing
      if (!this.bugEffectEmitters.has(fighter)) {
        const emitter = this.particleManager.createBugEffect(fighter.x, fighter.y);
        this.bugEffectEmitters.set(fighter, emitter);
      }
      
      const effects = this.statusSystem.getBugEffects(fighter);
      fighter.setBugEffects(effects);
    } else {
      // Remove bug particles if active
      const emitter = this.bugEffectEmitters.get(fighter);
      if (emitter) {
        emitter.stop();
        emitter.destroy();
        this.bugEffectEmitters.delete(fighter);
      }
      fighter.setBugEffects([]);
    }
    
    // Stack overflow stun
    if (this.statusSystem.isStunned(fighter)) {
      fighter.isHitstun = true;
      if (!this.soEffectEmitters.has(fighter)) {
        const emitter = this.particleManager.createStackOverflowEffect(fighter.x, fighter.y - 50);
        this.soEffectEmitters.set(fighter, emitter);
      }
    } else {
      const emitter = this.soEffectEmitters.get(fighter);
      if (emitter && !fighter.isHitstun) {
        emitter.stop();
        emitter.destroy();
        this.soEffectEmitters.delete(fighter);
      }
    }
  }

  private updateEffectPositions(): void {
    // Update bug effect emitter positions
    this.bugEffectEmitters.forEach((emitter, fighter) => {
      emitter.setPosition(fighter.x, fighter.y);
    });
    
    // Update SO effect emitter positions
    this.soEffectEmitters.forEach((emitter, fighter) => {
      emitter.setPosition(fighter.x, fighter.y - 50);
    });
  }

  private handlePlayerInput(): void {
    if (this.player.stocks <= 0) return;
    if (this.respawnTimers.has(this.player)) return;
    if (this.statusSystem.isStunned(this.player)) return;
    
    // Get bug effects for reversed controls
    const bugEffects = this.statusSystem.getBugEffects(this.player);
    const reversed = bugEffects.includes(BugEffect.REVERSED_CONTROLS);
    const noJump = bugEffects.includes(BugEffect.NO_JUMP);
    
    // Movement based on control mode
    let left = false, right = false, up = false, down = false;
    
    switch (this.controlMode) {
      case ControlMode.ARROWS:
        left = this.cursors.left.isDown;
        right = this.cursors.right.isDown;
        up = this.cursors.up.isDown;
        down = this.cursors.down.isDown;
        break;
      case ControlMode.WASD:
        left = this.wasd.left.isDown;
        right = this.wasd.right.isDown;
        up = this.wasd.up.isDown;
        down = this.wasd.down.isDown;
        break;
      case ControlMode.VIM:
        left = this.vim.left.isDown;
        right = this.vim.right.isDown;
        up = this.vim.up.isDown;
        down = this.vim.down.isDown;
        break;
    }
    
    // Apply reversed controls if bugged
    if (reversed) {
      [left, right] = [right, left];
    }
    
    // Jump
    if (!noJump) {
      const jumpKey = this.controlMode === ControlMode.ARROWS ? this.cursors.up :
                      this.controlMode === ControlMode.WASD ? this.wasd.up : this.vim.up;
      
      if (Phaser.Input.Keyboard.JustDown(jumpKey)) {
        if (this.player.jump()) {
          this.particleManager.createJumpEffect(this.player.x, this.player.y + 45);
        }
      }
    }
    
    // Movement
    if (left) {
      this.player.moveLeft();
    } else if (right) {
      this.player.moveRight();
    }
    
    // Light attack (Z or Space)
    if ((Phaser.Input.Keyboard.JustDown(this.actionKeys.lightAttack) ||
         Phaser.Input.Keyboard.JustDown(this.actionKeys.attackAlt)) &&
        this.lightAttackCooldown <= 0) {
      this.player.attack('light');
      this.lightAttackCooldown = BattleScene.LIGHT_COOLDOWN;
    }
    
    // Medium attack (X)
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.mediumAttack) &&
        this.mediumAttackCooldown <= 0) {
      this.player.attack('medium');
      this.mediumAttackCooldown = BattleScene.MEDIUM_COOLDOWN;
    }
    
    // Heavy attack (Shift)
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.heavyAttack) &&
        this.heavyAttackCooldown <= 0) {
      this.player.attack('heavy');
      this.heavyAttackCooldown = BattleScene.HEAVY_COOLDOWN;
    }
    
    // Sub ability (C)
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.subAbility)) {
      this.player.useSubAbility();
    }
    
    // Special (V)
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.special) &&
        this.player.specialCooldown <= 0) {
      this.player.useSpecial();
      this.createSpecialEffect(this.player);
    }
  }

  private createSpecialEffect(fighter: Fighter): void {
    const color = Phaser.Display.Color.HexStringToColor(fighter.character.color).color;
    this.particleManager.createSpecialEffect(fighter.x, fighter.y, color);
    this.playSpecialSE();
    
    // Special name popup
    const namePopup = this.add.text(fighter.x, fighter.y - 80, 
      fighter.character.special_move.name.en, {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: namePopup,
      y: fighter.y - 120,
      alpha: 0,
      duration: 1000,
      onComplete: () => namePopup.destroy()
    });
    
    // Apply special damage to nearby enemies
    this.allFighters.forEach(target => {
      if (target === fighter) return;
      if (target.isInvincible) return;
      
      const distance = Phaser.Math.Distance.Between(
        fighter.x, fighter.y,
        target.x, target.y
      );
      
      if (distance < fighter.character.special_move.range) {
        const damage = fighter.calculateDamage(true);
        target.takeDamage(damage.amount, damage.knockbackX * 1.5, damage.knockbackY * 1.5);
        this.scoreSystem.recordDamage(fighter, target, damage.amount);
        this.lastAttackers.set(target, { attacker: fighter, time: this.time.now });
      }
    });
  }

  private checkDeathBoundary(fighter: Fighter): void {
    const bounds = this.stage.deathBoundary;
    
    if (
      fighter.x < bounds.left ||
      fighter.x > bounds.right ||
      fighter.y < bounds.top ||
      fighter.y > bounds.bottom
    ) {
      this.handleKO(fighter);
    }
  }

  private handleKO(fighter: Fighter): void {
    // Prevent duplicate KO processing
    if (this.respawnTimers.has(fighter)) {
      return;
    }
    
    // Prevent KO if fighter is already invisible/disabled (safety check)
    if (!fighter.visible || !fighter.body.enable) {
      return;
    }
    
    // Find last attacker
    const lastHit = this.lastAttackers.get(fighter);
    const killer = (lastHit && this.time.now - lastHit.time < 10000) ? lastHit.attacker : null;
    
    // Record KO in score system
    this.scoreSystem.recordKO(fighter, killer);
    
    // KO effect and sound - use clamped position to prevent off-screen effects
    const color = Phaser.Display.Color.HexStringToColor(fighter.character.color).color;
    this.particleManager.createKOEffect(
      Math.max(50, Math.min(GAME_WIDTH - 50, fighter.x)),
      Math.max(50, Math.min(GAME_HEIGHT - 50, fighter.y)),
      color
    );
    this.playKOSE();
    
    // Immediately disable physics and hide to prevent further interactions
    fighter.setVisible(false);
    fighter.body.setEnable(false);
    fighter.body.setVelocity(0, 0);
    
    // Decrement stocks
    fighter.loseStock();
    
    // Update stock display immediately
    this.updateStockDisplay(fighter);
    
    // Start respawn timer
    if (fighter.stocks > 0) {
      this.respawnTimers.set(fighter, BattleScene.RESPAWN_DELAY);
    }
    
    // Clear last attacker
    this.lastAttackers.delete(fighter);
  }

  private updateRespawnTimer(fighter: Fighter, delta: number): void {
    if (!this.respawnTimers.has(fighter)) return;
    
    const remaining = this.respawnTimers.get(fighter)! - delta;
    
    if (remaining <= 0) {
      this.respawnTimers.delete(fighter);
      
      // Respawn
      const spawnIndex = fighter.playerIndex % this.stage.spawnPoints.length;
      const spawn = this.stage.spawnPoints[spawnIndex];
      
      fighter.respawn(spawn.x, spawn.y);
      fighter.setVisible(true);
      fighter.body.setEnable(true);
      
      // Grant invincibility - use Fighter's method for consistency
      fighter.isInvincible = true;
      fighter.setAlpha(0.6);
      
      // Subtle respawn effect
      const color = Phaser.Display.Color.HexStringToColor(fighter.character.color).color;
      this.particleManager.createRespawnEffect(spawn.x, spawn.y, color);
      
      // Remove invincibility after delay - increased to 3 seconds
      this.time.delayedCall(3000, () => {
        if (fighter && !fighter.scene) return; // Check if fighter still exists
        fighter.isInvincible = false;
        fighter.setAlpha(1);
      });
    } else {
      this.respawnTimers.set(fighter, remaining);
    }
  }

  private updateUI(): void {
    // Update damage percentages
    this.allFighters.forEach(fighter => {
      const damageText = this.damageTexts.get(fighter);
      if (damageText) {
        const damage = Math.floor(fighter.damage);
        damageText.setText(`${damage}%`);
        
        // Color based on damage
        if (damage < 50) {
          damageText.setStyle({ color: '#ffffff' });
        } else if (damage < 100) {
          damageText.setStyle({ color: '#ffff00' });
        } else if (damage < 150) {
          damageText.setStyle({ color: '#ff9900' });
        } else {
          damageText.setStyle({ color: '#ff0000' });
        }
      }
      
      // Update special gauge
      const gauge = this.specialGauges.get(fighter);
      if (gauge) {
        gauge.clear();
        const width = 80;
        const height = 8;
        
        // Background
        gauge.fillStyle(0x333333, 1);
        gauge.fillRect(0, 0, width, height);
        
        // Fill
        const progress = fighter.specialCooldown <= 0 ? 1 : 
          1 - (fighter.specialCooldown / fighter.character.special_move.cooldown);
        const fillColor = progress >= 1 ? 0x00ff00 : 0x666666;
        gauge.fillStyle(fillColor, 1);
        gauge.fillRect(0, 0, width * progress, height);
        
        // Border
        gauge.lineStyle(1, 0xffffff, 0.5);
        gauge.strokeRect(0, 0, width, height);
      }
      
      // Update status icons
      const statusContainer = this.statusIcons.get(fighter);
      if (statusContainer) {
        statusContainer.removeAll(true);
        
        let iconX = -30;
        
        // Stack overflow warning
        const soProgress = this.statusSystem.getStackOverflowProgress(fighter);
        if (soProgress > 0.5) {
          const soIcon = this.add.text(iconX, 0, '⚠', {
            fontSize: '14px',
            color: soProgress > 0.8 ? '#ff0000' : '#ffff00'
          }).setOrigin(0.5);
          statusContainer.add(soIcon);
          iconX += 20;
        }
        
        // Bug status
        if (this.statusSystem.isBugged(fighter)) {
          const bugIcon = this.add.text(iconX, 0, 'BUG', {
            fontFamily: 'Courier New, monospace',
            fontSize: '10px',
            color: '#ff00ff'
          }).setOrigin(0.5);
          statusContainer.add(bugIcon);
          iconX += 25;
        }
        
        // Invincibility
        if (fighter.isInvincible) {
          const invIcon = this.add.text(iconX, 0, '★', {
            fontSize: '14px',
            color: '#00ffff'
          }).setOrigin(0.5);
          statusContainer.add(invIcon);
        }
      }
    });
    
    // Update cooldown bars for player
    this.updateCooldownBars();
  }

  private updateCooldownBars(): void {
    const barX = 30;
    const barY = 200;
    const barWidth = 100;
    const barHeight = 10;
    const barSpacing = 25;
    
    // This would need graphics objects stored as class members
    // For now, we'll redraw each frame (not optimal but works)
    const cooldownGraphics = this.add.graphics();
    cooldownGraphics.setDepth(101);
    
    // Light attack
    this.drawCooldownBar(cooldownGraphics, barX + 70, barY + 3, barWidth, barHeight,
      this.lightAttackCooldown / BattleScene.LIGHT_COOLDOWN);
    
    // Medium attack
    this.drawCooldownBar(cooldownGraphics, barX + 70, barY + barSpacing + 3, barWidth, barHeight,
      this.mediumAttackCooldown / BattleScene.MEDIUM_COOLDOWN);
    
    // Heavy attack
    this.drawCooldownBar(cooldownGraphics, barX + 85, barY + barSpacing * 2 + 3, barWidth, barHeight,
      this.heavyAttackCooldown / BattleScene.HEAVY_COOLDOWN);
    
    // Sub ability
    this.drawCooldownBar(cooldownGraphics, barX + 80, barY + barSpacing * 3 + 3, barWidth, barHeight,
      this.player.subAbilityCooldown / (this.player.subComponent?.ability.cooldown || 5000));
    
    // Special
    this.drawCooldownBar(cooldownGraphics, barX + 70, barY + barSpacing * 4 + 3, barWidth, barHeight,
      this.player.specialCooldown / this.player.character.special_move.cooldown);
    
    // Stack overflow meter
    const soProgress = this.statusSystem.getStackOverflowProgress(this.player);
    this.drawStackMeter(cooldownGraphics, barX, barY + barSpacing * 6 + 15, 120, 12, soProgress);
    
    // Auto-destroy next frame
    this.time.delayedCall(16, () => cooldownGraphics.destroy());
  }

  private drawCooldownBar(graphics: Phaser.GameObjects.Graphics, 
    x: number, y: number, width: number, height: number, cooldownPercent: number): void {
    
    // Background
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(x, y, width, height);
    
    // Ready or cooldown
    if (cooldownPercent <= 0) {
      graphics.fillStyle(0x00ff00, 1);
      graphics.fillRect(x, y, width, height);
    } else {
      graphics.fillStyle(0x666666, 1);
      graphics.fillRect(x, y, width * (1 - cooldownPercent), height);
    }
    
    // Border
    graphics.lineStyle(1, 0xffffff, 0.3);
    graphics.strokeRect(x, y, width, height);
  }

  private drawStackMeter(graphics: Phaser.GameObjects.Graphics,
    x: number, y: number, width: number, height: number, progress: number): void {
    
    // Background
    graphics.fillStyle(0x330000, 1);
    graphics.fillRect(x, y, width, height);
    
    // Fill based on danger level
    let color = 0x00ff00;
    if (progress > 0.8) color = 0xff0000;
    else if (progress > 0.5) color = 0xffff00;
    else if (progress > 0.3) color = 0x88ff00;
    
    graphics.fillStyle(color, 1);
    graphics.fillRect(x, y, width * progress, height);
    
    // Border
    graphics.lineStyle(1, 0xff6666, 0.5);
    graphics.strokeRect(x, y, width, height);
  }

  private updateStockDisplay(fighter: Fighter): void {
    const icons = this.stockIcons.get(fighter);
    if (icons) {
      icons.forEach((icon, index) => {
        icon.setAlpha(index < fighter.stocks ? 1 : 0.2);
      });
    }
  }

  private checkWinCondition(): void {
    // Check if player is out
    if (this.player.stocks <= 0) {
      this.endGame();
      return;
    }
    
    // Check if all enemies are out
    const aliveEnemies = this.enemies.filter(e => e.stocks > 0);
    if (aliveEnemies.length === 0) {
      this.endGame();
    }
  }

  private togglePause(): void {
    if (this.gameState === GameState.COUNTDOWN) return;
    
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING;
      this.physics.resume();
      this.hidePauseMenu();
    } else if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
      this.physics.pause();
      this.showPauseMenu();
    }
  }

  private showPauseMenu(): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setName('pauseOverlay');
    overlay.setDepth(200);
    
    const pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '[ PAUSED ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: '#00ff00'
    }).setOrigin(0.5).setDepth(201);
    pauseText.setName('pauseText');
    
    const resumeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Press ESC to Resume', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5).setDepth(201);
    resumeText.setName('resumeText');
    
    const quitText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Press Q to Quit', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5).setDepth(201);
    quitText.setName('quitText');
    
    this.input.keyboard?.once('keydown-Q', () => {
      if (this.gameState === GameState.PAUSED) {
        this.cleanupAndExit();
      }
    });
  }

  private hidePauseMenu(): void {
    ['pauseOverlay', 'pauseText', 'resumeText', 'quitText'].forEach(name => {
      const obj = this.children.getByName(name);
      if (obj) obj.destroy();
    });
  }

  private endGame(): void {
    this.gameState = GameState.GAME_OVER;
    this.physics.pause();
    
    if (this.gameTimer) {
      this.gameTimer.destroy();
    }
    
    // Calculate results with score breakdown
    const results = this.allFighters.map(fighter => ({
      character: fighter.character,
      isPlayer: fighter.isPlayer,
      score: this.scoreSystem.getTotalScore(fighter),
      scoreBreakdown: this.scoreSystem.getScoreBreakdown(fighter),
      pushCount: this.scoreSystem.getPushCount(fighter),
      stocks: fighter.stocks,
      damage: fighter.damage
    })).sort((a, b) => {
      // Sort by stocks first, then total score
      if (a.stocks !== b.stocks) return b.stocks - a.stocks;
      return b.score - a.score;
    });
    
    // Fade transition
    this.cameras.main.fade(500, 0, 0, 0);
    
    this.time.delayedCall(500, () => {
      this.cleanup();
      // Clean up keyboard listeners
      this.input.keyboard?.removeAllListeners();
      this.scene.start('ResultScene', { results, mode: this.mode });
    });
  }

  private cleanupAndExit(): void {
    this.cleanup();
    // Clean up before transition
    this.input.keyboard?.removeAllListeners();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.scene.start('MenuScene');
  }

  private cleanup(): void {
    // Stop timers
    if (this.gameTimer) {
      this.gameTimer.destroy();
    }
    
    // Stop all time events
    this.time.removeAllEvents();
    
    // Stop all tweens
    this.tweens.killAll();
    
    // Destroy effect emitters
    this.bugEffectEmitters.forEach(e => e.destroy());
    this.soEffectEmitters.forEach(e => e.destroy());
    this.bugEffectEmitters.clear();
    this.soEffectEmitters.clear();
    
    // Clear AI controllers
    this.aiControllers = [];
    
    // Remove keyboard listeners
    this.input.keyboard?.removeAllListeners();
  }

  // Public methods for AI and sub-component abilities
  getAllFighters(): Fighter[] {
    return this.allFighters;
  }

  getNearestEnemy(fighter: Fighter): Fighter | null {
    let nearest: Fighter | null = null;
    let nearestDist = Infinity;
    
    this.allFighters.forEach(f => {
      if (f === fighter || f.stocks <= 0) return;
      const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, f.x, f.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = f;
      }
    });
    
    return nearest;
  }

  createBarrier(x: number, y: number, duration: number): void {
    const barrier = this.add.graphics();
    barrier.fillStyle(0xe44d26, 0.5);
    barrier.fillRect(x - 10, y - 50, 20, 100);
    
    const barrierZone = this.add.zone(x, y, 20, 100);
    this.physics.add.existing(barrierZone, true);
    this.platforms.add(barrierZone);
    
    this.time.delayedCall(duration, () => {
      barrier.destroy();
      barrierZone.destroy();
    });
  }

  // Sound effect utilities
  private playSE(seKey: string, volume?: number): void {
    if (!this.soundEnabled) return;
    
    const vol = volume ?? this.sfxVolume;
    try {
      this.sound.play(seKey, { volume: vol });
    } catch (e) {
      // SE play failed, continue without sound
    }
  }

  private playHitSE(): void {
    // Random hit sound for variety
    const hitSounds = ['se_hit_1', 'se_hit_2', 'se_hit_3'];
    const random = hitSounds[Math.floor(Math.random() * hitSounds.length)];
    this.playSE(random, this.sfxVolume * 0.8);
  }

  private playSpecialSE(): void {
    this.playSE('se_special', this.sfxVolume * 0.9);
  }

  private playKOSE(): void {
    this.playSE('se_ko', this.sfxVolume);
  }

  private playCountdownSE(): void {
    this.playSE('se_countdown', this.sfxVolume * 0.6);
  }
}

