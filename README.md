# Progmy - Programming Language Battle Arena

A chaotic PvE battle game where programming languages become stick figure fighters

![Progmy](https://img.shields.io/badge/Phaser.js-3.x-blue) ![Astro](https://img.shields.io/badge/Astro-5.x-orange) ![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Progmy is a fighting game where programming languages are personified as characters. Each language has unique abilities based on their real-world characteristics. Knock opponents off the stage to score points!

### Features

- 16 programming language characters
- 6 subcomponent companions
- 4 battle stages
- 3 control modes (Arrow keys, WASD, VIM)
- AI battles with 4 difficulty levels

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Dev server runs at `http://localhost:4321/`

## Controls

| Action | Arrow Mode | WASD Mode | VIM Mode |
|--------|------------|-----------|----------|
| Move | Left/Right | A/D | H/L |
| Jump | Up | W | K |
| Attack | Z / Space | Z / Space | Z / Space |
| Special | X / Shift | X / Shift | X / Shift |
| Sub Ability | C | C | C |
| Pause | ESC / P | ESC / P | ESC / P |

VIM mode has a -2 frame input bonus.

## Characters

| Character | Type | Description |
|-----------|------|-------------|
| C | Low-level Attacker | Physical attacker with direct hardware access. High risk, high reward. |
| Assembly | Ultra Low-level Cannon | The foundation of all languages. Absolute power. |
| C++ | Mid-level Tank | Balanced physical power and complex logic. |
| Rust | Mid-level Defender | Memory-safe with extreme durability. |
| Python | High-level Speedster | Fast attacks with readable style. |
| JavaScript | High-level Trickster | Unpredictable with async abilities. |
| Java | Mid-level Tank | Cross-platform stability and solid defense. |
| Go | Mid-level Speedster | Concurrent attacks with goroutine speed. |
| Haskell | High-level Mage | Pure functional magic attacks. |
| Swift | High-level Agile | Apple ecosystem fighter with smooth moves. |
| Ruby | High-level Speedster | Elegant attacks with metaprogramming. |
| Kotlin | Mid-level Versatile | Modern Java with null safety. |
| TypeScript | High-level Tactician | Type-safe JavaScript evolution. |
| C# | Mid-level Balanced | .NET powered versatile fighter. |
| Lua | High-level Scout | Lightweight embedded language. |
| Dart | High-level Agile | Flutter-powered UI specialist. |

## Subcomponents

Subcomponents are companions that provide passive and active abilities to enhance your fighter.

| Name | Role | Passive Effect | Active Ability |
|------|------|----------------|----------------|
| bash | Scout / Automator | Pipe Chain: Reduces skill cooldown by 20% | Grep Scan: Speed boost x1.3 for 3 seconds |
| PowerShell | Heavy Utility | Object Pipeline: Increases logic attack by 15% | Execution Policy: Invincibility for 2 seconds |
| cmd | Legacy Support | Batch Execute: 10% speed boost after successful KO | Directory Map: Reset position to last safe ground |
| SQL | Data Manipulator | Indexing: Increases attack range by 25% | DROP TABLE: Speed & jump boost for 2.5 seconds |
| HTML | Architect | Responsive Design: Adaptive defense based on opponent | Div Barrier: Creates solid wall for 3 seconds |
| GUI | Visual Assistant | Auto-Focus: Magnetic tracking for easier hits | Window Mode: Semi-transparent dodge for 1.5s |

### How Subcomponents Work

- **Passive Effects**: Always active once selected
- **Active Abilities**: Activated by pressing the C key
- Each active ability has a cooldown period
- Choose subcomponents that complement your character's playstyle

## Game Modes

- **PvE Battle**: Battle against multiple CPUs
- **VS CPU**: 1v1 against AI opponent
- **Training**: Practice mode with weak CPU

## Score System

- **Push**: Earned by KOing opponents (main score)
- **Stage**: Earned by dealing damage
- **Commit**: Earned when someone you attacked falls

## Tech Stack

- Framework: Astro 5.x
- Game Engine: Phaser.js 3.x
- Language: TypeScript
- Deploy: GitHub Pages

## Project Structure

```
/
├── src/
│   ├── game/
│   │   ├── config.ts          # Game settings
│   │   ├── data/              # Character/stage data
│   │   ├── entities/          # Fighter, AI, Renderer
│   │   └── scenes/            # Game scenes
│   └── pages/
│       └── index.astro
└── package.json
```

## Roadmap

- [ ] LAN multiplayer
- [ ] Online battles
- [ ] Additional characters
- [ ] Sound effects

## License

MIT License

---

## Japanese / Nihongo

プログラミング言語を棒人間化した大乱闘PvP/PvEゲームです。

各言語の特徴を活かした独自の能力で戦い、相手を場外に吹き飛ばしてポイントを獲得しましょう。

### キャラクター一覧

- C言語: ハードウェアを直接操作する物理アタッカー
- アセンブリ: 全ての言語の根源、絶対的な破壊力
- C++: 物理と論理を兼ね備えるバランス型
- Rust: メモリ安全で極めて堅牢
- Python: 速攻型の読みやすいスタイル
- JavaScript: 非同期能力で予測不能
- Java: クロスプラットフォームの安定性
- Go: ゴルーチンの並行攻撃
- Haskell: 純粋関数型の魔法攻撃
- Swift: Apple生態系の滑らかな動き
- Ruby: メタプログラミングのエレガントな攻撃
- Kotlin: null安全なモダンJava
- TypeScript: 型安全なJavaScript進化形
- C#: .NET駆動の万能ファイター
- Lua: 軽量な組み込み言語
- Dart: Flutter駆動のUI特化

### 操作方法

矢印キー、WASD、VIMの3つのモードから選択可能。VIMモードは入力フレーム短縮ボーナス付き。

### サブコンポーネント詳細

サブコンポーネントは戦闘を補助するパッシブ効果とアクティブ能力を提供します。

- **bash**: パッシブ - Pipe Chain（スキルクールダウン20%短縮）/ アクティブ - Grep Scan（速度1.3倍、3秒）
- **PowerShell**: パッシブ - Object Pipeline（論理攻撃15%増加）/ アクティブ - Execution Policy（無敵、2秒）
- **cmd**: パッシブ - Batch Execute（KO成功後10%速度上昇）/ アクティブ - Directory Map（最後の安全な位置にリセット）
- **SQL**: パッシブ - Indexing（攻撃範囲25%拡大）/ アクティブ - DROP TABLE（速度ジャンプ力アップ、2.5秒）
- **HTML**: パッシブ - Responsive Design（相手タイプに応じた防御調整）/ アクティブ - Div Barrier（3秒間壁を設置）
- **GUI**: パッシブ - Auto-Focus（自動追跡で命中率向上）/ アクティブ - Window Mode（半透明ドッジ、1.5秒）

アクティブ能力はCキーで発動します。各能力にはクールダウンがあります。
