export default function requiredIf(value, row, rule) {
  const depValue = row[rule.dependsOn];
  const shouldBeRequired = rule.condition(depValue);
  if (shouldBeRequired && (value === undefined || value === '')) {
    return rule.message || `Campo requerido si ${rule.dependsOn} cumple condición`;
  }
  return true;
}
