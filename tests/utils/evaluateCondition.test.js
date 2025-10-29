import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCondition } from '../../utils/evaluateCondition.js';

const row = {
  estado: 'activo',
  score: '75',
  categoria: 'gold',
  comentarios: 'Cliente con buen comportamiento',
};

const context = {
  resolvers: {
    tieneSaldoSuficiente: (value) => Number(value) > 0,
  },
};

const evaluationContext = {
  value: row.estado,
  row,
  context,
  rule: {},
};

test('evaluateCondition soporta combinaciones complejas con all y any', async () => {
  const condition = {
    all: [
      { field: 'estado', equals: 'activo' },
      {
        any: [
          { field: 'categoria', in: ['platinum', 'gold'] },
          { field: 'score', gte: 80 },
        ],
      },
    ],
  };

  const result = await evaluateCondition(condition, evaluationContext);
  assert.equal(result, true);
});

test('evaluateCondition puede negar condiciones y validar por regex', async () => {
  const condition = {
    all: [
      { not: { field: 'estado', equals: 'bloqueado' } },
      { field: 'comentarios', regex: 'comportamiento', flags: 'i' },
    ],
  };
  const result = await evaluateCondition(condition, evaluationContext);
  assert.equal(result, true);
});

test('evaluateCondition delega en resolvers externos cuando se especifica', async () => {
  const condition = {
    external: 'tieneSaldoSuficiente',
    args: ['$row.score'],
  };

  const result = await evaluateCondition(condition, evaluationContext);
  assert.equal(result, true);
});

test('evaluateCondition soporta verificaciones de presencia, longitud y comparaciones numéricas', async () => {
  const condition = {
    all: [
      { field: 'comentarios', present: true },
      { field: 'comentarios', minLength: 5, maxLength: 80 },
      { field: 'score', gte: 70 },
    ],
  };

  const result = await evaluateCondition(condition, evaluationContext);
  assert.equal(result, true);
});

