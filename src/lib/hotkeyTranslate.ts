/**
 * 风灵月影修改器常见修改项中英对照字典与智能搜索过滤模块
 */

// 1. 中英文关键词同义词映射表（支持玩家输入中文关键词过滤英文热键）
export const HOTKEY_SYNONYM_MAP: Record<string, string[]> = {
  // 生命与无敌
  生命: ["health", "hp", "god mode", "invulnerable", "immune", "ignore damage", "infinite health"],
  血: ["health", "hp", "god mode", "infinite health"],
  锁血: ["health", "god mode", "invulnerable", "immune"],
  无敌: ["god mode", "invulnerable", "immune", "ignore damage", "unbeatable"],
  无伤: ["god mode", "invulnerable", "immune", "ignore damage"],

  // 体力与能量
  体力: ["stamina", "energy", "endurance", "infinite stamina"],
  耐力: ["stamina", "energy", "endurance"],
  精力: ["stamina", "energy", "focus"],
  能量: ["energy", "power", "sp"],
  魔法: ["mana", "mp", "magic", "sp", "infinite mana"],
  法力: ["mana", "mp", "magic", "sp"],
  蓝: ["mana", "mp", "magic"],

  // 金钱与资源
  金钱: ["money", "gold", "currency", "coin", "credit", "cash", "resource", "fund"],
  钱: ["money", "gold", "currency", "coin", "credit", "cash"],
  金币: ["gold", "coin", "money"],
  资源: ["resource", "materials", "item", "inventory"],
  材料: ["material", "materials", "crafting", "item"],
  编辑: ["edit", "set", "custom"],

  // 战斗与伤害
  秒杀: ["one hit kill", "easy kill", "super damage", "instant kill"],
  一击必杀: ["one hit kill", "easy kill", "super damage"],
  必杀: ["one hit kill", "easy kill", "instant kill"],
  伤害: ["damage", "attack", "multiplier", "super damage"],
  攻击: ["attack", "damage", "multiplier"],
  倍率: ["multiplier", "rate"],
  防御: ["defense", "armor", "shield"],
  护甲: ["armor", "defense"],
  护盾: ["shield", "barrier"],
  暴击: ["critical", "crit", "max critical"],

  // 枪械与弹药
  弹药: ["ammo", "ammunition", "reload", "bullet", "arrow"],
  子弹: ["ammo", "bullet"],
  箭: ["arrow", "arrows", "ammo"],
  装弹: ["reload", "no reload"],
  无需装弹: ["no reload", "infinite ammo"],
  后坐力: ["recoil", "no recoil"],
  无后坐力: ["no recoil", "zero recoil"],
  精准: ["accuracy", "super accuracy"],
  射速: ["fire rate", "rapid fire"],
  耐久: ["durability", "unbreakable", "infinite durability"],
  不坏: ["unbreakable", "durability"],

  // 等级与属性
  经验: ["exp", "experience", "level", "infinite exp"],
  等级: ["level", "max level", "exp"],
  升级: ["level", "exp", "level up"],
  技能点: ["skill point", "talent", "perk", "attribute point"],
  属性点: ["attribute", "stat", "ability point"],
  技能: ["skill", "ability", "talent", "perk"],

  // 速度与跳跃
  速度: ["speed", "fast", "movement", "game speed"],
  移速: ["speed", "movement speed"],
  加速: ["speed", "fast", "turbo"],
  跑: ["speed", "sprint", "run"],
  跳跃: ["jump", "super jump", "infinite jump"],
  超级跳: ["super jump", "infinite jump"],

  // 技能机制与时间
  冷却: ["cooldown", "instant skill", "no cooldown", "instant cooldown"],
  无cd: ["cooldown", "instant cooldown", "no cooldown"],
  隐身: ["ghost", "invisible", "stealth", "undetected", "invisibility"],
  幽灵: ["ghost", "stealth"],
  潜行: ["stealth", "detection", "invisible"],
  负重: ["weight", "carry", "inventory", "capacity", "zero weight"],
  重量: ["weight", "carry"],
  时间: ["time", "freeze time", "timer", "stop time"],
  定格: ["freeze", "stop time", "freeze timer"],

  // 制作与掉落
  制作: ["craft", "crafting", "free craft", "easy craft"],
  免费制作: ["free craft", "free crafting", "ignore crafting"],
  建造: ["build", "construction", "free build"],
  掉落: ["drop", "loot", "drop rate", "max drop"],
  爆率: ["drop rate", "luck", "max drop"],
  无限: ["infinite", "unlimited", "max"],
  最大: ["max", "maximum"],
};

