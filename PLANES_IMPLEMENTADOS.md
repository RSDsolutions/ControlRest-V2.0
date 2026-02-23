# Detalle de Planes Implementados - RESTOGESTIÓN V2.0

Este documento detalla la estructura de funcionalidades, permisos y restricciones de los planes actuales del sistema ERP.

---

## 1. Plan 1: Plan Operativo (`PLAN_OPERATIVO`)
**Enfoque**: Gestión básica del flujo de servicio y control de inventario físico.

### Características y Funciones:
*   **Punto de Venta (POS)**: Acceso completo para meseros (toma de pedidos, gestión de mesas).
*   **Gestión de Cocina**: Monitor de pedidos en tiempo real y cambio de estados.
*   **Caja Básica**: Cobro de órdenes y cierre de turno.
*   **Catálogo de Insumos**: Creación de ingredientes y unidades de medida.
*   **Recetario (Escandallos)**: Configuración de recetas para descuento automático de stock.
*   **Inventario Físico**: Control de existencias actuales por cantidad (gr/ml).

### Vistas Disponibles:
*   `WaiterView`: Toma de pedidos.
*   `KitchenView`: Preparación.
*   `CashierView`: Cobros.
*   `IngredientsView`: Catálogo.
*   `PlatesView`: Gestión de menú.

### Restricciones (BLOQUEADO):
*   **Rentabilidad Neta**: No calcula utilidad más allá del margen bruto.
*   **Gastos**: Sin módulo de gastos operativos (Nómina, Alquiler).
*   **Inteligencia**: Sin alertas de ahorro o anomalías.
*   **Mermas**: El reporte de mermas no impacta financieramente, solo descuenta stock técnico.
*   **PDF**: No permite exportar fichas técnicas.

---

## 2. Plan 2: Plan Control (`PLAN_CONTROL`)
**Enfoque**: Control financiero de la operación y optimización de costos.

### Características y Funciones (Incluye Plan 1 +):
*   **Análisis de Rentabilidad**: Cálculo en tiempo real de la utilidad neta integrando ventas, costos de recetas y gastos.
*   **Módulo de Gastos (OPEX)**: Registro y categorización de gastos fijos y variables.
*   **Impacto de Mermas**: Cálculo del valor monetario de las pérdidas registradas en cocina.
*   **Motor de Inteligencia**: Detección de anomalías en gastos y alertas de eficiencia operativa.
*   **Exportación PDF**: Generación de fichas técnicas profesionales y reportes de inventario.

### Vistas Disponibles (Incluye Plan 1 +):
*   `ExpensesView`: Tablero de control de egresos.
*   `WasteView`: Control administrativo de desperdicios.
*   `IntelligenceDashboardView`: Centro de alertas inteligentes.
*   `FinanceView`: Estados de resultados pro-forma.

### Restricciones / Refinamientos:
*   **Usuarios**: Los roles y sucursales de los usuarios están bloqueados para edición manual para mantener la integridad de los datos.
*   **Cuentas por Pagar**: Sin gestión de facturas a crédito con proveedores.
*   **Auditoría**: Sin seguimiento de acciones (Audit Log).
*   **Lotes**: Sin trazabilidad histórica de costos por lote al momento de la venta.

---

## 3. Plan 3: Plan Multiproductivo (`PLAN_MULTIPRODUCTIVO`)
**Enfoque**: Gestión corporativa, trazabilidad total y cumplimiento administrativo.

### Características y Funciones (Incluye Plan 2 +):
*   **Gestión de Proveedores Pro**: Registro de facturas, números de comprobante e historial de compras.
*   **Cuentas por Pagar (AP)**: Liquidación de deudas con proveedores desde caja.
*   **Trazabilidad FIFO**: Historial detallado de lotes y costos específicos capturados al momento de cada venta.
*   **Auditoría Total (Audit Log)**: Bitácora completa de movimientos sensibles (cambios de precios, ediciones de stock).
*   **Cierres de Periodo**: Bloqueo de fechas contables para evitar alteraciones en balances pasados.
*   **Motor de Simulación**: Herramientas para proyectar escenarios de precios y costos.

### Vistas Disponibles (Incluye Plan 2 +):
*   `SupplierInvoicesView`: Registro de comprobantes fiscales.
*   `AccountsPayableView`: Control de pasivos con proveedores.
*   `AuditLogView`: Rastreo de acciones de usuarios.
*   `AccountingPeriodLocksView`: Blindaje de periodos fiscales.
*   `InventoryBatchesView`: Trazabilidad profunda de lotes.

### Restricciones de Seguridad (Diseño del Plan):
*   **Sucursales**: La configuración de sucursales (crear/eliminar) está restringida para evitar desajustes en la estructura multi-producto.
*   **Gestión de Usuarios**: La creación de nuevos usuarios y el cambio de roles están restringidos como medida de seguridad corporativa para este nivel de suscripción.

---
*Este documento refleja la configuración técnica actual de `usePlanFeatures.ts` y la base de datos de `plan_features`.*
