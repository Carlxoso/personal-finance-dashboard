# Finanzas personales
Requisitos: Node 20+, PostgreSQL.
1. `cp .env.example backend/.env` y completa los valores.
2. `cd backend && npm i && npx prisma migrate dev && npm run dev`
3. `cd frontend && npm i && npm run dev` → http://localhost:5173

Modelo de saldo (única fuente de verdad, en `backend/src/services/balance.service.ts`):
saldo = saldo inicial + ingresos − gastos + transferencias recibidas − transferencias enviadas.
`SAVING` aparta dinero para una meta sin cambiar el patrimonio; el progreso de una meta es la suma de sus movimientos `SAVING`.
Montos: NUMERIC(14,2), viajan como string y se operan con Decimal.
