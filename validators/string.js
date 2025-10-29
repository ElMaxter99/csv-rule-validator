export default function stringValidator(value, row, rule) {
  if (value === undefined || value === null || value === '') {
    return rule.allowEmpty !== false ? true : rule.message || 'El texto no puede estar vacío';
  }

  const str = rule.trim === false ? String(value) : String(value).trim();

  if (rule.minLength != null && str.length < rule.minLength) {
    return rule.message || `Debe tener al menos ${rule.minLength} caracteres`;
  }

  if (rule.maxLength != null && str.length > rule.maxLength) {
    return rule.message || `Debe tener como máximo ${rule.maxLength} caracteres`;
  }

  if (rule.length != null && str.length !== rule.length) {
    return rule.message || `Debe tener exactamente ${rule.length} caracteres`;
  }

  if (rule.pattern) {
    const regex = new RegExp(rule.pattern, rule.flags ?? '');
    if (!regex.test(str)) {
      return rule.message || 'Formato inválido';
    }
  }

  if (rule.uppercase === true && str !== str.toUpperCase()) {
    return rule.message || 'Debe estar en mayúsculas';
  }

  if (rule.lowercase === true && str !== str.toLowerCase()) {
    return rule.message || 'Debe estar en minúsculas';
  }

  return true;
}
