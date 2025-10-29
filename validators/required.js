export default function required(value, row, rule) {
  const isPresent = value !== undefined && value !== null && value !== '';
  return isPresent ? true : rule.message || 'Campo obligatorio';
}
