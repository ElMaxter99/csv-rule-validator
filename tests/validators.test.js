import { test } from 'node:test';
import assert from 'node:assert/strict';
import required from '../validators/required.js';
import number from '../validators/number.js';
import stringValidator from '../validators/string.js';
import inRule from '../validators/in.js';
import compare from '../validators/compare.js';
import requiredIf from '../validators/requiredIf.js';
import custom from '../validators/custom.js';

const baseRow = { segmento: 'premium', referencia: 'ABC' };

test('required detecta valores vacíos', () => {
  const result = required('', baseRow, { message: 'obligatorio' });
  assert.equal(result, 'obligatorio');
  assert.equal(required('valor', baseRow, {}), true);
});

test('number valida enteros y rangos', () => {
  assert.equal(number('', baseRow, {}), true);
  assert.equal(number('abc', baseRow, {}), 'Debe ser numérico');
  assert.equal(number('10', baseRow, { integer: true }), true);
  assert.equal(number('10.5', baseRow, { integer: true }), 'Debe ser un número entero');
  assert.equal(number('4', baseRow, { min: 5 }), 'Debe ser ≥ 5');
  assert.equal(number('12', baseRow, { max: 10 }), 'Debe ser ≤ 10');
});

test('string aplica trimming, longitudes y expresiones regulares', () => {
  assert.equal(stringValidator('', baseRow, { allowEmpty: false }), 'El texto no puede estar vacío');
  assert.equal(stringValidator('  ab  ', baseRow, { minLength: 2 }), true);
  assert.equal(stringValidator('abc', baseRow, { minLength: 2, maxLength: 5 }), true);
  assert.equal(stringValidator('abcdef', baseRow, { maxLength: 5 }), 'Debe tener como máximo 5 caracteres');
  assert.equal(stringValidator('1234', baseRow, { length: 4 }), true);
  assert.equal(stringValidator('hola', baseRow, { pattern: '^adios$' }), 'Formato inválido');
});

test('in valida contra un conjunto permitido', () => {
  assert.equal(inRule('premium', baseRow, { values: ['premium', 'standard'] }), true);
  assert.equal(
    inRule('gold', baseRow, { values: ['premium', 'standard'], message: 'Fuera de catálogo' }),
    'Fuera de catálogo',
  );
});

test('compare soporta múltiples operadores y tokens', () => {
  const row = { edad: 30, edad_minima: 21, flags: ['a', 'b'] };
  assert.equal(compare('30', row, { type: 'compare', operator: 'gte', right: '$row.edad_minima' }), true);
  assert.equal(
    compare('20', row, { type: 'compare', operator: 'gte', right: '$row.edad_minima' }),
    'La comparación gte no se cumple',
  );
  assert.equal(compare('a', row, { type: 'compare', operator: 'in', right: '$row.flags' }), true);
});

test('requiredIf hace obligatorio un campo según otra columna', async () => {
  const row = { canal: 'online', codigo: '' };
  const rule = {
    type: 'requiredIf',
    when: { field: 'canal', equals: 'online' },
    message: 'Necesitamos el código para canal online',
  };
  const result = await requiredIf(row.codigo, row, rule, {});
  assert.equal(result, 'Necesitamos el código para canal online');

  const ok = await requiredIf('valor', row, rule, {});
  assert.equal(ok, true);
});

test('custom ejecuta funciones inline y resolvers externos', async () => {
  const inline = await custom('abc', baseRow, {
    type: 'custom',
    validate: (value) => (value === 'abc' ? true : 'falló'),
  });
  assert.equal(inline, true);

  const context = {
    resolvers: {
      validarSegmento: (value, row, ctx, rule, args) => {
        assert.equal(args[0], value);
        assert.equal(args[1], row.segmento);
        return { valid: value === 'abc', meta: { recibido: args } };
      },
    },
  };

  const ok = await custom('abc', baseRow, {
    type: 'custom',
    resolver: 'validarSegmento',
    args: ['$value', '$row.segmento'],
  }, context);
  assert.equal(ok, true);

  const fail = await custom('xyz', baseRow, {
    type: 'custom',
    resolver: 'validarSegmento',
    args: ['$value', '$row.segmento'],
    message: 'Segmento inválido',
  }, context);
  assert.deepEqual(fail, { message: 'Segmento inválido', meta: { recibido: ['xyz', 'premium'] } });
});

