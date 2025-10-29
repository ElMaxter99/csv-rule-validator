export default function required(value) {
  return value !== undefined && value !== '' ? true : 'Campo obligatorio';
}
