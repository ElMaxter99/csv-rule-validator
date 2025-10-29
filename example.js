import { validateDataset } from './index.js';

const csvData = `
A,B,C,D
100,ingreso,,
200,egreso,,X001
,ingreso,desc,
`;

const definition = {
  columns: {
    A: {
      rules: [
        { type: 'required' },
        { type: 'number', min: 0 },
      ]
    },
    B: {
      rules: [
        { type: 'in', values: ['ingreso', 'egreso'] }
      ]
    },
    C: {
      rules: [
        { type: 'requiredIf', dependsOn: 'B', condition: (b) => b === 'egreso' }
      ]
    },
    D: {
      rules: [
        {
          type: 'custom',
          validate: async (value) => {
            const validCodes = ['X001', 'X002', 'X003'];
            if (!value) return true;
            return validCodes.includes(value)
              ? true
              : `Código ${value} no existe`;
          }
        }
      ]
    }
  }
};

const result = await validateDataset(csvData, definition);
console.log(result);