// 2. 常见修改项标准汉化模式匹配
const TRANSLATION_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  // 生命无敌
  { regex: /battle:?\s*god\s*mode/i, label: "战场无敌模式" },
  { regex: /god\s*mode/i, label: "无敌模式" },
  { regex: /infinite\s*health/i, label: "无限生命" },
  { regex: /immune/i, label: "免疫伤害" },

  // 体力能量
  { regex: /infinite\s*stamina/i, label: "无限体力/耐力" },
  { regex: /infinite\s*mana/i, label: "无限法力/魔法" },
  { regex: /infinite\s*energy/i, label: "无限精力" },
  { regex: /infinite\s*focus/i, label: "无限专注力" },

  // 战斗杀敌
  { regex: /super\s*damage[\s/]*one\s*hit\s*kill/i, label: "超级伤害 / 一击必杀" },
  { regex: /one\s*hit\s*kill/i, label: "一击必杀" },
  { regex: /super\s*damage/i, label: "超级伤害" },
  { regex: /damage\s*multiplier/i, label: "伤害倍率" },
  { regex: /defense\s*multiplier/i, label: "防御倍率" },
  { regex: /max\s*critical\s*rate/i, label: "百分百暴击率" },

  // 金钱资源
  { regex: /infinite\s*money/i, label: "无限金钱" },
  { regex: /infinite\s*gold/i, label: "无限金币" },
  { regex: /infinite\s*coins?/i, label: "无限硬币" },
  { regex: /infinite\s*resources?/i, label: "无限资源" },
  { regex: /infinite\s*items?/i, label: "无限物品" },
  { regex: /edit\s*money/i, label: "编辑金钱" },
  { regex: /edit\s*gold/i, label: "编辑金币" },
  { regex: /edit\s*item\s*amount/i, label: "编辑物品数量" },

  // 弹药射击
  { regex: /infinite\s*ammo/i, label: "无限弹药" },
  { regex: /infinite\s*arrows?/i, label: "无限箭矢" },
  { regex: /no\s*reload/i, label: "无需装弹" },
  { regex: /super\s*accuracy/i, label: "超级精准度" },
  { regex: /no\s*recoil/i, label: "无后坐力" },
  { regex: /rapid\s*fire/i, label: "超快射速" },
  { regex: /infinite\s*durability/i, label: "无限耐久度" },

  // 等级技能
  { regex: /infinite\s*exp/i, label: "无限经验" },
  { regex: /exp\s*multiplier/i, label: "经验倍率" },
  { regex: /max\s*level/i, label: "满级" },
  { regex: /infinite\s*skill\s*points?/i, label: "无限技能点" },
  { regex: /infinite\s*attribute\s*points?/i, label: "无限属性点" },
  { regex: /instant\s*cooldown/i, label: "技能无冷却" },
  { regex: /no\s*cooldown/i, label: "技能无冷却" },

  // 移动隐身
  { regex: /super\s*speed/i, label: "超级速度" },
  { regex: /super\s*jump/i, label: "超级跳跃" },
  { regex: /stealth\s*mode|invisibility|ghost\s*mode/i, label: "潜行隐身" },
  { regex: /freeze\s*time/i, label: "锁定时间" },
  { regex: /freeze\s*daytime/i, label: "锁定白天" },
  { regex: /set\s*game\s*speed/i, label: "调节游戏速度" },
  { regex: /zero\s*weight|infinite\s*weight/i, label: "负重清零 / 无限负重" },
  { regex: /free\s*crafting/i, label: "免费制作" },
  { regex: /ignore\s*crafting/i, label: "无视制作需求" },
  { regex: /max\s*drop\s*rate/i, label: "最高掉落率" },
];

