export default function number(value, row, rule) {
  if (value === undefined || value === null || value === '') return true;
  const n = Number(value);
  if (Number.isNaN(n)) {
    return rule.message || 'Debe ser numérico';
  }
  if (rule.integer && !Number.isInteger(n)) {
    return rule.message || 'Debe ser un número entero';
  }
  if (rule.min != null && n < rule.min) {
    return rule.message || `Debe ser ≥ ${rule.min}`;
  }
  if (rule.max != null && n > rule.max) {
    return rule.message || `Debe ser ≤ ${rule.max}`;
  }
  return true;
}
