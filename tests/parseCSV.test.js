import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV } from '../utils/parseCSV.js';

const SAMPLE_CSV = `
name,age,city
Alice,30,Buenos Aires

Bob,25,Córdoba
`;

test('parseCSV convierte un CSV con cabecera en un array de objetos', async () => {
  const rows = await parseCSV(SAMPLE_CSV);
  assert.deepStrictEqual(rows, [
    { name: 'Alice', age: '30', city: 'Buenos Aires' },
    { name: 'Bob', age: '25', city: 'Córdoba' },
  ]);
});

