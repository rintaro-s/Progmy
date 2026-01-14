// Sub-components (companions) for characters
export interface SubComponentAbility {
  passive: {
    name: string;
    description: string;
    effect: (fighter: any) => void;
  };
  active: {
    name: string;
    description: string;
    cooldown: number;
    execute: (fighter: any, scene: any) => void;
  };
}

export interface SubComponent {
  id: string;
  name: string;
  role: string;
  description: { en: string; jp: string };
  color: string;
  ability: SubComponentAbility;
}

export const subComponents: SubComponent[] = [
  {
    id: "bash",
    name: "bash",
    role: "Scout / Automator",
    description: {
      en: "A ninja that automates movement and chains attacks.",
      jp: "攻撃を自動で繋げる忍者的スカウト。"
    },
    color: '#4EAA25',
    ability: {
      passive: {
        name: "Pipe Chain",
        description: "Reduces delay between consecutive skill uses by 20%.",
        effect: (fighter) => {
          fighter.skillDelayMultiplier = 0.8;
        }
      },
      active: {
        name: "Grep Scan",
        description: "Temporary speed boost.",
        cooldown: 10000,
        execute: (fighter, scene) => {
          // Safe implementation - speed boost
          if (fighter.speedBoost) {
            fighter.speedBoost(1.3, 3000);
          }
        }
      }
    }
  },
  {
    id: "powershell",
    name: "PowerShell",
    role: "Heavy Utility / Enforcer",
    description: {
      en: "Manipulates objects and enforces strict rules.",
      jp: "強力な権限で戦場を支配する支援ユニット。"
    },
    color: '#012456',
    ability: {
      passive: {
        name: "Object Pipeline",
        description: "Increases logic attack damage by 15%.",
        effect: (fighter) => {
          fighter.logicAtkMultiplier = 1.15;
        }
      },
      active: {
        name: "Execution Policy",
        description: "Temporary invincibility.",
        cooldown: 15000,
        execute: (fighter, scene) => {
          // Safe implementation - invincibility
          if (fighter.activateInvincibility) {
            fighter.activateInvincibility(2000);
          }
        }
      }
    }
  },
  {
    id: "cmd",
    name: "cmd",
    role: "Legacy Support",
    description: {
      en: "Simple but reliable from old days.",
      jp: "古き良き時代のシンプルな相棒。"
    },
    color: '#C0C0C0',
    ability: {
      passive: {
        name: "Batch Execute",
        description: "10% speed boost after successful push.",
        effect: (fighter) => {
          fighter.onPush = () => {
            fighter.speedBoost(1.1, 3000);
          };
        }
      },
      active: {
        name: "Directory Map",
        description: "Resets position to last safe ground.",
        cooldown: 20000,
        execute: (fighter, scene) => {
          fighter.resetToLastSafePosition();
        }
      }
    }
  },
  {
    id: "sql",
    name: "SQL",
    role: "Data Manipulator",
    description: {
      en: "Manipulates stage elements.",
      jp: "地形そのものを操る魔術師。"
    },
    color: '#00758F',
    ability: {
      passive: {
        name: "Indexing",
        description: "Increases range of target-seeking attacks by 25%.",
        effect: (fighter) => {
          fighter.attackRangeMultiplier = 1.25;
        }
      },
      active: {
        name: "DROP TABLE",
        description: "Short burst of speed and jump power.",
        cooldown: 18000,
        execute: (fighter, scene) => {
          // Safe implementation - speed + jump boost
          if (fighter.speedBoost) {
            fighter.speedBoost(1.4, 2500);
            const originalJump = fighter.jumpForce;
            fighter.jumpForce *= 1.3;
            scene.time.delayedCall(2500, () => {
              fighter.jumpForce = originalJump;
            });
          }
        }
      }
    }
  },
  {
    id: "html",
    name: "HTML",
    role: "Architect",
    description: {
      en: "Focuses on structure and defense.",
      jp: "壁や足場を構築し有利なレイアウトを作る。"
    },
    color: '#E44D26',
    ability: {
      passive: {
        name: "Responsive Design",
        description: "Auto-adjusts defense based on opponent type.",
        effect: (fighter) => {
          fighter.adaptiveDefense = true;
        }
      },
      active: {
        name: "Div Barrier",
        description: "Places solid wall blocking projectiles for 3s.",
        cooldown: 12000,
        execute: (fighter, scene) => {
          scene.createBarrier(fighter.x + (fighter.facingRight ? 50 : -50), fighter.y, 3000);
        }
      }
    }
  },
  {
    id: "gui",
    name: "GUI",
    role: "Visual Assistant",
    description: {
      en: "Visual support and easier control.",
      jp: "難しい操作をマウスのように補助する。"
    },
    color: '#6699CC',
    ability: {
      passive: {
        name: "Auto-Focus",
        description: "Attacks have magnetic tracking (easier to hit).",
        effect: (fighter) => {
          fighter.autoAim = true;
        }
      },
      active: {
        name: "Window Mode",
        description: "Become semi-transparent, dodge one attack.",
        cooldown: 8000,
        execute: (fighter, scene) => {
          fighter.activateInvincibility(1500);
        }
      }
    }
  }
];

export function getSubComponentById(id: string): SubComponent | undefined {
  return subComponents.find(s => s.id === id);
}
