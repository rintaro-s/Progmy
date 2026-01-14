// Battle Scene - Main gameplay
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

interface BattleSceneData {
  mode: 'pve' | 'cpu' | 'training';
  playerCharacter: Character;
  playerSub: SubComponent;
  stage: Stage;
}

export class BattleScene extends Phaser.Scene {
  private mode!: string;
  private stage!: Stage;
  
  // Fighters
  private player!: Fighter;
  private enemies: Fighter[] = [];
  private allFighters: Fighter[] = [];
  
  // AI
  private aiControllers: AIController[] = [];
  
  // Platforms
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private passthroughPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  
  // UI
  private uiContainer!: Phaser.GameObjects.Container;
  private damageTexts: Map<Fighter, Phaser.GameObjects.Text> = new Map();
  private stockIcons: Map<Fighter, Phaser.GameObjects.Graphics[]> = new Map();
  
  // Game state
  private gameTime: number = 180; // 3 minutes
  private gameTimer!: Phaser.Time.TimerEvent;
  private timerText!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  
  // Controls
  private controlMode!: ControlMode;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { [key: string]: Phaser.Input.Keyboard.Key };
  private vim!: { [key: string]: Phaser.Input.Keyboard.Key };
  private actionKeys!: { [key: string]: Phaser.Input.Keyboard.Key };
  
