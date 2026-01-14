// Tutorial Scene - Character, Subcomponent, and Control tutorials
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ControlMode } from '../config';
import { characters } from '../data/characters';
import type { Character } from '../data/characters';
import { subComponents } from '../data/subcomponents';
import type { SubComponent } from '../data/subcomponents';

type TutorialType = 'basics' | 'character' | 'subcomponent' | 'controls';

interface TutorialSlide {
  title: string;
  content: string[];
  highlight?: string;
}

export class TutorialScene extends Phaser.Scene {
  private tutorialType: TutorialType = 'basics';
  private selectedCharacter?: Character;
  private selectedSub?: SubComponent;
  private currentSlide: number = 0;
  private slides: TutorialSlide[] = [];
  
  private titleText!: Phaser.GameObjects.Text;
  private contentTexts: Phaser.GameObjects.Text[] = [];
  private slideIndicator!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'TutorialScene' });
  }

  init(data: { type: TutorialType; character?: Character; subComponent?: SubComponent }): void {
    this.tutorialType = data.type || 'basics';
    this.selectedCharacter = data.character;
    this.selectedSub = data.subComponent;
    this.currentSlide = 0;
    
    this.generateSlides();
  }

  private generateSlides(): void {
    this.slides = [];
    
    switch (this.tutorialType) {
      case 'basics':
        this.generateBasicsSlides();
        break;
      case 'character':
        this.generateCharacterSlides();
        break;
      case 'subcomponent':
        this.generateSubcomponentSlides();
        break;
      case 'controls':
        this.generateControlsSlides();
        break;
    }
  }

  private generateBasicsSlides(): void {
    this.slides = [
      {
        title: '[ PROGMY - BASIC RULES ]',
        content: [
          'Progmy is a fighting game where programming languages battle.',
          '',
          'Goal: Knock opponents off the stage to KO them.',
          '',
          'Attacks increase the opponent\'s damage %,',
          'and higher damage means easier knockback.'
        ]
      },
      {
        title: '[ SCORE SYSTEM ]',
        content: [
          '* Push - Earned by KOing opponents',
          '  -> Main score. Grow your grass!',
          '',
          '* Stage - Earned by dealing damage',
          '  -> Intermediate points',
          '',
          '* Commit - Earned when someone you attacked falls',
          '  -> You don\'t have to KO them yourself!'
        ]
      },
      {
        title: '[ SPECIAL STATES ]',
        content: [
          '* Stack Overflow',
          '  Attack too much and you\'ll get stunned!',
          '  Vulnerability varies by language.',
          '',
          '* Bug Mode',
          '  Low chance to trigger when taking damage.',
          '  Controls may reverse, jumping may be disabled...',
          '  Robust languages are more bug-resistant.'
        ]
      },
      {
        title: '[ LANGUAGE TYPE MATCHUPS ]',
        content: [
          '* Static Typing (Java/Rust/Go)',
          '  -> Slow attacks but strong hitboxes',
          '',
          '* Dynamic Typing (Python/JS/Ruby)',
          '  -> Fast attacks but takes more damage',
          '',
          '* Low-Level (C/Assembly)',
          '  -> Physical attacks, pierces defense',
          '',
          '* High-Level (Haskell/Lisp)',
          '  -> Magic attacks, wide range'
        ]
      }
    ];
  }

  private generateCharacterSlides(): void {
    if (!this.selectedCharacter) {
      this.slides = [{
        title: '[ SELECT CHARACTER ]',
        content: ['Please select a character.']
      }];
      return;
    }

    const char = this.selectedCharacter;
    
    this.slides = [
      {
        title: `[ ${char.name.en} ]`,
        content: [
          `Type: ${char.type}`,
          '',
          `HP:  ${'*'.repeat(Math.ceil(char.stats.hp / 20))}${'-'.repeat(5 - Math.ceil(char.stats.hp / 20))}`,
          `ATK: ${'*'.repeat(Math.ceil(char.stats.attack / 20))}${'-'.repeat(5 - Math.ceil(char.stats.attack / 20))}`,
          `DEF: ${'*'.repeat(Math.ceil(char.stats.defense / 20))}${'-'.repeat(5 - Math.ceil(char.stats.defense / 20))}`,
          `SPD: ${'*'.repeat(Math.ceil(char.stats.speed / 20))}${'-'.repeat(5 - Math.ceil(char.stats.speed / 20))}`,
          '',
          char.description.en
        ],
        highlight: char.color
      },
      {
        title: `[ ${char.name.en} - SPECIAL MOVE ]`,
        content: [
          `Move: ${char.special_move.name.en}`,
          '',
          `Power: ${char.special_move.damage}`,
          `Range: ${char.special_move.range}`,
          `Cooldown: ${char.special_move.cooldown / 1000}s`,
          '',
          char.special_move.description.en
        ],
        highlight: char.accentColor
      },
      {
        title: `[ ${char.name.en} - STRENGTHS & WEAKNESSES ]`,
        content: [
          '* Strengths:',
          ...char.strengths.map(s => `  - ${s}`),
          '',
          '* Weaknesses:',
          ...char.weaknesses.map(w => `  - ${w}`)
        ]
      },
      {
        title: `[ ${char.name.en} - STRATEGY ]`,
        content: this.generateStrategyContent(char)
      }
    ];
  }

  private generateStrategyContent(char: Character): string[] {
    const strategies: string[] = [];
    
    if (char.type.includes('Attacker') || char.type.includes('Cannon')) {
      strategies.push('* Attacker Strategy:');
      strategies.push('  - Aggressively attack to rack up damage');
      strategies.push('  - Watch out for stack overflow');
      strategies.push('  - Land your special moves');
    } else if (char.type.includes('Defender') || char.type.includes('Tank')) {
      strategies.push('* Defender Strategy:');
      strategies.push('  - Wait for opponent attacks, then counter');
      strategies.push('  - Use your durability for long fights');
      strategies.push('  - Advantage in edge battles');
    } else if (char.type.includes('Mage') || char.type.includes('Tactician')) {
      strategies.push('* Mage/Tactician Strategy:');
      strategies.push('  - Keep distance, use magic attacks');
      strategies.push('  - Hit multiple enemies with specials');
      strategies.push('  - Avoid close combat');
    } else if (char.type.includes('Speedster') || char.type.includes('Agile')) {
      strategies.push('* Speedster Strategy:');
      strategies.push('  - Overwhelm with mobility');
      strategies.push('  - Hit and run');
      strategies.push('  - Chain combos for damage');
    } else if (char.type.includes('Trickster')) {
      strategies.push('* Trickster Strategy:');
      strategies.push('  - Confuse opponents with movement');
      strategies.push('  - Unpredictable attack patterns');
      strategies.push('  - Use the situation to your advantage');
    }
    
    return strategies;
  }

  private generateSubcomponentSlides(): void {
    if (!this.selectedSub) {
      this.slides = subComponents.map(sub => ({
        title: `[ ${sub.name} ]`,
        content: [
          `Role: ${sub.role}`,
          '',
          sub.description.en,
          '',
          '* Passive Effect:',
          sub.ability.passive.description,
          '',
          '* Active Ability:',
          `  ${sub.ability.active.name}`,
          `  ${sub.ability.active.description}`,
          `  Cooldown: ${sub.ability.active.cooldown / 1000}s`
        ]
      }));
      return;
    }

    const sub = this.selectedSub;
    this.slides = [
      {
        title: `[ ${sub.name} - BASICS ]`,
        content: [
          `Role: ${sub.role}`,
          '',
          sub.description.en,
          '',
          'Use subcomponent abilities in battle',
          'by pressing the C key.'
        ]
      },
      {
        title: `[ ${sub.name} - PASSIVE ]`,
        content: [
          '* Always Active Effect:',
          '',
          sub.ability.passive.description,
          '',
          'This effect is applied automatically.'
        ]
      },
      {
        title: `[ ${sub.name} - ACTIVE ]`,
        content: [
          `* ${sub.ability.active.name}`,
          '',
          sub.ability.active.description,
          '',
          `Cooldown: ${sub.ability.active.cooldown / 1000}s`,
          '',
          'Activation Key: C'
        ]
      }
    ];
  }

  private generateControlsSlides(): void {
    this.slides = [
      {
        title: '[ CONTROL MODE SELECT ]',
        content: [
          'Choose from 3 control modes:',
          '',
          '* Arrow Key Mode (For beginners)',
          '* WASD Mode (For FPS gamers)',
          '* VIM Mode (For advanced users)',
          '',
          'VIM mode has input frame reduction bonus!'
        ]
      },
      {
        title: '[ ARROW KEY MODE ]',
        content: [
          'Move: < >',
          'Jump: ^',
          'Drop: v',
          '',
          'Attack: Z / Space',
          'Special: X / Shift',
          'Sub Ability: C',
          '',
          'Pause: ESC / P'
        ]
      },
      {
        title: '[ WASD MODE ]',
        content: [
          'Move: A D',
          'Jump: W',
          'Drop: S',
          '',
          'Attack: Z / Space',
          'Special: X / Shift',
          'Sub Ability: C',
          '',
          'Pause: ESC / P'
        ]
      },
      {
        title: '[ VIM MODE ]',
        content: [
          'Move: H L',
          'Jump: K',
          'Drop: J',
          '',
          'Attack: Z / Space',
          'Special: X / Shift',
          'Sub Ability: C',
          '',
          'Bonus: Input frame -2F',
          '',
          'Pause: ESC / P'
        ]
      },
      {
        title: '[ ACTION DETAILS ]',
        content: [
          '* Normal Attack (Z/Space)',
          '  Basic close-range attack',
          '',
          '* Special Move (X/Shift)',
          '  Powerful but has cooldown',
          '  Different for each character',
          '',
          '* Sub Ability (C)',
          '  Activates subcomponent ability',
          '',
          '* Double Jump',
          '  Jump again while in the air'
        ]
      }
    ];
  }

  create(): void {
    this.cameras.main.fadeIn(300);
    
    // Background
    this.createBackground();
    
    // Title
    this.titleText = this.add.text(GAME_WIDTH / 2, 60, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    // Content container
    for (let i = 0; i < 10; i++) {
      const text = this.add.text(100, 140 + i * 40, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: '#ffffff'
      });
      this.contentTexts.push(text);
    }
    
    // Navigation
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 
      '< > : Page    ENTER : Back', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#666666'
    }).setOrigin(0.5);
    
    // Slide indicator
    this.slideIndicator = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
    
    // Input
    this.input.keyboard?.on('keydown-LEFT', () => this.prevSlide());
    this.input.keyboard?.on('keydown-RIGHT', () => this.nextSlide());
    this.input.keyboard?.on('keydown-ENTER', () => this.exit());
    this.input.keyboard?.on('keydown-ESC', () => this.exit());
    
    // Display first slide
    this.updateDisplay();
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
    graphics.strokeRect(30, 30, GAME_WIDTH - 60, GAME_HEIGHT - 60);
  }

  private updateDisplay(): void {
    const slide = this.slides[this.currentSlide];
    if (!slide) return;
    
    this.titleText.setText(slide.title);
    if (slide.highlight) {
      this.titleText.setStyle({ color: slide.highlight });
    } else {
      this.titleText.setStyle({ color: '#00ff00' });
    }
    
    // Clear old content
    this.contentTexts.forEach(t => t.setText(''));
    
    // Set new content
    slide.content.forEach((line, index) => {
      if (index < this.contentTexts.length) {
        this.contentTexts[index].setText(line);
      }
    });
    
    // Update indicator
    this.slideIndicator.setText(
      `${this.currentSlide + 1} / ${this.slides.length}  ` +
      `${'*'.repeat(this.currentSlide + 1)}${'-'.repeat(this.slides.length - this.currentSlide - 1)}`
    );
  }

  private nextSlide(): void {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.updateDisplay();
    }
  }

  private prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.updateDisplay();
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