/**
 * 根据英文功能标题提取或匹配中文译名标签
 * 例如: "Num 1 - Infinite Health" -> "无限生命"
 */
export function translateHotkeyTitle(title: string | undefined | null): string | null {
  if (!title || typeof title !== "string") return null;
  for (const item of TRANSLATION_PATTERNS) {
    if (item.regex.test(title)) {
      return item.label;
    }
  }
  return null;
}

/**
 * 智能过滤：支持纯英文、纯中文同义词、数字键位混合匹配
 */
export function matchHotkey(
  title: string | undefined | null,
  note: string | undefined | null,
  query: string
): boolean {
  if (!title || typeof title !== "string") return false;
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;

  const titleLower = title.toLowerCase();
  const noteLower = (note && typeof note === "string") ? note.toLowerCase() : "";

  // 1. 直接英文或键位命中 (例如 "health", "num 1", "ctrl", "damage")
  if (titleLower.includes(q) || noteLower.includes(q)) {
    return true;
  }

  // 2. 检查由正则翻译出的中文标签是否命中 (例如用户搜 "无敌", 标签是 "无敌模式")
  const cnLabel = translateHotkeyTitle(title);
  if (cnLabel && cnLabel.toLowerCase().includes(q)) {
    return true;
  }

  // 3. 检查同义词字典 (例如用户输入 "生命", 映射到 "health" 并命中 "Infinite Health")
  for (const [cnKey, enTerms] of Object.entries(HOTKEY_SYNONYM_MAP)) {
    if (cnKey.includes(q) || q.includes(cnKey)) {
      for (const en of enTerms) {
        if (titleLower.includes(en) || noteLower.includes(en)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * 将热键条目列表格式化为整齐的带中文标注的备忘文本
 */
export function formatAllHotkeys(
  items: Array<{ title: string; note?: string | null }>
): string {
  return items
    .map((item, idx) => {
      const cn = translateHotkeyTitle(item.title);
      const cnTag = cn ? ` [${cn}]` : "";
      const noteLine = item.note ? `\n   说明: ${item.note}` : "";
      return `${idx + 1}. ${item.title}${cnTag}${noteLine}`;
    })
    .join("\n");
}

/**
 * 从可能包含描述的标题中提取出纯热键部分
 * 例如: "Num 1 - Infinite Health" -> "Num 1"
 */
export function extractHotkey(title: string | undefined | null): string {
  if (!title || typeof title !== "string") return "";
  const t = title.trim();
  if (t.includes(" – ")) {
    return t.split(" – ")[0].trim();
  }
  if (t.includes(" - ")) {
    return t.split(" - ")[0].trim();
  }
  if (t.includes(":")) {
    return t.split(":")[0].trim();
  }
  return t;
}

/**
 * 判断某个修改项是否属于二元开关类功能（Toggle）
 * 数值、倍率、编辑输入类通常不是单纯开关
 */
export function isToggleableOption(
  title: string | undefined | null,
  note?: string | undefined | null
): boolean {
  if (!title || typeof title !== "string") return false;
  const full = `${title} ${note || ""}`.toLowerCase();

  // 典型数值或多档位关键词
  const nonToggleKeywords = [
    "multiplier",
    "倍率",
    "edit ",
    "set ",
    "custom",
    "increase",
    "decrease",
    "speed",
    "teleport",
    "level",
    "exp multiplier",
    "damage multiplier",
  ];

  for (const kw of nonToggleKeywords) {
    if (full.includes(kw)) {
      return false;
    }
  }

  return true;
}
