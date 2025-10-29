import { resolveToken } from '../utils/tokenResolver.js';

const OPERATORS = {
  eq: (a, b) => a === b,
  equals: (a, b) => a === b,
  ne: (a, b) => a !== b,
  notEquals: (a, b) => a !== b,
  gt: (a, b) => Number(a) > Number(b),
  gte: (a, b) => Number(a) >= Number(b),
  lt: (a, b) => Number(a) < Number(b),
  lte: (a, b) => Number(a) <= Number(b),
  in: (a, b) => Array.isArray(b) && b.includes(a),
  notIn: (a, b) => Array.isArray(b) && !b.includes(a),
  contains: (a, b) => typeof a === 'string' && typeof b === 'string' && a.includes(b),
  startsWith: (a, b) => typeof a === 'string' && typeof b === 'string' && a.startsWith(b),
  endsWith: (a, b) => typeof a === 'string' && typeof b === 'string' && a.endsWith(b),
};

export default function compare(value, row, rule, context) {
  const evaluationContext = { value, row, context, rule };
  const leftToken = rule.left ?? rule.target ?? '$value';
  const rightToken =
    rule.right ??
    rule.compareTo ??
    rule.rightFrom ??
    rule.value ??
    rule.expected ??
    rule.equals;
  const operatorKey = rule.operator ?? 'eq';
  const operator = OPERATORS[operatorKey];

  if (!operator) {
    throw new Error(`Operador de comparación "${operatorKey}" no soportado`);
  }

  const left = resolveToken(leftToken, evaluationContext);
  const right = resolveToken(rightToken, evaluationContext);

  if (rule.skipIfEmpty && (left === undefined || left === null || left === '')) {
    return true;
  }

  const isValid = operator(left, right);
  return isValid ? true : rule.message || `La comparación ${operatorKey} no se cumple`;
}
