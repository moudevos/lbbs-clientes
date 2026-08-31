# LBBS Clientes

Portal independiente de clientes para identidad digital y Rewards. No importa rutas, helpers ni sesiones de empleados del dashboard.

## Desarrollo

1. Copia `.env.example` a `.env.local` y configura el proyecto Supabase compartido.
2. Usa `NEXT_PUBLIC_CUSTOMER_APP_URL=http://clientes.localhost:3001`.
3. Ejecuta `npm run dev`.

Rutas de Fase 1: `/login`, `/auth/callback`, `/registro`, `/vincular` y `/rewards`.

El callback de Google siempre usa `${NEXT_PUBLIC_CUSTOMER_APP_URL}/auth/callback`; no acepta rutas de dashboard ni recuperación de contraseña.
