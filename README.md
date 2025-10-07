# Alerta Clima Limon 2 (Next.js + Firebase)

## Requisitos

- Node 18+
- Cuenta de Firebase (Firestore habilitado)
- Netlify CLI (opcional para probar deploy local)

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env.local` con:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_APP_ID=default-app-id
# Opcional si usas auth con token personalizado desde tu backend
NEXT_PUBLIC_INITIAL_AUTH_TOKEN=
```

## Ejecutar en desarrollo

```bash
npm run dev
```

## Build de producción

```bash
npm run build && npm start
```

## Despliegue en Netlify

1. Conecta el repo en Netlify.
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Instala el plugin `@netlify/plugin-nextjs` (ya definido en `netlify.toml`).
5. Configura las variables de entorno en Netlify (las mismas de `.env.local`).

## Estructura

- `app/page.tsx`: UI principal con alertas en tiempo real y formulario.
- `lib/firebase.ts`: Inicialización de Firebase y autenticación anónima o token.
- `components/Icons.tsx`: Iconos por tipo de alerta.
- `app/globals.css`: Tailwind + estilos.

## Firestore

Colección usada: `/artifacts/${NEXT_PUBLIC_APP_ID}/public/data/alerts`
Documento contiene: `comunidad`, `tipo`, `detalles`, `timestamp`.

