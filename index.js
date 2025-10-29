import { parseCSV } from './utils/parseCSV.js';
import validators from './validators/index.js';
import { evaluateCondition } from './utils/evaluateCondition.js';

function normaliseDefinition(definition) {
  if (typeof definition === 'string') {
    return JSON.parse(definition);
  }
  return definition;
}

function normaliseRule(rule) {
  if (typeof rule === 'string') {
    return { type: rule };
  }
  return rule;
}

function normaliseValidatorResult(rule, result) {
  if (result === true) {
    return null;
  }

  const baseMessage = rule.message || 'Validación no superada';

  if (result === false) {
    return { message: baseMessage };
  }

  if (typeof result === 'string') {
    return { message: result };
  }

  if (result && typeof result === 'object') {
    return {
      message: result.message || baseMessage,
      meta: result.meta,
    };
  }

  return { message: baseMessage };
}

async function shouldRunRule(rule, evaluationContext) {
  if (rule?.enabled === false) return false;
  if (!rule?.onlyIf) return true;
  return evaluateCondition(rule.onlyIf, evaluationContext);
}

async function executeRule({ rule, validator, value, row, column, rowIndex, context, errors }) {
  const evaluationContext = { value, row, context, rule };
  const run = await shouldRunRule(rule, evaluationContext);
  if (!run) return;

  const result = await validator(value, row, rule, context);
  const normalised = normaliseValidatorResult(rule, result);
  if (!normalised) return;

  const error = {
    row: rowIndex + 1,
    column,
    rule: rule.type,
    message: normalised.message,
  };

  if (rule.code) {
    error.code = rule.code;
  }

  if (rule.severity) {
    error.severity = rule.severity;
  }

  if (normalised.meta !== undefined) {
    error.meta = normalised.meta;
  }

  errors.push(error);
}

async function validateRowLevelRules({ row, rowIndex, definition, context, errors }) {
  if (!definition?.rowValidations) return;

  for (const rowRule of definition.rowValidations) {
    const shouldRun = await evaluateCondition(rowRule.when, { value: row, row, context, rule: rowRule });
    if (!shouldRun) continue;

    for (const assertion of rowRule.assertions ?? []) {
      const rule = normaliseRule(assertion.rule ?? assertion);
      const column = assertion.column ?? rule.field ?? rule.target ?? assertion.field ?? null;
      const value = column ? row[column] : row;
      const validator = validators[rule.type];
      if (!validator) {
        throw new Error(`Validator "${rule.type}" no existe`);
      }
      await executeRule({
        rule,
        validator,
        value,
        row,
        column,
        rowIndex,
        context,
        errors,
      });
    }
  }
}

export async function validateDataset(input, definition, context = {}) {
  const normalisedDefinition = normaliseDefinition(definition);
  const rows = Array.isArray(input) ? input : await parseCSV(input);
  const errors = [];
  const columnsDefinition = normalisedDefinition.columns ?? {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    for (const [col, colDef] of Object.entries(columnsDefinition)) {
      const value = row[col];
      const rules = (colDef?.rules ?? []).map(normaliseRule);

      for (const rule of rules) {
        const validator = validators[rule.type];
        if (!validator) {
          throw new Error(`Validator "${rule.type}" no existe`);
        }
        await executeRule({
          rule,
          validator,
          value,
          row,
          column: col,
          rowIndex: i,
          context,
          errors,
        });
      }
    }

    await validateRowLevelRules({
      row,
      rowIndex: i,
      definition: normalisedDefinition,
      context,
      errors,
    });
  }

  return { valid: errors.length === 0, errors };
}
