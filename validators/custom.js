export default async function custom(value, row, rule, context) {
  return await rule.validate(value, row, context);
}
