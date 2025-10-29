# csv-rule-validator

Librería ligera para validar datasets en formato CSV o JSON mediante reglas declarativas. Permite describir validaciones campo a campo usando archivos JSON y enlazarse con lógica de negocio externa para escenarios avanzados.

## Instalación

```bash
npm install
```

## Uso básico

```js
import { readFileSync } from 'fs';
import { validateDataset } from 'csv-rule-validator';

const csv = readFileSync('./clientes.csv', 'utf8');
const definition = JSON.parse(readFileSync('./configs/basic-onboarding.json', 'utf8'));

const resultado = await validateDataset(csv, definition);

if (!resultado.valid) {
  console.table(resultado.errors);
}
```

## Definiciones en JSON

Cada archivo de configuración describe reglas por columna y validaciones de fila opcionales:

```json
{
  "columns": {
    "dni": {
      "rules": [
        { "type": "required" },
        { "type": "string", "length": 8 },
        { "type": "number", "integer": true }
      ]
    },
    "email": {
      "rules": [
        { "type": "required" },
        {
          "type": "string",
          "pattern": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
          "message": "El email no tiene un formato válido"
        }
      ]
    }
  }
}
```

### Validaciones disponibles

- `required`: verifica que exista un valor.
- `string`: longitudes mínimas/máximas, coincidencia de patrón, mayúsculas/minúsculas.
- `number`: admite `min`, `max` e `integer`.
- `in`: asegura que el valor pertenezca a un listado.
- `compare`: compara el valor con otro campo o constante (`operator`: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `contains`, `startsWith`, `endsWith`).
- `requiredIf`: vuelve obligatorio un campo cuando se cumple una condición declarativa (`when`).
- `custom`: delega la validación a funciones externas o personalizadas.

Todas las reglas aceptan:

- `message`: texto a devolver en caso de error.
- `code`: identificador opcional de error.
- `severity`: etiqueta libre (`warning`, `error`, etc.).
- `onlyIf`: condición declarativa para ejecutar la regla sólo en determinados casos.

### Condiciones declarativas (`when`, `onlyIf`)

Las condiciones usan la misma sintaxis tanto en reglas como en `rowValidations`:

- `field`: nombre de la columna a evaluar (`$row.campo` implícito).
- `target`: token explícito (`$value`, `$row.otroCampo`, `$context.algo`).
- Operadores: `equals`, `notEquals`, `in`, `notIn`, `present`, `empty`, `minLength`, `maxLength`, `regex`, `gt`, `gte`, `lt`, `lte`, `truthy`, `falsy`.
- Combinadores lógicos: `all`, `any`, `not`.
- `external`: nombre de un resolver externo que devuelve `true`/`false`.

### Validaciones por fila

Además de las reglas por columna, podés describir `rowValidations` para ejecutar múltiples afirmaciones cuando la fila cumple cierta condición:

```json
{
  "rowValidations": [
    {
      "when": { "field": "estado", "equals": "aprobada" },
      "assertions": [
        { "column": "monto_desembolsado", "rule": { "type": "required" } },
        { "column": "fecha_aprobacion", "rule": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" } }
      ]
    }
  ]
}
```

## Integración con lógica de negocio

La clave `custom` permite referenciar funciones declaradas en `context.resolvers`. Cada resolver recibe `(value, row, context, rule, args)` y puede devolver:

- `true` si la validación es exitosa.
- `false` para usar el mensaje configurado en la regla.
- Un `string` con el mensaje de error.
- Un objeto `{ valid: boolean, message?: string, meta?: any }` para enviar metadata adicional.

Ejemplo:

```js
const context = {
  resolvers: {
    async dniExisteEnCore(value) {
      const existe = await clientesService.existe(value);
      return existe || 'El DNI no figura en el core';
    }
  }
};
```

## Configuraciones de ejemplo

Se incluyen varios escenarios en la carpeta [`configs/`](./configs):

- [`basic-onboarding.json`](./configs/basic-onboarding.json): reglas esenciales para altas.
- [`dependent-benefits.json`](./configs/dependent-benefits.json): dependencias entre columnas y validaciones de fila.
- [`external-checks.json`](./configs/external-checks.json): integración con sistemas externos.
- [`advanced-risk.json`](./configs/advanced-risk.json): escenarios complejos con múltiples condiciones combinadas.

## Ejecutar el ejemplo

```bash
node example.js
```

El script carga la configuración `external-checks.json`, simula resolvers externos y muestra los errores detectados.
