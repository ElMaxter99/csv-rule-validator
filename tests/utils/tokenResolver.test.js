import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveToken, resolveTokens } from '../../utils/tokenResolver.js';

const evaluationContext = {
  value: 'ABC123',
  row: {
    dni: '12345678',
    datos: { estado: 'activo' },
  },
  context: { tenant: 'ar', metadata: { source: 'test' } },
  rule: {
    constants: {
      thresholds: { min: 10 },
    },
  },
};

test('resolveToken permite acceder al valor actual y al registro completo', () => {
  assert.equal(resolveToken('$value', evaluationContext), 'ABC123');
  assert.equal(resolveToken('$row.dni', evaluationContext), '12345678');
  assert.deepEqual(resolveToken('$row.datos', evaluationContext), { estado: 'activo' });
});

test('resolveToken permite leer del contexto y constantes de la regla', () => {
  assert.equal(resolveToken('$context.tenant', evaluationContext), 'ar');
  assert.equal(resolveToken('$const.thresholds.min', evaluationContext), 10);
});

test('resolveTokens procesa arreglos mixtos', () => {
  const tokens = resolveTokens(['$value', '$row.datos.estado', 'literal'], evaluationContext);
  assert.deepEqual(tokens, ['ABC123', 'activo', 'literal']);
});

