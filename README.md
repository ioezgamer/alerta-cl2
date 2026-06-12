# Alerta Clima Limón 2

Sitio web comunitario para consultar clima real, alertas derivadas de pronóstico, reportes ciudadanos pendientes y estado por comunidad en Limón 2, Tola, Rivas, Nicaragua.

## Datos reales

- Clima y pronóstico: Open-Meteo Forecast API.
- Coordenadas: configuradas por comunidad en `data/locations.ts`.
- Alertas: generadas automáticamente desde lluvia, probabilidad de lluvia, ráfagas y códigos WMO devueltos por Open-Meteo.
- Base de datos principal: Firebase Firestore.
- Panel administrativo: `/admin`, con Firebase Authentication.
- Reportes ciudadanos: se reciben por `/api/reports` y quedan siempre como `pendiente`.
- Comunidades del formulario: salen de las comunidades base y de las comunidades reportadas por usuarios.
- Nuevas comunidades: el formulario permite seleccionar `Agregar otra comunidad`; al enviar el reporte queda disponible en la sesión y en futuras cargas desde el almacenamiento.
- Si Firebase no está configurado, el proyecto conserva respaldo local/Netlify Blobs para desarrollo, pero producción debe usar Firestore.
- No hay reportes, alertas ni estados comunitarios inventados.

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Producción

```bash
npm run build
npm start
```

Requisitos:

- Node.js 20.9+ para Next 16.
- Firebase configurado con Firestore y Authentication.
- Netlify con las variables `NEXT_PUBLIC_FIREBASE_*`.
- Permiso de escritura en `storage/` solo para desarrollo local fuera de Netlify.
- Opcional: `REPORT_WEBHOOK_URL` para enviar reportes a un webhook externo.

## Reportes ciudadanos

La ruta `POST /api/reports` valida:

- comunidad;
- tipo de reporte permitido;
- nivel percibido permitido;
- descripción entre 12 y 800 caracteres;
- nombre opcional hasta 80 caracteres.

Los reportes quedan en estado `pendiente` hasta que un administrador entre a `/admin` y los cambie a `verificado` o `descartado`.

Con Firebase configurado, guarda cada reporte en la colección `reports`.

En desarrollo local sin Firebase, guarda cada reporte como JSON Lines en `storage/reports.jsonl`.

En Netlify sin Firebase, puede usar Netlify Blobs como respaldo temporal, pero no es el camino recomendado para producción.

Opcionalmente también puedes configurar:

```env
REPORT_WEBHOOK_URL=https://tu-webhook.example/reportes
```

Ese webhook puede apuntar a un panel propio, Google Apps Script, Make/Zapier, Supabase Edge Function u otro backend.

## Estructura

- `app/`: layout, página principal y API de reportes.
- `components/`: componentes UI reutilizables.
- `data/locations.ts`: comunidades y coordenadas reales configurables.
- `services/openMeteoService.ts`: integración con Open-Meteo y cálculo de alertas.
- `services/weatherService.ts`: capa de datos de la página y envío de reportes.
- `services/reportStorage.ts`: lectura de reportes guardados y comunidades aprendidas.
- `services/communityStorage.ts`: lectura de comunidades agregadas desde el panel.
- `services/reportClient.ts`: envío del formulario desde el navegador.
- `types/`: tipos del dominio comunitario.
- `utils/`: formateo, etiquetas, opciones de reportes y clases visuales.
- `storage/`: bandeja local de reportes pendientes; los `.jsonl` no se versionan.

## Seguridad

- Los reportes ciudadanos nunca se publican como verificados automáticamente.
- Los reportes entrantes se validan y se guardan como pendientes.
- La administración usa Firebase Auth y reglas de Firestore, no una contraseña compartida.
- `npm audit` queda en 0 vulnerabilidades.
- Next se actualizó a la línea 16 y se fuerza `postcss` parcheado con `overrides`.

## Firebase

Revise `docs/firebase-setup.md` y publique `firestore.rules`.

## Fuentes

- Open-Meteo: https://open-meteo.com/
- Documentación Forecast API: https://open-meteo.com/en/docs
