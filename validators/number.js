export default function number(value, row, rule) {
  if (value === undefined || value === '') return true;
  const n = Number(value);
  if (isNaN(n)) return 'Debe ser numérico';
  if (rule.min != null && n < rule.min) return `Debe ser ≥ ${rule.min}`;
  if (rule.max != null && n > rule.max) return `Debe ser ≤ ${rule.max}`;
  return true;
}
