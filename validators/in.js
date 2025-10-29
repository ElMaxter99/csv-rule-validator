import { resolveTokens } from '../utils/tokenResolver.js';

export default function inRule(value, row, rule, context) {
  if (value === undefined || value === null || value === '') return true;
  const evaluationContext = { value, row, context, rule };
  const allowedValues = resolveTokens(rule.values ?? [], evaluationContext);
  return allowedValues.includes(value)
    ? true
    : rule.message || `Debe ser uno de: ${allowedValues.join(', ')}`;
}
