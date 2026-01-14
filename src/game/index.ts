// Game initialization entry point
import Phaser from 'phaser';
import { gameConfig } from './config';

export function initGame(): Phaser.Game {
  return new Phaser.Game(gameConfig);
}

// Export for external use
export { gameConfig } from './config';
export { characters, getCharacterById } from './data/characters';
export { subComponents, getSubComponentById } from './data/subcomponents';
export { stages, getStageById } from './data/stages';
