import { evaluateCondition } from '../utils/evaluateCondition.js';

export default async function requiredIf(value, row, rule, context) {
  let shouldBeRequired = false;
  const evaluationContext = { value, row, context, rule };

  if (typeof rule.condition === 'function') {
    const depValue = rule.dependsOn ? row[rule.dependsOn] : value;
    shouldBeRequired = await rule.condition(depValue, row, context);
  } else if (rule.when) {
    shouldBeRequired = await evaluateCondition(rule.when, evaluationContext);
  } else if (rule.dependsOn) {
    const dependsValue = row[rule.dependsOn];
    if (rule.equals !== undefined) {
      shouldBeRequired = dependsValue === rule.equals;
    } else if (rule.in) {
      shouldBeRequired = rule.in.includes(dependsValue);
    } else {
      shouldBeRequired = Boolean(dependsValue);
    }
  }

  if (shouldBeRequired && (value === undefined || value === null || value === '')) {
    return (
      rule.message ||
      (rule.dependsOn
        ? `Campo requerido si ${rule.dependsOn} cumple la condición`
        : 'Campo requerido por la condición configurada')
    );
  }

  return true;
}
