export default function inRule(value, row, rule) {
  if (value === undefined || value === '') return true;
  return rule.values.includes(value)
    ? true
    : `Debe ser uno de: ${rule.values.join(', ')}`;
}
