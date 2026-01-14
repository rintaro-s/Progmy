// Character definitions based on jobs.json
export interface CharacterStats {
  hp: number;
  physical_atk: number;
  logic_atk: number;
  speed: number;
  build_time: number;
  robustness: number;
  memory_management: number;
}

export interface SpecialMove {
  name: { en: string; jp: string };
  effect: string;
  damage: number;
  cooldown: number;
  range: number;
  type: 'physical' | 'logic' | 'utility';
}

export interface Character {
  id: string;
  name: { en: string; jp: string };
  type: string;
  description: { en: string; jp: string };
  stats: CharacterStats;
  special_move: SpecialMove;
  color: string;
  accentColor: string;
  tier: 'low' | 'mid' | 'high' | 'ultra-low';
}

export const characters: Character[] = [
  {
    id: "c_lang",
    name: { en: "C", jp: "C言語" },
    type: "Low-level / Attacker",
    description: {
      en: "A powerful physical attacker that interacts directly with hardware.",
      jp: "ハードウェアを直接操作する物理アタッカー。高リスク・高リターン。"
    },
    stats: {
      hp: 80,
      physical_atk: 95,
      logic_atk: 20,
      speed: 60,
      build_time: 85,
      robustness: 30,
      memory_management: 20
    },
    special_move: {
      name: { en: "Kernel Panic", jp: "カーネルパニック" },
      effect: "Rewrites system coordinates, forcing enemies out of bounds.",
      damage: 150,
      cooldown: 12000,
      range: 300,
      type: 'physical'
    },
    color: '#5C6BC0',
    accentColor: '#3F51B5',
    tier: 'low'
  },
  {
    id: "assembly",
    name: { en: "Assembly", jp: "アセンブリ" },
    type: "Ultra Low-level / Glass Cannon",
    description: {
      en: "The foundation of all languages. Absolute power.",
      jp: "全ての言語の根源。絶対的な破壊力。"
    },
    stats: {
      hp: 40,
      physical_atk: 100,
      logic_atk: 10,
      speed: 90,
      build_time: 95,
      robustness: 10,
      memory_management: 10
    },
    special_move: {
      name: { en: "Direct Register Access", jp: "レジスタ直接アクセス" },
      effect: "Teleports to enemy and delivers fatal blow.",
      damage: 200,
      cooldown: 15000,
      range: 500,
      type: 'physical'
    },
    color: '#616161',
    accentColor: '#424242',
    tier: 'ultra-low'
  },
  {
    id: "cpp",
    name: { en: "C++", jp: "C++" },
    type: "Mid-level / Versatile Tank",
    description: {
      en: "Balanced physical power and complex logic.",
      jp: "物理と論理を兼ね備えるバランス型。"
    },
    stats: {
      hp: 85,
      physical_atk: 75,
      logic_atk: 60,
      speed: 50,
      build_time: 90,
      robustness: 40,
      memory_management: 40
    },
    special_move: {
      name: { en: "Multi-Inheritance Smash", jp: "多重継承スマッシュ" },
      effect: "Combines traits into massive strike.",
      damage: 120,
      cooldown: 10000,
      range: 200,
      type: 'physical'
    },
    color: '#00599C',
    accentColor: '#004482',
    tier: 'mid'
  },
  {
    id: "rust",
    name: { en: "Rust", jp: "Rust" },
    type: "Low-level / Defender",
    description: {
      en: "Iron-clad defense by Borrow Checker.",
      jp: "所有権による鉄壁の防御。バグに強い。"
    },
    stats: {
      hp: 75,
      physical_atk: 70,
      logic_atk: 50,
      speed: 65,
      build_time: 80,
      robustness: 100,
      memory_management: 100
    },
    special_move: {
      name: { en: "Borrow Checker Cage", jp: "借用チェッカーの檻" },
      effect: "Traps enemies in static memory area.",
      damage: 80,
      cooldown: 8000,
      range: 250,
      type: 'utility'
    },
    color: '#CE422B',
    accentColor: '#B7410E',
    tier: 'low'
  },
  {
    id: "python",
    name: { en: "Python", jp: "Python" },
    type: "High-level / Mage",
    description: {
      en: "Weak physical, but powerful logic spells.",
      jp: "身体能力は低いが、強力な魔法を使う。"
    },
    stats: {
      hp: 50,
      physical_atk: 20,
      logic_atk: 90,
      speed: 40,
      build_time: 15,
      robustness: 60,
      memory_management: 70
    },
    special_move: {
      name: { en: "Deep Learning Nova", jp: "ディープラーニング・ノヴァ" },
      effect: "AI predicts and counters enemy moves.",
      damage: 130,
      cooldown: 11000,
      range: 400,
      type: 'logic'
    },
    color: '#3776AB',
    accentColor: '#FFD43B',
    tier: 'high'
  },
  {
    id: "javascript",
    name: { en: "JavaScript", jp: "JavaScript" },
    type: "High-level / Trickster",
    description: {
      en: "Async attacks and event loops confuse opponents.",
      jp: "非同期攻撃で相手を翻弄するトリッキーな言語。"
    },
    stats: {
      hp: 55,
      physical_atk: 30,
      logic_atk: 75,
      speed: 85,
      build_time: 10,
      robustness: 20,
      memory_management: 60
    },
    special_move: {
      name: { en: "Callback Hell", jp: "コールバック地獄" },
      effect: "Forces enemy into infinite loop of delayed actions.",
      damage: 100,
      cooldown: 9000,
      range: 350,
      type: 'logic'
    },
    color: '#F7DF1E',
    accentColor: '#323330',
    tier: 'high'
  },
  {
    id: "java",
    name: { en: "Java", jp: "Java" },
    type: "High-level / Standardist",
    description: {
      en: "Enterprise standard. High HP and stability.",
      jp: "エンタープライズの標準。高耐久の万能型。"
    },
    stats: {
      hp: 90,
      physical_atk: 50,
      logic_atk: 60,
      speed: 45,
      build_time: 70,
      robustness: 80,
      memory_management: 85
    },
    special_move: {
      name: { en: "Garbage Collection Blast", jp: "ガベージコレクション・ブラスト" },
      effect: "Purges all objects, clearing projectiles.",
      damage: 110,
      cooldown: 10000,
      range: 450,
      type: 'logic'
    },
    color: '#ED8B00',
    accentColor: '#5382A1',
    tier: 'high'
  },
  {
    id: "go",
    name: { en: "Go", jp: "Go" },
    type: "Mid-level / Speedster",
    description: {
      en: "High concurrency with multiple Goroutines.",
      jp: "複数の分身で同時攻撃を仕掛ける。"
    },
    stats: {
      hp: 65,
      physical_atk: 60,
      logic_atk: 65,
      speed: 95,
      build_time: 20,
      robustness: 75,
      memory_management: 80
    },
    special_move: {
      name: { en: "Massive Concurrency", jp: "超並行・多重プッシュ" },
      effect: "Creates clones to push all enemies at once.",
      damage: 90,
      cooldown: 8000,
      range: 300,
      type: 'physical'
    },
    color: '#00ADD8',
    accentColor: '#00A29C',
    tier: 'mid'
  },
  {
    id: "haskell",
    name: { en: "Haskell", jp: "Haskell" },
    type: "High-level / Tactician",
    description: {
      en: "Pure functional logic. Hard but flawless.",
      jp: "純粋関数型の論理。完璧な立ち回りが可能。"
    },
    stats: {
      hp: 45,
      physical_atk: 10,
      logic_atk: 95,
      speed: 55,
      build_time: 60,
      robustness: 100,
      memory_management: 90
    },
    special_move: {
      name: { en: "Monad Singularity", jp: "モナドの特異点" },
      effect: "Alters world state, making enemy 'Nothing'.",
      damage: 180,
      cooldown: 14000,
      range: 500,
      type: 'logic'
    },
    color: '#5D4F85',
    accentColor: '#453A62',
    tier: 'high'
  },
  {
    id: "swift",
    name: { en: "Swift", jp: "Swift" },
    type: "High-level / Agile",
    description: {
      en: "Optimized for mobile. Fast and safe.",
      jp: "高速で洗練されたコンボが得意。"
    },
    stats: {
      hp: 60,
      physical_atk: 55,
      logic_atk: 70,
      speed: 80,
      build_time: 50,
      robustness: 85,
      memory_management: 75
    },
    special_move: {
      name: { en: "Optional Unwrapping", jp: "オプショナル・アンラップ" },
      effect: "Reveals enemy weak points and strikes.",
      damage: 100,
      cooldown: 7000,
      range: 200,
      type: 'physical'
    },
    color: '#FA7343',
    accentColor: '#F05138',
    tier: 'high'
  },
  {
    id: "ruby",
    name: { en: "Ruby", jp: "Ruby" },
    type: "High-level / Artist",
    description: {
      en: "Expressive language that alters rules.",
      jp: "美しくルールを書き換える。"
    },
    stats: {
      hp: 50,
      physical_atk: 35,
      logic_atk: 80,
      speed: 60,
      build_time: 15,
      robustness: 40,
      memory_management: 65
    },
    special_move: {
      name: { en: "Metaprogramming Magic", jp: "メタプログラミング・マジック" },
      effect: "Changes attack type to enemy's weakness.",
      damage: 95,
      cooldown: 8000,
      range: 300,
      type: 'logic'
    },
    color: '#CC342D',
    accentColor: '#A91401',
    tier: 'high'
  },
  {
    id: "kotlin",
    name: { en: "Kotlin", jp: "Kotlin" },
    type: "High-level / Tactical Balanced",
    description: {
      en: "Modern with strict null safety.",
      jp: "Null安全を持つモダンな言語。"
    },
    stats: {
      hp: 75,
      physical_atk: 50,
      logic_atk: 70,
      speed: 70,
      build_time: 45,
      robustness: 90,
      memory_management: 80
    },
    special_move: {
      name: { en: "Null Safety Shield", jp: "Null安全シールド" },
      effect: "Immune to Null attacks, gains invincibility.",
      damage: 70,
      cooldown: 6000,
      range: 150,
      type: 'utility'
    },
    color: '#A97BFF',
    accentColor: '#7F52FF',
    tier: 'high'
  },
  {
    id: "typescript",
    name: { en: "TypeScript", jp: "TypeScript" },
    type: "High-level / Defensive Trickster",
    description: {
      en: "Static typing for JavaScript. Predicts errors.",
      jp: "実行時エラーを予見して防ぐ。"
    },
    stats: {
      hp: 55,
      physical_atk: 30,
      logic_atk: 80,
      speed: 80,
      build_time: 25,
      robustness: 85,
      memory_management: 65
    },
    special_move: {
      name: { en: "Static Type Definition", jp: "静的型定義" },
      effect: "Forces enemy into Interface, restricting moves.",
      damage: 85,
      cooldown: 7000,
      range: 300,
      type: 'logic'
    },
    color: '#3178C6',
    accentColor: '#235A97',
    tier: 'high'
  },
  {
    id: "csharp",
    name: { en: "C#", jp: "C#" },
    type: "Mid-level / Power Tank",
    description: {
      en: "Uses LINQ to process multiple enemies.",
      jp: "複数の敵を同時処理するパワー型。"
    },
    stats: {
      hp: 85,
      physical_atk: 65,
      logic_atk: 70,
      speed: 50,
      build_time: 75,
      robustness: 80,
      memory_management: 75
    },
    special_move: {
      name: { en: "LINQ Query Blast", jp: "LINQクエリ・ブラスト" },
      effect: "Queries all enemies for simultaneous strike.",
      damage: 115,
      cooldown: 9000,
      range: 400,
      type: 'logic'
    },
    color: '#68217A',
    accentColor: '#512BD4',
    tier: 'mid'
  },
  {
    id: "lua",
    name: { en: "Lua", jp: "Lua" },
    type: "High-level / Scout",
    description: {
      en: "Lightweight and fast. Rapid movement.",
      jp: "極めて軽量で高速。"
    },
    stats: {
      hp: 40,
      physical_atk: 40,
      logic_atk: 60,
      speed: 100,
      build_time: 5,
      robustness: 50,
      memory_management: 70
    },
    special_move: {
      name: { en: "Table Injection", jp: "テーブル・インジェクション" },
      effect: "Injects random tables creating obstacles.",
      damage: 60,
      cooldown: 5000,
      range: 350,
      type: 'utility'
    },
    color: '#000080',
    accentColor: '#00007F',
    tier: 'high'
  },
  {
    id: "dart",
    name: { en: "Dart", jp: "Dart" },
    type: "High-level / UI Fighter",
    description: {
      en: "Smooth UI with Hot Reload recovery.",
      jp: "ホットリロードで即座に状況を立て直す。"
    },
    stats: {
      hp: 60,
      physical_atk: 45,
      logic_atk: 75,
      speed: 85,
      build_time: 20,
      robustness: 70,
      memory_management: 80
    },
    special_move: {
      name: { en: "Hot Reload", jp: "ホットリロード" },
      effect: "Resets cooldowns and restores health.",
      damage: 0,
      cooldown: 15000,
      range: 0,
      type: 'utility'
    },
    color: '#0175C2',
    accentColor: '#02569B',
    tier: 'high'
  }
];

export function getCharacterById(id: string): Character | undefined {
  return characters.find(c => c.id === id);
}
