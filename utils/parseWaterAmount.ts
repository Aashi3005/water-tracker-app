/**
 * Water amount parsing utility for voice commands
 * Handles various input formats and normalizes to milliliters
 */

interface ParseResult {
  success: boolean;
  amount?: number;
  error?: string;
}

// Standard conversions to milliliters
const UNIT_CONVERSIONS: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  millilitre: 1,
  millilitres: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  litre: 1000,
  litres: 1000,
  glass: 250,
  glasses: 250,
  cup: 240,
  cups: 240,
  oz: 30,
  ounce: 30,
  ounces: 30,
  bottle: 500,
  bottles: 500,
};

// Word-to-number mapping
const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
  quarter: 0.25,
};

// Fraction patterns
const FRACTION_PATTERNS: [string, number][] = [
  ['one and a half', 1.5],
  ['one and half', 1.5],
  ['half a', 0.5],
  ['half', 0.5],
  ['a quarter', 0.25],
  ['quarter', 0.25],
];

/**
 * Parses a voice command string and extracts the water amount in milliliters
 *
 * @param input - Raw voice command string (e.g., "250ml", "half liter", "2 glasses")
 * @returns ParseResult with amount in ml or error message
 *
 * @example
 * parseWaterAmount("250ml") // { success: true, amount: 250 }
 * parseWaterAmount("half liter") // { success: true, amount: 500 }
 * parseWaterAmount("2 glasses") // { success: true, amount: 500 }
 */
export function parseWaterAmount(input: string): ParseResult {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Invalid input' };
  }

  // Normalize: lowercase, trim, remove extra spaces
  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');

  // Remove filler words
  const cleaned = normalized
    .replace(/\b(of|some|a bit of|log|add|drink|water|please)\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  // Handle fraction patterns first (e.g., "half liter")
  for (const [pattern, multiplier] of FRACTION_PATTERNS) {
    if (cleaned.includes(pattern)) {
      const afterFraction = cleaned
        .substring(cleaned.indexOf(pattern) + pattern.length)
        .trim();
      const unitMatch = afterFraction.match(/^(\w+)/);

      if (unitMatch) {
        const unit = unitMatch[1];
        const conversion = UNIT_CONVERSIONS[unit];
        if (conversion) {
          const amount = Math.round(multiplier * conversion);
          if (amount > 0 && amount <= 5000) {
            return { success: true, amount };
          }
        }
      }
    }
  }

  // Pattern: Number followed by unit (e.g., "250ml", "250 ml", "2 glasses")
  const numberUnitPattern = /(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/;
  const match = cleaned.match(numberUnitPattern);

  if (match) {
    const numericValue = parseFloat(match[1]);
    const unitStr = match[2].trim().toLowerCase();

    const conversion = UNIT_CONVERSIONS[unitStr];
    if (conversion) {
      const amount = Math.round(numericValue * conversion);
      if (amount > 0 && amount <= 5000) {
        return { success: true, amount };
      }
    }
  }

  // Pattern: Word number followed by unit (e.g., "two glasses")
  const wordNumberPattern = /(\w+)\s+([a-zA-Z]+)/;
  const wordMatch = cleaned.match(wordNumberPattern);

  if (wordMatch) {
    const wordNum = WORD_NUMBERS[wordMatch[1]];
    const unitStr = wordMatch[2].toLowerCase();
    const conversion = UNIT_CONVERSIONS[unitStr];

    if (wordNum !== undefined && conversion) {
      const amount = Math.round(wordNum * conversion);
      if (amount > 0 && amount <= 5000) {
        return { success: true, amount };
      }
    }
  }

  // Pattern: Just a number (assume ml)
  const justNumber = cleaned.match(/^(\d+(?:\.\d+)?)$/);
  if (justNumber) {
    const amount = Math.round(parseFloat(justNumber[1]));
    if (amount > 0 && amount <= 5000) {
      return { success: true, amount };
    }
  }

  return {
    success: false,
    error: `Could not parse: "${input}". Try "250ml", "half liter", or "2 glasses".`,
  };
}

/**
 * Validates that an amount is within reasonable bounds
 */
export function isValidAmount(amount: number): boolean {
  return (
    typeof amount === 'number' && !isNaN(amount) && amount > 0 && amount <= 5000
  );
}

/**
 * Formats an amount for display
 */
export function formatAmount(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return liters % 1 === 0 ? `${liters}L` : `${liters.toFixed(1)}L`;
  }
  return `${ml}ml`;
}
