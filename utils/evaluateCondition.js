import { resolveToken, resolveTokens } from './tokenResolver.js';

function coerceToNumber(input) {
  if (input == null || input === '') return undefined;
  const n = Number(input);
  return Number.isNaN(n) ? undefined : n;
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

async function runExternal(condition, evaluationContext) {
  const { context } = evaluationContext;
  const resolverName = condition.external || condition.resolver;
  const argsTokens = condition.args ?? [];
  const fn = context?.resolvers?.[resolverName];
  if (typeof fn !== 'function') {
    throw new Error(`Resolver externo "${resolverName}" no encontrado en el contexto`);
  }
  const args = argsTokens.length
    ? argsTokens.map((arg) => resolveToken(arg, evaluationContext))
    : [evaluationContext.value, evaluationContext.row, context, evaluationContext.rule];
  const result = await fn(...args);
  if (typeof result === 'object' && result !== null && 'valid' in result) {
    return Boolean(result.valid);
  }
  return Boolean(result);
}

export async function evaluateCondition(condition, evaluationContext) {
  if (!condition) return true;

  if (Array.isArray(condition)) {
    const evaluations = await Promise.all(
      condition.map((inner) => evaluateCondition(inner, evaluationContext))
    );
    return evaluations.every(Boolean);
  }

  if (condition.all) {
    const evaluations = await Promise.all(
      condition.all.map((inner) => evaluateCondition(inner, evaluationContext))
    );
    return evaluations.every(Boolean);
  }

  if (condition.any) {
    const evaluations = await Promise.all(
      condition.any.map((inner) => evaluateCondition(inner, evaluationContext))
    );
    return evaluations.some(Boolean);
  }

  if (condition.not) {
    const result = await evaluateCondition(condition.not, evaluationContext);
    return !result;
  }

  if (condition.external || condition.resolver) {
    return runExternal(condition, evaluationContext);
  }

  const leftToken = condition.target ?? condition.left ?? (condition.field ? `$row.${condition.field}` : '$value');
  const leftValue = resolveToken(leftToken, evaluationContext);

  if (condition.present !== undefined) {
    const shouldBePresent = Boolean(condition.present);
    const isPresent = leftValue !== undefined && leftValue !== null && leftValue !== '';
    return shouldBePresent ? isPresent : !isPresent;
  }

  if (condition.empty !== undefined) {
    const shouldBeEmpty = Boolean(condition.empty);
    const isEmpty = leftValue === undefined || leftValue === null || leftValue === '';
    return shouldBeEmpty ? isEmpty : !isEmpty;
  }

  if (condition.lengthEquals != null || condition.minLength != null || condition.maxLength != null) {
    const valueAsString = leftValue != null ? String(leftValue) : '';
    if (condition.lengthEquals != null && valueAsString.length !== condition.lengthEquals) {
      return false;
    }
    if (condition.minLength != null && valueAsString.length < condition.minLength) {
      return false;
    }
    if (condition.maxLength != null && valueAsString.length > condition.maxLength) {
      return false;
    }
  }

  if (condition.regex) {
    const flags = condition.flags ?? '';
    const regex = new RegExp(condition.regex, flags);
    return typeof leftValue === 'string' && regex.test(leftValue);
  }

  if (condition.in) {
    const values = ensureArray(resolveTokens(condition.in, evaluationContext));
    return values.includes(leftValue);
  }

  if (condition.notIn) {
    const values = ensureArray(resolveTokens(condition.notIn, evaluationContext));
    return !values.includes(leftValue);
  }

  if (condition.equals !== undefined || condition.equalsFrom !== undefined) {
    const rightValue = condition.equalsFrom
      ? resolveToken(condition.equalsFrom, evaluationContext)
      : condition.equals;
    return leftValue === rightValue;
  }

  if (condition.notEquals !== undefined || condition.notEqualsFrom !== undefined) {
    const rightValue = condition.notEqualsFrom
      ? resolveToken(condition.notEqualsFrom, evaluationContext)
      : condition.notEquals;
    return leftValue !== rightValue;
  }

  if (condition.gt != null || condition.gte != null || condition.lt != null || condition.lte != null) {
    const numericLeft = coerceToNumber(leftValue);
    if (numericLeft === undefined) return false;
    if (condition.gt != null && !(numericLeft > Number(condition.gt))) return false;
    if (condition.gte != null && !(numericLeft >= Number(condition.gte))) return false;
    if (condition.lt != null && !(numericLeft < Number(condition.lt))) return false;
    if (condition.lte != null && !(numericLeft <= Number(condition.lte))) return false;
    return true;
  }

  if (condition.truthy !== undefined) {
    const isTruthy = Boolean(leftValue);
    return condition.truthy ? isTruthy : !isTruthy;
  }

  if (condition.falsy !== undefined) {
    const isFalsy = !leftValue;
    return condition.falsy ? isFalsy : !isFalsy;
  }

  return Boolean(leftValue);
}
