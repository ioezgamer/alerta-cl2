# Alerta Clima Limon 2

Sitio web comunitario para consultar clima real, alertas derivadas de pronostico, reportes ciudadanos pendientes y estado por comunidad en Limon 2, Tola, Rivas, Nicaragua.

## Datos reales

- Clima y pronostico: Open-Meteo Forecast API.
- Coordenadas: configuradas por comunidad en `data/locations.ts`.
- Alertas: generadas automaticamente desde lluvia, probabilidad de lluvia, rafagas y codigos WMO devueltos por Open-Meteo.
- Reportes ciudadanos: se reciben por `/api/reports` y quedan siempre como `pendiente`.
- Comunidades del formulario: salen de las comunidades base y de las comunidades reportadas por usuarios.
- Nuevas comunidades: el formulario permite seleccionar `Agregar otra comunidad`; al enviar el reporte queda disponible en la sesion y en futuras cargas desde `storage/reports.jsonl`.
- En Netlify, los reportes se guardan en Netlify Blobs, no en el filesystem temporal de la funcion.
- No hay reportes, alertas ni estados comunitarios inventados.

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Produccion

```bash
npm run build
npm start
```

Requisitos:

- Node.js 20.9+ para Next 16.
- Netlify con `@netlify/plugin-nextjs` para funciones Next y Netlify Blobs.
- Permiso de escritura en `storage/` solo para desarrollo local fuera de Netlify.
- Opcional: `REPORT_WEBHOOK_URL` para enviar reportes a un webhook externo.

## Reportes ciudadanos

La ruta `POST /api/reports` valida:

- comunidad permitida;
- tipo de reporte permitido;
- nivel percibido permitido;
- descripcion entre 12 y 800 caracteres;
- nombre opcional hasta 80 caracteres.

En desarrollo local o VPS/Node, guarda cada reporte como JSON Lines en `storage/reports.jsonl`.

En Netlify, guarda los reportes en un store site-scoped de Netlify Blobs llamado `alerta-clima-reports`.

Opcionalmente tambien puedes configurar:

```env
REPORT_WEBHOOK_URL=https://tu-webhook.example/reportes
```

Ese webhook puede apuntar a un panel propio, Google Apps Script, Make/Zapier, Supabase Edge Function u otro backend.

## Estructura

- `app/`: layout, pagina principal y API de reportes.
- `components/`: componentes UI reutilizables.
- `data/locations.ts`: comunidades y coordenadas reales configurables.
- `services/openMeteoService.ts`: integracion con Open-Meteo y calculo de alertas.
- `services/weatherService.ts`: capa de datos de la pagina y envio de reportes.
- `services/reportStorage.ts`: lectura de reportes guardados y comunidades aprendidas.
- `services/reportClient.ts`: envio del formulario desde el navegador.
- `types/`: tipos del dominio comunitario.
- `utils/`: formateo, etiquetas, opciones de reportes y clases visuales.
- `storage/`: bandeja local de reportes pendientes; los `.jsonl` no se versionan.

## Seguridad

- Los reportes ciudadanos nunca se publican como verificados automaticamente.
- Los reportes entrantes se validan y se guardan como pendientes.
- `npm audit` queda en 0 vulnerabilidades.
- Next se actualizo a la linea 16 y se fuerza `postcss` parcheado con `overrides`.

## Fuentes

- Open-Meteo: https://open-meteo.com/
- Documentacion Forecast API: https://open-meteo.com/en/docs
