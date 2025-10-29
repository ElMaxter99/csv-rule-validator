import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDataset } from '../index.js';

const definition = {
  columns: {
    id: {
      rules: ['required'],
    },
    estado: {
      rules: ['required'],
    },
    comentario: {
      rules: [
        {
          type: 'string',
          minLength: 5,
          message: 'El comentario es muy corto',
          allowEmpty: false,
          onlyIf: { field: 'estado', equals: 'rechazado' },
        },
      ],
    },
  },
  rowValidations: [
    {
      when: { field: 'estado', equals: 'aprobado' },
      assertions: [
        {
          column: 'aprobador',
          rule: { type: 'required', message: 'Las aprobaciones requieren aprobador' },
        },
      ],
    },
  ],
};

const dataset = [
  { id: '1', estado: 'aprobado', comentario: 'ok', aprobador: 'Ana' },
  { id: '', estado: 'rechazado', comentario: '', aprobador: '' },
  { id: '3', estado: 'aprobado', comentario: 'listo', aprobador: '' },
];

test('validateDataset retorna errores detallados por fila y columna', async () => {
  const result = await validateDataset(dataset, definition);
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 3);

  const missingId = result.errors.find((err) => err.column === 'id' && err.row === 2);
  assert.deepEqual(missingId, {
    row: 2,
    column: 'id',
    rule: 'required',
    message: 'Campo obligatorio',
  });

  const commentError = result.errors.find((err) => err.column === 'comentario' && err.row === 2);
  assert.deepEqual(commentError, {
    row: 2,
    column: 'comentario',
    rule: 'string',
    message: 'El comentario es muy corto',
  });

  const approverError = result.errors.find((err) => err.column === 'aprobador' && err.row === 3);
  assert.deepEqual(approverError, {
    row: 3,
    column: 'aprobador',
    rule: 'required',
    message: 'Las aprobaciones requieren aprobador',
  });
});