  // Effects
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleSceneData): void {
    this.mode = data.mode;
    this.stage = data.stage;
    
    // Store player selection
    this.registry.set('playerCharacter', data.playerCharacter);
    this.registry.set('playerSub', data.playerSub);
    
    // Load control settings
    const settings = loadSettings();
    this.controlMode = settings.controlMode;
  }

  create(): void {
    // Setup camera
    this.cameras.main.fadeIn(300);
    this.cameras.main.setBackgroundColor(this.stage.backgroundColor);
    
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
    
    // Create particle system
    this.createParticles();
    
    // Start game timer
    this.startGameTimer();
    
    // Pause handling
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
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
    
    // Create CPU enemies based on mode
    const enemyCount = this.mode === 'training' ? 1 : (this.mode === 'pve' ? 3 : 1);
    const difficulty = this.mode === 'training' ? AIDifficulty.EASY : 
                       this.mode === 'pve' ? AIDifficulty.NORMAL : AIDifficulty.HARD;
    
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
      this.physics.add.collider(fighter, this.platforms);
      
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
    
    // Fighter vs fighter collision
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
    
    // Action keys
    this.actionKeys = {
      attack: keyboard.addKey('Z'),
      attackAlt: keyboard.addKey('SPACE'),
      special: keyboard.addKey('X'),
      specialAlt: keyboard.addKey('SHIFT'),
      subAbility: keyboard.addKey('C'),
      jump: keyboard.addKey('UP')
    };
  }

  private createUI(): void {
    this.uiContainer = this.add.container(0, 0);
    
    // Timer
    this.timerText = this.add.text(GAME_WIDTH / 2, 30, this.formatTime(this.gameTime), {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#00ff00'
    }).setOrigin(0.5);
    this.uiContainer.add(this.timerText);
    
    // Player indicators
    this.allFighters.forEach((fighter, index) => {
      const x = 100 + index * 300;
      const y = GAME_HEIGHT - 80;
      
      // Character name
      const nameText = this.add.text(x, y - 40, fighter.character.name.en, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: fighter.character.color
      }).setOrigin(0.5);
      this.uiContainer.add(nameText);
      
      // Player label
      const label = fighter.isPlayer ? 'P1' : `CPU${index}`;
      const labelText = this.add.text(x, y - 55, label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#888888'
      }).setOrigin(0.5);
      this.uiContainer.add(labelText);
      
      // Damage percentage
      const damageText = this.add.text(x, y, '0%', {
        fontFamily: 'Courier New, monospace',
        fontSize: '36px',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.damageTexts.set(fighter, damageText);
      this.uiContainer.add(damageText);
      
      // Stock icons
      const icons: Phaser.GameObjects.Graphics[] = [];
      for (let i = 0; i < 3; i++) {
        const icon = this.add.graphics();
        icon.fillStyle(Phaser.Display.Color.HexStringToColor(fighter.character.color).color, 1);
        icon.fillCircle(x - 25 + i * 25, y + 30, 8);
        icons.push(icon);
        this.uiContainer.add(icon);
      }
      this.stockIcons.set(fighter, icons);
    });
    
    // Special cooldown indicator for player
    const cooldownText = this.add.text(100, GAME_HEIGHT - 120, 'SPECIAL: READY', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#00ff00'
    });
    cooldownText.setName('cooldownText');
    this.uiContainer.add(cooldownText);
    
    // Controls hint
    const controlsHint = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, 
      'Z/Space: Attack | X/Shift: Special | C: Sub | ESC: Pause', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#444444'
    }).setOrigin(1, 1);
    this.uiContainer.add(controlsHint);
  }

  private createParticles(): void {
    // Create a simple graphics texture for particles
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
    
    // Create emitter (but don't emit yet)
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      emitting: false
    });
  }

  private startGameTimer(): void {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isPaused && !this.isGameOver) {
          this.gameTime--;
          this.timerText.setText(this.formatTime(this.gameTime));
          
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
    if (this.isPaused || this.isGameOver) return;
    
    // Handle player input
    this.handlePlayerInput();
    
    // Update all fighters
    this.allFighters.forEach(fighter => {
      fighter.update(delta);
      this.checkDeathBoundary(fighter);
    });
    
    // Update AI
    this.aiControllers.forEach((ai, index) => {
      ai.update(time, delta);
    });
    
    // Update UI
    this.updateUI();
    
    // Check win condition
    this.checkWinCondition();
  }

  private handlePlayerInput(): void {
    if (this.player.stocks <= 0) return;
    
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
    
    // Always allow arrow keys for jumping
    if (this.cursors.up.isDown || up) {
      // Jump on first press only
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
          (this.controlMode !== ControlMode.ARROWS && Phaser.Input.Keyboard.JustDown(this.wasd.up)) ||
          (this.controlMode === ControlMode.VIM && Phaser.Input.Keyboard.JustDown(this.vim.up))) {
        this.player.jump();
      }
    }
    
    if (left) {
      this.player.moveLeft();
    } else if (right) {
      this.player.moveRight();
    }
    
    // Actions
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.attack) ||
        Phaser.Input.Keyboard.JustDown(this.actionKeys.attackAlt)) {
      this.player.attack();
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.special) ||
        Phaser.Input.Keyboard.JustDown(this.actionKeys.specialAlt)) {
      this.player.useSpecial();
      this.createSpecialEffect(this.player);
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.subAbility)) {
      this.player.useSubAbility();
    }
  }

  private checkAttackHit(attacker: Fighter, target: Fighter): void {
    if (attacker === target) return;
    if (!attacker.isAttacking) return;
    if (target.isInvincible) return;
    
    const hitbox = attacker.getAttackHitbox();
    if (!hitbox) return;
    
    // Check if target is in hitbox
    const targetBounds = new Phaser.Geom.Rectangle(
      target.x - 15, target.y - 35,
      30, 70
    );
    
    if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, targetBounds)) {
      // Calculate damage
      const damage = attacker.calculateDamage(false);
      target.takeDamage(damage.amount, damage.knockbackX, damage.knockbackY);
      
      // Hit effect
      this.createHitEffect(target.x, target.y);
      
      // Screen shake for high damage
      if (damage.amount > 20) {
        this.cameras.main.shake(100, 0.01);
      }
      
      // Score
      attacker.score += Math.floor(damage.amount);
    }
  }

  private createHitEffect(x: number, y: number): void {
    this.particles.setPosition(x, y);
    this.particles.explode(10);
    
    // Flash effect
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 0.8);
    flash.fillCircle(x, y, 30);
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 150,
      onComplete: () => flash.destroy()
    });
  }

  private createSpecialEffect(fighter: Fighter): void {
    const color = Phaser.Display.Color.HexStringToColor(fighter.character.color).color;
    
    // Aura effect
    const aura = this.add.graphics();
    aura.lineStyle(4, color, 1);
    aura.strokeCircle(fighter.x, fighter.y, 50);
    
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
      targets: [aura],
      alpha: 0,
      scale: 3,
      duration: 500,
      onComplete: () => aura.destroy()
    });
    
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
      
      const distance = Phaser.Math.Distance.Between(
        fighter.x, fighter.y,
        target.x, target.y
      );
      
      if (distance < fighter.character.special_move.range) {
        const damage = fighter.calculateDamage(true);
        target.takeDamage(damage.amount, damage.knockbackX, damage.knockbackY);
        fighter.score += Math.floor(damage.amount * 1.5);
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
    // Find who was the last attacker (simplified - just check who's attacking)
    let lastAttacker: Fighter | undefined = undefined;
    this.allFighters.forEach(f => {
      if (f !== fighter && f.isAttacking) {
        lastAttacker = f;
      }
    });
    
    // Award KO
    if (lastAttacker) {
      (lastAttacker as Fighter).score += 100;
    }
    
    // Respawn
    const spawnIndex = fighter.playerIndex % this.stage.spawnPoints.length;
    const spawn = this.stage.spawnPoints[spawnIndex];
    fighter.respawn(spawn.x, spawn.y);
    
    // KO effect
    this.cameras.main.flash(200, 255, 0, 0);
    
    // Update stock display
    this.updateStockDisplay(fighter);
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
    });
    
    // Update cooldown display
    const cooldownText = this.uiContainer.getByName('cooldownText') as Phaser.GameObjects.Text;
    if (cooldownText) {
      if (this.player.specialCooldown <= 0) {
        cooldownText.setText('SPECIAL: READY');
        cooldownText.setStyle({ color: '#00ff00' });
      } else {
        const remaining = Math.ceil(this.player.specialCooldown / 1000);
        cooldownText.setText(`SPECIAL: ${remaining}s`);
        cooldownText.setStyle({ color: '#ff6666' });
      }
    }
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
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.physics.pause();
      this.showPauseMenu();
    } else {
      this.physics.resume();
      this.hidePauseMenu();
    }
  }

  private showPauseMenu(): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setName('pauseOverlay');
    
    const pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '[ PAUSED ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: '#00ff00'
    }).setOrigin(0.5);
    pauseText.setName('pauseText');
    
    const resumeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Press ESC to Resume', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5);
    resumeText.setName('resumeText');
    
    const quitText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Press Q to Quit', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5);
    quitText.setName('quitText');
    
    this.input.keyboard?.once('keydown-Q', () => {
      if (this.isPaused) {
        this.scene.start('MenuScene');
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
    this.isGameOver = true;
    this.physics.pause();
    
    // Calculate results
    const results = this.allFighters.map(fighter => ({
      character: fighter.character,
      isPlayer: fighter.isPlayer,
      score: fighter.score,
      stocks: fighter.stocks,
      damage: fighter.damage
    })).sort((a, b) => {
      // Sort by stocks first, then score
      if (a.stocks !== b.stocks) return b.stocks - a.stocks;
      return b.score - a.score;
    });
    
    this.cameras.main.fade(500, 0, 0, 0);
    
    this.time.delayedCall(500, () => {
      this.scene.start('ResultScene', { results, mode: this.mode });
    });
  }

  // Public methods for sub-component abilities
  revealHiddenObjects(): void {
    // Flash to reveal
    this.cameras.main.flash(200, 0, 255, 0);
  }

  createNoJumpZone(x: number, duration: number): void {
    const zone = this.add.graphics();
    zone.fillStyle(0xff0000, 0.3);
    zone.fillRect(x - 100, 0, 200, GAME_HEIGHT);
    
    this.time.delayedCall(duration, () => zone.destroy());
    
    // Disable jumping for enemies in zone
    // (Simplified implementation)
  }

  getNearestEnemy(fighter: Fighter): Fighter | null {
    let nearest: Fighter | null = null;
    let nearestDist = Infinity;
    
    this.allFighters.forEach(f => {
      if (f === fighter) return;
      const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, f.x, f.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = f;
      }
    });
    
    return nearest;
  }

  createFloorHole(x: number, duration: number): void {
    const hole = this.add.graphics();
    hole.fillStyle(0x000000, 1);
    hole.fillRect(x - 50, 500, 100, 100);
    
    this.time.delayedCall(duration, () => hole.destroy());
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
}
