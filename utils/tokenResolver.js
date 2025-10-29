const PATH_SEPARATOR = '.';

function accessPath(source, path) {
  if (source == null) return undefined;
  if (!path) return source;
  return path.split(PATH_SEPARATOR).reduce((acc, segment) => {
    if (acc == null) return undefined;
    if (segment === '*') return acc; // wildcard placeholder, no traversal
    return acc[segment];
  }, source);
}

export function resolveToken(token, evaluationContext) {
  const { value, row, context } = evaluationContext;

  if (Array.isArray(token)) {
    return token.map((item) => resolveToken(item, evaluationContext));
  }

  if (typeof token !== 'string') {
    return token;
  }

  if (token === '$value') {
    return value;
  }

  if (token === '$row') {
    return row;
  }

  if (token === '$context') {
    return context;
  }

  if (token.startsWith('$row.')) {
    const path = token.slice(5);
    return accessPath(row, path);
  }

  if (token.startsWith('$context.')) {
    const path = token.slice(9);
    return accessPath(context, path);
  }

  if (token.startsWith('$const.')) {
    // Allows referencing arbitrary constants defined inside the rule.
    const { constants } = evaluationContext.rule ?? {};
    const path = token.slice(7);
    return accessPath(constants, path);
  }

  return token;
}

export function resolveTokens(value, evaluationContext) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveToken(item, evaluationContext));
  }
  return resolveToken(value, evaluationContext);
}
