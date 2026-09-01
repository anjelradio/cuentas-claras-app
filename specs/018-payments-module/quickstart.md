# Quickstart & Validation Guide: Módulo de Pagos

## Prerequisites
- Servidor backend corriendo en `http://localhost:8000`
- Cliente frontend corriendo en `http://localhost:3000`
- Base de datos PostgreSQL con migraciones de Alembic aplicadas

## Escenario de Validación End-to-End

### 1. Migraciones de Base de Datos
```bash
cd app/server
poetry run alembic upgrade head
```

### 2. Pruebas Unitarias y de Integración del Backend
```bash
cd app/server
poetry run pytest tests/modules/payments/ -v
poetry run pytest tests/modules/expenses/ -v
```

### 3. Flujo Manual Deudor -> Pagador
1. **Inicio de sesión como Deudor**:
   - Iniciar sesión con un usuario participante del evento que tenga una cuota en un gasto.
   - Navegar a `/expenses/{expense_id}`.
   - Verificar que se muestra el botón: `Saldar mi parte (Bs. 50.00)` y no los botones de editar o anular.
   - Hacer clic en `Saldar mi parte`.
   - **Caso Efectivo**: Seleccionar "Pagar en efectivo" y confirmar. La cuota cambia a "Por verificar".
   - **Caso QR**: Seleccionar "Pagar con QR", verificar que se muestra el QR del pagador, hacer clic en "Ya pagué", adjuntar imagen de comprobante y pulsar "Enviar comprobante". La cuota cambia a "Por verificar".

2. **Inicio de sesión como Pagador**:
   - Iniciar sesión con el usuario que pagó el gasto original.
   - Navegar a `/expenses/{expense_id}`.
   - Verificar que se muestran los botones "Editar gasto" y "Anular gasto", y NO el botón de saldar deuda.
   - En la sección "Participantes", hacer clic en el participante con estado "Por verificar".
   - Se abre el Bottom Sheet de verificación mostrando la información (y la imagen del comprobante si fue QR).
   - Pulsar "Verificado / Confirmar pago".
   - Verificar que el estado del participante cambia a "Pagado" (verde).
