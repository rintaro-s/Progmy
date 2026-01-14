// Stage/Map definitions
export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'passthrough';
}

export interface Stage {
  id: string;
  name: { en: string; jp: string };
  description: { en: string; jp: string };
  platforms: Platform[];
  spawnPoints: { x: number; y: number }[];
  deathBoundary: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  backgroundColor: string;
  theme: string;
}

export const stages: Stage[] = [
  {
    id: "terminal",
    name: { en: "Terminal", jp: "ターミナル" },
    description: {
      en: "The classic command line battlefield.",
      jp: "クラシックなコマンドライン戦場。"
    },
    platforms: [
      // Main platform
      { x: 640, y: 550, width: 800, height: 40, type: 'solid' },
      // Left floating platform
      { x: 300, y: 400, width: 200, height: 20, type: 'passthrough' },
      // Right floating platform
      { x: 980, y: 400, width: 200, height: 20, type: 'passthrough' },
      // Top center platform
      { x: 640, y: 280, width: 250, height: 20, type: 'passthrough' },
    ],
    spawnPoints: [
      { x: 400, y: 450 },
      { x: 880, y: 450 },
      { x: 300, y: 300 },
      { x: 980, y: 300 }
    ],
    deathBoundary: {
      top: -200,
      bottom: 800,
      left: -100,
      right: 1380
    },
    backgroundColor: '#0a0a0a',
    theme: 'terminal'
  },
  {
    id: "github_sea",
    name: { en: "GitHub Sea", jp: "GitHubの海" },
    description: {
      en: "Battle above the endless repository waters.",
      jp: "無限のリポジトリの海の上で戦え。"
    },
    platforms: [
      // Main left island
      { x: 350, y: 500, width: 350, height: 50, type: 'solid' },
      // Main right island
      { x: 930, y: 500, width: 350, height: 50, type: 'solid' },
      // Small floating platforms
      { x: 640, y: 380, width: 180, height: 20, type: 'passthrough' },
      { x: 200, y: 320, width: 150, height: 20, type: 'passthrough' },
      { x: 1080, y: 320, width: 150, height: 20, type: 'passthrough' },
      // Top platform
      { x: 640, y: 200, width: 200, height: 20, type: 'passthrough' },
    ],
    spawnPoints: [
      { x: 350, y: 400 },
      { x: 930, y: 400 },
      { x: 200, y: 220 },
      { x: 1080, y: 220 }
    ],
    deathBoundary: {
      top: -250,
      bottom: 750,
      left: -150,
      right: 1430
    },
    backgroundColor: '#0d1117',
    theme: 'github'
  },
  {
    id: "stack_overflow",
    name: { en: "Stack Overflow", jp: "Stack Overflow" },
    description: {
      en: "Vertical stage with infinite knowledge.",
      jp: "無限の知識が積み重なる縦長ステージ。"
    },
    platforms: [
      // Bottom main
      { x: 640, y: 600, width: 600, height: 40, type: 'solid' },
      // Stair-like platforms
      { x: 350, y: 480, width: 200, height: 20, type: 'passthrough' },
      { x: 930, y: 480, width: 200, height: 20, type: 'passthrough' },
      { x: 500, y: 360, width: 180, height: 20, type: 'passthrough' },
      { x: 780, y: 360, width: 180, height: 20, type: 'passthrough' },
      { x: 640, y: 240, width: 220, height: 20, type: 'passthrough' },
      { x: 300, y: 180, width: 150, height: 20, type: 'passthrough' },
      { x: 980, y: 180, width: 150, height: 20, type: 'passthrough' },
    ],
    spawnPoints: [
      { x: 440, y: 500 },
      { x: 840, y: 500 },
      { x: 350, y: 380 },
      { x: 930, y: 380 }
    ],
    deathBoundary: {
      top: -300,
      bottom: 800,
      left: -100,
      right: 1380
    },
    backgroundColor: '#1a1a1a',
    theme: 'stackoverflow'
  },
  {
    id: "ide",
    name: { en: "IDE Arena", jp: "IDEアリーナ" },
    description: {
      en: "Battle in the integrated development environment.",
      jp: "統合開発環境の中で戦え。"
    },
    platforms: [
      // Main platform (code area)
      { x: 640, y: 520, width: 900, height: 40, type: 'solid' },
      // Tab bar platforms
      { x: 250, y: 350, width: 160, height: 20, type: 'passthrough' },
      { x: 450, y: 350, width: 160, height: 20, type: 'passthrough' },
      { x: 830, y: 350, width: 160, height: 20, type: 'passthrough' },
      { x: 1030, y: 350, width: 160, height: 20, type: 'passthrough' },
      // Top bar
      { x: 640, y: 200, width: 400, height: 20, type: 'passthrough' },
    ],
    spawnPoints: [
      { x: 350, y: 420 },
      { x: 930, y: 420 },
      { x: 250, y: 250 },
      { x: 1030, y: 250 }
    ],
    deathBoundary: {
      top: -200,
      bottom: 800,
      left: -100,
      right: 1380
    },
    backgroundColor: '#1e1e1e',
    theme: 'ide'
  }
];

export function getStageById(id: string): Stage | undefined {
  return stages.find(s => s.id === id);
}
