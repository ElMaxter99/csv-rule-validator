import { parseCSV } from './utils/parseCSV.js';
import validators from './validators/index.js';

export async function validateDataset(input, definition, context = {}) {
  const rows = Array.isArray(input) ? input : await parseCSV(input);
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (const [col, colDef] of Object.entries(definition.columns)) {
      const value = row[col];
      for (const rule of colDef.rules) {
        const validator = validators[rule.type];
        if (!validator) throw new Error(`Validator "${rule.type}" no existe`);
        const result = await validator(value, row, rule, context);
        if (result !== true) {
          errors.push({
            row: i + 1,
            column: col,
            message: result,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
