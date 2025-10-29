import { readFileSync } from 'fs';
import { validateDataset } from './index.js';

const csvData = `dni,cuenta,monto
12345678,CTA-01,800
87654321,CTA-99,1500
55555555,CTA-01,5000
`;

const definition = JSON.parse(
  readFileSync(new URL('./configs/external-checks.json', import.meta.url), 'utf-8')
);

const context = {
  resolvers: {
    async dniExisteEnCore(value) {
      const clientes = new Set(['12345678', '87654321']);
      return clientes.has(value) || {
        valid: false,
        message: `El DNI ${value} no existe en el core bancario`
      };
    },
    async cuentaHabilitadaParaAlta(value, row, ctx, rule, args) {
      const [, dni] = args;
      const cuentasPorDni = {
        '12345678': new Set(['CTA-01', 'CTA-02']),
        '87654321': new Set(['CTA-03'])
      };
      const cuentas = cuentasPorDni[dni] ?? new Set();
      return cuentas.has(value);
    },
    async montoDentroDeLimites(value, row, ctx, rule, args) {
      const [monto, cuenta] = args;
      const limites = {
        'CTA-01': { min: 100, max: 2000 },
        'CTA-02': { min: 100, max: 1500 },
        'CTA-03': { min: 500, max: 5000 }
      };
      const info = limites[cuenta];
      if (!info) return { valid: false, message: `Cuenta ${cuenta} sin límites configurados` };
      if (monto < info.min || monto > info.max) {
        return {
          valid: false,
          message: `El monto ${monto} está fuera de rango (${info.min}-${info.max})`
        };
      }
      return true;
    }
  }
};

const result = await validateDataset(csvData, definition, context);
console.log(JSON.stringify(result, null, 2));
