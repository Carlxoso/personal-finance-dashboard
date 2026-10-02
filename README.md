# Personal Finance Dashboard

Aplicación web para llevar las finanzas personales: cuentas, ingresos, gastos, transferencias, metas de ahorro, estadísticas y reportes.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| **Lenguaje** | TypeScript |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, jsPDF |
| **Backend** | Node.js, Express, Prisma, Zod |
| **Base de datos** | PostgreSQL |
| **Seguridad** | Argon2, JWT en cookie HttpOnly, Helmet |
| **Pruebas** | Vitest, Supertest |

## Funciones principales

- Inicio de sesión con roles (administrador y usuario)
- Cuentas, categorías y movimientos (ingreso, gasto, transferencia y ahorro)
- Metas de ahorro con progreso
- Estadísticas y gráficos por período
- Reportes en PDF y exportación a CSV
- Notificaciones de saldo y metas

## Estructura

```
backend/    API REST, modelo de datos (Prisma) y pruebas
frontend/   Interfaz en React
```

## Propiedad

Proyecto personal de **Moreira Carlos**. Todos los derechos reservados.
