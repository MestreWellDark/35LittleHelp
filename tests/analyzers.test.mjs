import test from "node:test";
import assert from "node:assert/strict";

import {
  activeBuffItems,
  analyzeD20Rolls,
  classifyItems,
  collectSkillRankIssues,
  estimateCarriedLoad,
  findSlotIssues,
  spellbookDcSummaries
} from "../scripts/core/analyzers.mjs";

test("classifies D35E actor items and active buffs", () => {
  const items = [
    { type: "class", system: {} },
    { type: "feat", system: {} },
    { type: "spell", system: {} },
    { type: "buff", system: { active: true } },
    { type: "buff", system: { active: false } },
    { type: "equipment", system: {} },
    { type: "weapon", system: {} }
  ];

  assert.deepEqual(classifyItems(items), {
    classes: 1,
    feats: 1,
    spells: 1,
    buffs: 2,
    activeBuffs: 1,
    inventory: 2
  });
  assert.equal(activeBuffItems(items).length, 1);
});

test("estimates item and coin load", () => {
  const load = estimateCarriedLoad([
    { type: "equipment", system: { carried: true, weight: 10, quantity: 2 } },
    { type: "weapon", system: { carried: false, weight: 3, quantity: 2 } },
    { type: "loot", system: { carried: true, weight: 5, quantity: 9, constantWeight: true } }
  ], { gp: 100, sp: 50 }, 50, true);

  assert.deepEqual(load, {
    itemWeight: 25,
    coins: 150,
    coinWeight: 3,
    total: 28
  });
});

test("detects equipped items without slots", () => {
  const issues = findSlotIssues([
    { id: "a", name: "Cloak", type: "equipment", system: { equipped: true, slot: "" } },
    { id: "b", name: "Ring", type: "equipment", system: { equipped: true, slot: "ring" } },
    { id: "c", name: "Sword", type: "weapon", system: { equipped: true, slot: "" } }
  ]);

  assert.deepEqual(issues, [{ id: "a", name: "Cloak" }]);
});

test("checks skill points against character level", () => {
  const issues = collectSkillRankIssues({
    clm: { name: "Climb", points: 9 },
    kno: {
      name: "Knowledge",
      points: 0,
      subSkills: {
        arc: { name: "Arcana", points: 8 }
      }
    }
  }, 5);

  assert.equal(issues.length, 1);
  assert.equal(issues[0].name, "Climb");
  assert.equal(issues[0].maxPoints, 8);
});

test("summarizes spellbook base DCs", () => {
  const summaries = spellbookDcSummaries({
    abilities: { int: { mod: 4 }, wis: { mod: 2 } },
    attributes: {
      spells: {
        spellbooks: {
          primary: { name: "Wizard", ability: "int" },
          divine: { class: "Cleric", ability: "wis", baseDCFormula: "10 + @abilities.wis.mod" }
        }
      }
    }
  });

  assert.deepEqual(summaries.map(({ label, base }) => ({ label, base })), [
    { label: "Wizard", base: 14 },
    { label: "Cleric", base: 12 }
  ]);
});

test("finds natural d20 results and total modifier", () => {
  const analyses = analyzeD20Rolls([
    {
      formula: "1d20 + 7",
      total: 27,
      dice: [{
        faces: 20,
        results: [{ result: 20, active: true }]
      }]
    },
    {
      formula: "2d20kl + 3",
      total: 4,
      dice: [{
        faces: 20,
        results: [
          { result: 1, active: true },
          { result: 14, discarded: true }
        ]
      }]
    }
  ]);

  assert.equal(analyses[0].hasCritical, true);
  assert.equal(analyses[0].modifier, 7);
  assert.equal(analyses[1].hasFumble, true);
  assert.equal(analyses[1].modifier, 3);
});
