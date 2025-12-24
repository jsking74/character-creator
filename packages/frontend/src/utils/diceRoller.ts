/**
 * Dice roller utility functions for tabletop RPG dice notation
 */

export interface DiceRoll {
  dice: string; // e.g., "2d6", "1d20+5"
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: Date;
}

export interface ParsedDice {
  count: number;
  sides: number;
  modifier: number;
}

/**
 * Parse dice notation string (e.g., "2d6+3", "1d20-2", "d8")
 */
export function parseDiceNotation(notation: string): ParsedDice | null {
  const regex = /^(\d*)d(\d+)([+-]\d+)?$/i;
  const match = notation.trim().match(regex);

  if (!match) {
    return null;
  }

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
    return null;
  }

  return { count, sides, modifier };
}

/**
 * Roll a single die with the given number of sides
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll dice based on parsed notation
 */
export function rollDice(parsed: ParsedDice): DiceRoll {
  const rolls: number[] = [];

  for (let i = 0; i < parsed.count; i++) {
    rolls.push(rollDie(parsed.sides));
  }

  const sum = rolls.reduce((a, b) => a + b, 0);
  const total = sum + parsed.modifier;

  const diceString =
    `${parsed.count}d${parsed.sides}` +
    (parsed.modifier > 0 ? `+${parsed.modifier}` : parsed.modifier < 0 ? `${parsed.modifier}` : '');

  return {
    dice: diceString,
    rolls,
    modifier: parsed.modifier,
    total,
    timestamp: new Date(),
  };
}

/**
 * Roll dice from a notation string
 */
export function roll(notation: string): DiceRoll | null {
  const parsed = parseDiceNotation(notation);
  if (!parsed) {
    return null;
  }
  return rollDice(parsed);
}

/**
 * Common dice presets for quick rolling
 */
export const COMMON_DICE = [
  { label: 'd4', notation: '1d4' },
  { label: 'd6', notation: '1d6' },
  { label: 'd8', notation: '1d8' },
  { label: 'd10', notation: '1d10' },
  { label: 'd12', notation: '1d12' },
  { label: 'd20', notation: '1d20' },
  { label: 'd100', notation: '1d100' },
];

/**
 * Calculate ability modifier from ability score (D&D 5e formula)
 */
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Format modifier for display (+X or -X)
 */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Roll an ability check with modifier
 */
export function rollAbilityCheck(abilityScore: number): DiceRoll {
  const modifier = calculateAbilityModifier(abilityScore);
  return rollDice({ count: 1, sides: 20, modifier });
}

/**
 * Roll with advantage (roll 2d20, take higher)
 */
export function rollWithAdvantage(modifier: number = 0): DiceRoll & { advantageRolls: number[] } {
  const roll1 = rollDie(20);
  const roll2 = rollDie(20);
  const higher = Math.max(roll1, roll2);

  return {
    dice: `1d20${modifier >= 0 ? '+' : ''}${modifier} (adv)`,
    rolls: [higher],
    modifier,
    total: higher + modifier,
    timestamp: new Date(),
    advantageRolls: [roll1, roll2],
  };
}

/**
 * Roll with disadvantage (roll 2d20, take lower)
 */
export function rollWithDisadvantage(modifier: number = 0): DiceRoll & { disadvantageRolls: number[] } {
  const roll1 = rollDie(20);
  const roll2 = rollDie(20);
  const lower = Math.min(roll1, roll2);

  return {
    dice: `1d20${modifier >= 0 ? '+' : ''}${modifier} (dis)`,
    rolls: [lower],
    modifier,
    total: lower + modifier,
    timestamp: new Date(),
    disadvantageRolls: [roll1, roll2],
  };
}
