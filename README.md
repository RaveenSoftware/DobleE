# DobleE POS

Sistema de punto de venta y gestión para Granizados DobleE.

## Requisitos
- Node.js 20+
- PostgreSQL

## Instalación local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Sincronizar base de datos
cd backend && npx prisma db push

# Iniciar
npm run dev
```

Frontend corre en `http://localhost:3000` · Backend en `http://localhost:5000`
