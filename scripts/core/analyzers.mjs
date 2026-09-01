const INVENTORY_TYPES = new Set([
  "equipment",
  "weapon",
  "loot",
  "consumable",
  "container",
  "valuable"
]);

function list(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value.values === "function") return [...value.values()];
  if (value && typeof value[Symbol.iterator] === "function") return [...value];
  return [];
}

export function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function itemSystem(item) {
  return item?.system ?? item?.data?.system ?? {};
}

export function classifyItems(items = []) {
  const counts = {
    classes: 0,
    feats: 0,
    spells: 0,
    buffs: 0,
    activeBuffs: 0,
    inventory: 0
  };

  for (const item of list(items)) {
    const type = String(item?.type ?? "");
    const system = itemSystem(item);

    if (type === "class") counts.classes += 1;
    if (type === "feat") counts.feats += 1;
    if (type === "spell") counts.spells += 1;
    if (type === "buff") {
      counts.buffs += 1;
      if (item?.active === true || system.active === true) counts.activeBuffs += 1;
    }
    if (INVENTORY_TYPES.has(type)) counts.inventory += 1;
  }

  return counts;
}

export function estimateCarriedLoad(items = [], currency = {}, coinsPerWeightUnit = 50, includeCoins = true) {
  let itemWeight = 0;

  for (const item of list(items)) {
    const system = itemSystem(item);
    if (!INVENTORY_TYPES.has(String(item?.type ?? ""))) continue;
    if (system.carried === false) continue;
    if (system.equipped === true && system.equippedWeightless === true) continue;

    const weight = Math.max(0, finiteNumber(system.weight));
    const quantity = system.constantWeight === true
      ? 1
      : Math.max(0, finiteNumber(system.quantity, 1));

    itemWeight += weight * quantity;
  }

  const coins = Object.values(currency ?? {}).reduce(
    (total, value) => total + Math.max(0, finiteNumber(value)),
    0
  );

  const divisor = Math.max(1, finiteNumber(coinsPerWeightUnit, 50));
  const coinWeight = includeCoins ? coins / divisor : 0;

  return {
    itemWeight,
    coins,
    coinWeight,
    total: itemWeight + coinWeight
  };
}

export function findSlotIssues(items = []) {
  const slotless = new Set(["none", "slotless", "no-slot", "sem-slot"]);

  return list(items)
    .filter((item) => {
      if (item?.type !== "equipment") return false;
      const system = itemSystem(item);
      if (system.equipped !== true) return false;
      const slot = String(system.slot ?? "").trim().toLowerCase();
      const subtype = String(system.equipmentSubtype ?? "").trim().toLowerCase();
      return !slot && !slotless.has(subtype);
    })
    .map((item) => ({
      id: item.id ?? item._id ?? "",
      name: item.name ?? "?"
    }));
}

export function collectSkillRankIssues(skills = {}, level = 0) {
  const issues = [];
  const maxPoints = Math.max(0, Math.floor(finiteNumber(level))) + 3;

  const inspect = (skill, key, parent = "") => {
    if (!skill || typeof skill !== "object") return;
    const rawPoints = skill.points;

    if (rawPoints !== undefined && rawPoints !== null && rawPoints !== "") {
      const points = finiteNumber(rawPoints);
      if (points > maxPoints) {
        issues.push({
          key,
          name: skill.name || (parent ? `${parent}: ${key}` : key),
          points,
          maxPoints
        });
      }
    }

    for (const [subKey, subSkill] of Object.entries(skill.subSkills ?? {})) {
      inspect(subSkill, subKey, skill.name || key);
    }
  };

  for (const [key, skill] of Object.entries(skills ?? {})) inspect(skill, key);
  return issues;
}

export function spellbookDcSummaries(actorSystem = {}) {
  const spellbooks = actorSystem?.attributes?.spells?.spellbooks ?? {};
  const abilities = actorSystem?.abilities ?? {};

  return Object.entries(spellbooks)
    .map(([id, spellbook]) => {
      const ability = String(spellbook?.ability ?? "");
      const modifier = finiteNumber(abilities?.[ability]?.mod);
      const label = spellbook?.name || spellbook?.class || id;
      return {
        id,
        label,
        ability,
        modifier,
        base: 10 + modifier,
        formula: String(spellbook?.baseDCFormula ?? "").trim()
      };
    })
    .filter((entry) => entry.ability || entry.formula);
}

export function activeBuffItems(items = []) {
  return list(items).filter((item) => {
    if (item?.type !== "buff") return false;
    const system = itemSystem(item);
    return item?.active === true || system.active === true;
  });
}

function diceFromRoll(roll) {
  if (Array.isArray(roll?.dice)) return roll.dice;
  return list(roll?.terms).filter((term) => Number(term?.faces) > 0);
}

export function analyzeD20Rolls(rolls = []) {
  return list(rolls).map((roll, rollIndex) => {
    const activeD20 = [];

    for (const die of diceFromRoll(roll)) {
      if (Number(die?.faces) !== 20) continue;

      for (const result of list(die?.results)) {
        if (result?.discarded === true || result?.active === false) continue;
        const value = finiteNumber(result?.result, NaN);
        if (Number.isFinite(value)) activeD20.push(value);
      }
    }

    const total = finiteNumber(roll?.total, NaN);
    const modifier = activeD20.length === 1 && Number.isFinite(total)
      ? total - activeD20[0]
      : null;

    return {
      rollIndex,
      formula: String(roll?.formula ?? ""),
      total: Number.isFinite(total) ? total : null,
      naturals: activeD20,
      hasCritical: activeD20.includes(20),
      hasFumble: activeD20.includes(1),
      modifier
    };
  });
}
