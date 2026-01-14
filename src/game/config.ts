// Progmy Game Configuration
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { BattleScene } from './scenes/BattleSceneNew';
import { ResultScene } from './scenes/ResultSceneNew';
import { SettingsScene } from './scenes/SettingsScene';
import { TutorialScene } from './scenes/TutorialScene';
import { InteractiveTutorialScene } from './scenes/InteractiveTutorialScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    CharacterSelectScene,
    SettingsScene,
    TutorialScene,
    InteractiveTutorialScene,
    BattleScene,
    ResultScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  }
};

// Control modes
export enum ControlMode {
  ARROWS = 'arrows',
  WASD = 'wasd',
  VIM = 'vim'
}

// Game settings stored in localStorage
export interface GameSettings {
  controlMode: ControlMode;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  playerName: string;
}

export const defaultSettings: GameSettings = {
  controlMode: ControlMode.ARROWS,
  soundEnabled: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  playerName: 'Player'
};

export function loadSettings(): GameSettings {
  const saved = localStorage.getItem('progmy_settings');
  if (saved) {
    return { ...defaultSettings, ...JSON.parse(saved) };
  }
  return defaultSettings;
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem('progmy_settings', JSON.stringify(settings));
}
