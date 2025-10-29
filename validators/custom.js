import { resolveTokens } from '../utils/tokenResolver.js';

function normaliseExternalResult(result, rule) {
  if (result === true) return { valid: true };
  if (result === false) {
    return { valid: false, message: rule.message || 'Validación personalizada no superada' };
  }
  if (typeof result === 'string') {
    return { valid: false, message: result };
  }
  if (result && typeof result === 'object') {
    const { valid, message, meta } = result;
    if (valid === undefined) {
      return {
        valid: false,
        message: message || rule.message || 'Validación personalizada no superada',
        meta,
      };
    }
    return {
      valid: Boolean(valid),
      message: message || rule.message || 'Validación personalizada no superada',
      meta,
    };
  }
  return { valid: true };
}

export default async function custom(value, row, rule, context = {}) {
  if (typeof rule.validate === 'function') {
    return await rule.validate(value, row, context);
  }

  const resolverName = rule.resolver || rule.external;
  if (!resolverName) {
    throw new Error('Las reglas tipo "custom" requieren una función validate o un resolver');
  }

  const resolvers = context.resolvers ?? {};
  const resolver = resolvers[resolverName];
  if (typeof resolver !== 'function') {
    throw new Error(`Resolver "${resolverName}" no encontrado en el contexto`);
  }

  const evaluationContext = { value, row, context, rule };
  const resolvedArgs = resolveTokens(rule.args ?? ['$value'], evaluationContext);
  const result = await resolver(value, row, context, rule, resolvedArgs);
  const normalised = normaliseExternalResult(result, rule);
  return normalised.valid ? true : { message: normalised.message, meta: normalised.meta };
}
