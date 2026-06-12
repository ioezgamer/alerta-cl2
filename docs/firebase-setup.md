# Configuración Firebase

Este proyecto usa Firebase en el camino de producción:

- Firestore para reportes y comunidades.
- Firebase Authentication para el panel administrativo.

## 1. Crear proyecto

1. Cree un proyecto en Firebase.
2. Active Firestore Database.
3. Active Authentication con proveedor `Email/Password`.
4. Cree el usuario administrador desde Firebase Authentication.

## 2. Variables de entorno

Configure estas variables en Netlify y en `.env.local` si prueba localmente:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 3. Reglas

Publique el contenido de `firestore.rules` en Firestore Rules.

Después cree manualmente este documento:

```text
admins/{correo-del-admin}
```

Ejemplo:

```text
admins/admin@tudominio.com
```

Puede dejar el documento vacío. La regla solo verifica que exista.

## 4. Flujo

- Cualquier visitante puede crear reportes. Siempre entran como `pendiente`.
- Cualquier visitante puede leer reportes y comunidades publicados.
- Solo usuarios autenticados cuyo correo exista en `admins/{email}` pueden verificar, descartar, eliminar reportes o gestionar comunidades.

## 5. Panel

Abra:

```text
/admin
```

Inicie sesión con el correo y contraseña creados en Firebase Authentication.
