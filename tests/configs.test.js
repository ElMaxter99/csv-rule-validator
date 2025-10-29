import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDataset } from '../index.js';

async function loadConfig(file) {
  const content = await readFile(new URL(`../configs/${file}`, import.meta.url), 'utf-8');
  return JSON.parse(content);
}

test('basic-onboarding detecta múltiples errores de validación', async () => {
  const definition = await loadConfig('basic-onboarding.json');
  const dataset = [
    { dni: '12345678', nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '123456789' },
    { dni: '', nombre: 'Al', email: 'correo', telefono: '12' },
  ];

  const result = await validateDataset(dataset, definition);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'dni'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'email'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'telefono'));
});

test('dependent-benefits integra reglas condicionales y resolvers externos', async () => {
  const definition = await loadConfig('dependent-benefits.json');
  const context = {
    resolvers: {
      validateMinimumSalary: (salary, row) => {
        const minimoPorTipo = { planta: 50000, contratista: 20000, practicante: 0 };
        const minimo = minimoPorTipo[row.tipo_empleado];
        return Number(salary) >= minimo;
      },
    },
  };

  const dataset = [
    {
      tipo_empleado: 'planta',
      fecha_ingreso: '2021-01-05',
      salario: '60000',
      bono: '5000',
      beneficios_medicos: 'Plan A',
    },
    {
      tipo_empleado: 'planta',
      fecha_ingreso: '',
      salario: '30000',
      bono: '40000',
      beneficios_medicos: '',
    },
  ];

  const result = await validateDataset(dataset, definition, context);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'fecha_ingreso'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'salario'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'bono'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'beneficios_medicos'));
});

test('external-checks coordina múltiples resolvers por columna', async () => {
  const definition = await loadConfig('external-checks.json');
  const context = {
    resolvers: {
      dniExisteEnCore: (dni) => ['12345678', '87654321'].includes(dni),
      cuentaHabilitadaParaAlta: (cuenta, dni) => cuenta === 'CTA-1' && dni === '12345678',
      montoDentroDeLimites: (monto, cuenta) => {
        const limites = { 'CTA-1': 10000, 'CTA-2': 2000 };
        return Number(monto) <= (limites[cuenta] ?? 0);
      },
    },
  };

  const dataset = [
    { dni: '12345678', cuenta: 'CTA-1', monto: '5000' },
    { dni: '00000000', cuenta: 'CTA-2', monto: '5000' },
  ];

  const result = await validateDataset(dataset, definition, context);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'dni'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'cuenta'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'monto'));
});

test('advanced-risk cubre reglas de filas y validaciones complejas', async () => {
  const definition = await loadConfig('advanced-risk.json');
  const context = {
    resolvers: {
      validarReporteManual: (row) => Boolean(row?.reporte_manual?.adjunto),
    },
  };

  const dataset = [
    {
      operacion_id: 'OP-000001',
      estado: 'aprobada',
      motivo_rechazo: '',
      score: '80',
      score_minimo_perfil: '70',
      flag_sospechoso: 'NO',
      comentarios: '',
      monto_desembolsado: '150000',
      fecha_aprobacion: '2024-02-01',
      reporte_manual: { adjunto: true },
    },
    {
      operacion_id: 'X-1',
      estado: 'rechazada',
      motivo_rechazo: '',
      score: '40',
      score_minimo_perfil: '60',
      flag_sospechoso: 'SI',
      comentarios: 'riesgo',
      monto_desembolsado: '',
      fecha_aprobacion: '',
      reporte_manual: null,
    },
    {
      operacion_id: 'OP-000003',
      estado: 'aprobada',
      motivo_rechazo: '',
      score: '55',
      score_minimo_perfil: '40',
      flag_sospechoso: 'SI',
      comentarios: 'riesgo alto',
      monto_desembolsado: '',
      fecha_aprobacion: '2024/03/10',
      reporte_manual: {},
    },
  ];

  const result = await validateDataset(dataset, definition, context);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'operacion_id'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'motivo_rechazo'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'score'));
  assert.ok(result.errors.some((err) => err.row === 2 && err.column === 'comentarios'));
  assert.ok(result.errors.some((err) => err.row === 3 && err.column === 'monto_desembolsado'));
  assert.ok(result.errors.some((err) => err.row === 3 && err.column === 'fecha_aprobacion'));
  assert.ok(result.errors.some((err) => err.row === 3 && err.column === 'reporte_manual'));
});

