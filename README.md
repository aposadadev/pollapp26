# PollApp26 — Quiniela Mundial 2026

Aplicación web (PWA) para gestionar una quiniela del Mundial 2026: grupos (ligas), tablas de usuario, predicciones por partido, y ranking en vivo.

## Stack

- **Frontend:** Nuxt 4 (SPA), Vue 3, Pinia, Nuxt UI, Tailwind CSS 4
- **Backend (BaaS):** Firebase Auth, Firestore, Realtime Database, Cloud Functions v2
- **PWA:** `@vite-pwa/nuxt`
- **Package manager:** pnpm

## Funcionalidades principales

- Registro/inicio de sesión con Firebase Auth
- Creación y unión a grupos mediante código
- Solicitud y activación de boards
- Predicción de marcadores por partido
- Cálculo de puntos y posiciones (ranking)
- Actualización de ranking en tiempo real

## Requisitos

- Node.js 20+
- pnpm 10+
- Proyecto de Firebase configurado

## Setup local

1. Instalar dependencias:

```bash
pnpm install
```

2. Crear variables de entorno:

```bash
cp .env.example .env
```

3. Completar `.env` con tus valores de Firebase:

- `NUXT_PUBLIC_FIREBASE_*` (SDK cliente)
- `NUXT_PUBLIC_FIREBASE_DATABASE_URL` (RTDB)
- `FIREBASE_*` (Admin SDK para scripts de seed)

## Scripts (raíz)

```bash
pnpm dev            # entorno local (http://localhost:3000)
pnpm build          # build de producción
pnpm preview        # preview local del build
pnpm lint           # eslint
pnpm typecheck      # chequeo de tipos Nuxt/TS
pnpm seed           # seed principal
pnpm seed:tournament
pnpm seed:test
pnpm seed:clean
pnpm reset
```

## Cloud Functions (`functions/`)

```bash
pnpm --dir functions build
pnpm --dir functions lint
pnpm --dir functions serve   # emulador (requiere Firebase CLI)
pnpm --dir functions deploy
```

## Estructura del proyecto

```text
app/
  components/      # UI
  composables/     # estado/lógica reactiva
  repositories/    # acceso a datos Firebase
  services/        # lógica de negocio
  stores/          # estado global (Pinia)
  types/           # tipos de dominio

functions/src/
  callables/       # funciones invocables
  triggers/        # triggers Firestore
  services/        # lógica backend

scripts/           # seed/reset y utilidades operativas
```

## Flujo de desarrollo recomendado

1. Levantar app con `pnpm dev`
2. Validar calidad antes de PR:
   - `pnpm lint`
   - `pnpm typecheck`
3. Si cambias Cloud Functions, validar también:
   - `pnpm --dir functions build`
   - `pnpm --dir functions lint`

## Notas

- Este repositorio usa `.env.example` como plantilla.
- No subir `.env` ni credenciales reales al repositorio.
