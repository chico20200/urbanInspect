# UrbanInspect

Aplicación móvil para inspectores del Municipio del Distrito Metropolitano de Quito. Permite **consultar, registrar y actualizar incidencias de infraestructura urbana** (luminarias dañadas, baches, señalización deteriorada, alcantarillas obstruidas y daños en parques) desde un dispositivo Android, con evidencia fotográfica, ubicación y condiciones meteorológicas del lugar.

> Prueba I · Práctica — Desarrollo de Aplicaciones Móviles, ESFOT (EPN).

## Tecnologías

| Herramienta | Versión |
| --- | --- |
| Ionic (`@ionic/angular`) | 9.0 |
| Angular (standalone, sin zone.js) | 22.2 |
| Capacitor | 8.6 |
| TypeScript | incluido con Angular |
| Ionic CLI | 7.2 |

## Funcionalidades

| Req. | Funcionalidad | Dónde está |
| --- | --- | --- |
| R1 | Marcar y desmarcar incidencias para seguimiento; la lista se conserva al cerrar la app y nunca se envía a la API | Pestaña **Seguimiento** · `seguimiento.service.ts` |
| R2 | Listado con código, tipo, descripción, dirección, sector, fecha, estado y foto; avisos de lista vacía y de error | Pestaña **Incidencias** · `incidencia-card.component.ts` |
| R3 | Carga progresiva de 5 en 5 pedida al servidor; deja de pedir al agotarse los registros | `incidencias.page.ts` · `incidencias.service.ts` |
| R4 | Clima real en las coordenadas de la incidencia: temperatura, lluvia de la última hora y condición; aviso si supera 5 mm; si falla, informa y permite continuar | `clima.service.ts` · `nueva.page.ts` |
| R5 | Registro con validación de campos obligatorios; prioridad alta exige fotografía | `nueva.page.ts` → `validar()` |
| R6 | Captura y vista previa de la foto; cancelación y permiso denegado manejados | `foto.service.ts` |
| R7 | Coordenadas por GPS o ingreso manual; obligatorias para baches | `ubicacion.service.ts` · `nueva.page.ts` |
| R8 | Recuperación del registro incompleto: al volver, ofrece continuar o descartar | `borrador.service.ts` · `app.component.ts` |
| R9 | Cambio de estado desde el detalle con transiciones válidas y observación obligatoria al resolver | `detalle.page.ts` · `models/incidencia.ts` |
| R10 | Inicio con indicadores, listado, seguimiento, detalle y formulario; datos actualizados al navegar | Todas las páginas |

## Requisitos previos

- Node.js LTS y npm
- Ionic CLI: `npm install -g @ionic/cli`
- Android Studio con el Android SDK (para generar el APK)
- Cuentas gratuitas en [MockAPI](https://mockapi.io) y [Cloudinary](https://cloudinary.com)

## Instalación y ejecución

```bash
git clone <URL_DE_ESTE_REPOSITORIO>
cd urbanInspect
npm install
```

### 1. Configurar los servicios

Editar `src/app/config.ts`:

```ts
export const CONFIG = {
  mockApiUrl: 'https://TU_ID.mockapi.io/api/v1',   // proyecto MockAPI
  cloudinaryCloudName: 'TU_CLOUD_NAME',             // Cloudinary → Cloud name
  cloudinaryUploadPreset: 'TU_PRESET_SIN_FIRMAR',   // Settings → Upload → Upload presets (Unsigned)
  openMeteoUrl: 'https://api.open-meteo.com/v1/forecast',
  pageSize: 5,
  umbralLluviaMm: 5,
};
```

### 2. Crear el servicio de oficina en MockAPI

1. Crear un proyecto con el prefijo `/api/v1`.
2. Crear el recurso **`incidencias`** con los campos: `codigo`, `tipo`, `descripcion`, `direccion`, `sector`, `fecha`, `estado`, `prioridad`, `fotoUrl`, `lat`, `lng`, `observacion`, `climaTemperatura`, `climaPrecipitacion` y `climaDescripcion`.
3. Cargar los datos de prueba (18 incidencias: 4 páginas, los 3 estados, los 5 tipos y las 3 prioridades):

```bash
node seed/seed-incidencias.mjs https://TU_ID.mockapi.io/api/v1
```

### 3. Ejecutar en el navegador

```bash
ionic serve
```

En el navegador, la cámara abre un selector de archivos y el GPS usa la ubicación del navegador. La cámara y la ubicación reales se demuestran en Android.

### 4. Generar el APK

```bash
ionic build
npx cap add android        # solo la primera vez
npx cap sync android
npx cap open android       # Android Studio: Build → Build App Bundle(s) / APK(s) → Build APK(s)
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Permisos agregados en `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

En Linux con Android Studio instalado por snap, indicar la ruta a Capacitor:

```bash
export CAPACITOR_ANDROID_STUDIO_PATH=/snap/bin/android-studio
```

## Servicios externos y dependencias

Cada dependencia adicional está justificada por un requisito.

| Dependencia | Requisito | Justificación |
| --- | --- | --- |
| **MockAPI** (recurso `incidencias`) | R2, R3, R5, R9 | Servicio de oficina simulado con REST completo (GET, POST, PUT) y paginación remota con `page` y `limit` |
| **Open-Meteo** | R4 | API meteorológica real, gratuita y sin clave para uso no comercial. Su variable `hourly.precipitation` es la lluvia acumulada en la hora anterior, que es exactamente lo que pide R4 |
| **Cloudinary** (preset sin firmar) | R6 | Almacena la foto y devuelve una URL pública y permanente, accesible desde el detalle en cualquier dispositivo. El preset sin firmar evita incluir secretos en la app |
| `@capacitor/camera` | R6 | Captura de la foto, solicitud de permiso y detección de la cancelación |
| `@capacitor/geolocation` | R7, R4 | Coordenadas de la incidencia, que también se usan para consultar el clima |
| `@capacitor/preferences` | R1, R8 | Almacenamiento local del seguimiento y del borrador del formulario |

Los plugins `@capacitor/app`, `@capacitor/haptics`, `@capacitor/keyboard` y `@capacitor/status-bar` vienen incluidos en la plantilla base de `ionic start`.

**Por qué Open-Meteo y no otra API de clima:** servicios como OpenWeatherMap exigen una API key, que quedaría expuesta dentro del APK y en el repositorio.

## Decisiones técnicas

### Paginación (R3)
- El listado pide cada grupo al servidor: `GET /incidencias?page=N&limit=5&sortBy=fecha&order=desc`. Nunca se descargan todos los registros para dividirlos en el teléfono.
- **Fin de datos:** cuando una página trae menos de 5 registros, `hasMore` pasa a falso y se deshabilita `ion-infinite-scroll`. No se hacen más peticiones.
- **Lista vacía:** MockAPI puede responder `404 Not found` cuando no hay resultados; el servicio lo convierte en una lista vacía para no confundirlo con un error de red.
- **Sin peticiones simultáneas ni repetidos:** un candado (`loadingMore`) evita pedir dos páginas a la vez, `complete()` se llama siempre en un `finally`, y los registros se filtran por `id` antes de agregarlos.
- **Errores:** si falla una página intermedia, la lista cargada se conserva y aparece un botón "Reintentar".

### Indicadores del inicio (R10)
MockAPI no devuelve el total de registros, así que la pantalla de inicio es la única que pide todas las incidencias para contarlas por estado y prioridad. El listado sigue paginando desde el servidor.

### Clima (R4)
- Se usa la **última hora completa**: la última marca horaria de `hourly.precipitation` que no es futura. No se usa `current.precipitation`, que solo acumula los últimos 15 minutos, ni un valor de pronóstico.
- **Consistencia:** si cambian las coordenadas, el clima mostrado se borra y cualquier respuesta tardía de una consulta anterior se descarta.
- La advertencia por lluvia mayor a 5 mm y el fallo del servicio **no bloquean** el registro: se informa y el inspector decide.
- Sin coordenadas (permitido para tipos distintos de bache) no es posible consultar el clima; la app lo avisa y permite guardar sin datos meteorológicos.
- El clima se guarda con la incidencia, así el detalle muestra las condiciones del momento del registro.

### Fotografía (R5, R6)
- Prioridad alta sin foto: la validación impide guardar antes de hacer cualquier petición.
- Cancelar la cámara no modifica los datos del formulario.
- Permiso denegado: se explica la situación y, si la foto es obligatoria, se impide guardar.
- La foto se sube a Cloudinary y en MockAPI se guarda su URL pública, nunca la ruta temporal del dispositivo.

### Ubicación (R7)
- Coordenadas por GPS con un botón, o ingreso manual validado (latitud −90 a 90, longitud −180 a 180).
- El GPS puede no responder por causas normales (permiso denegado, ubicación desactivada, sin señal); en esos casos se ingresan las coordenadas a mano.
- Para baches la ubicación es obligatoria; para los demás tipos es opcional y siempre se registra la dirección.

### Borrador (R8)
- El formulario se guarda en el dispositivo en cada cambio (con una pausa de 400 ms), no "al salir": si el sistema cierra la app no hay evento de salida que alcance a ejecutarse.
- Al abrir la app o al volver al formulario se ofrece continuar o descartar.
- La foto no se recupera: su ruta es temporal y el sistema puede borrarla.
- El borrador se elimina al guardar la incidencia con éxito.

### Estados (R9)
- Transiciones definidas en una tabla: pendiente → en proceso o resuelta; en proceso → resuelta; resuelta → ninguna.
- Doble control: la interfaz solo ofrece los estados permitidos y el método de guardado vuelve a validar antes del `PUT`.
- Pasar a resuelta exige una observación.

### Seguimiento (R1)
Solo se guardan en el dispositivo los identificadores de las incidencias marcadas. Los datos se piden siempre a la API, para mostrar su estado actual, y nada del seguimiento se envía al servicio de oficina.

## Estructura del proyecto

```text
src/app/
├── config.ts                          URLs y constantes (sin credenciales)
├── models/incidencia.ts               Tipos, transiciones de estado y validación de coordenadas
├── services/
│   ├── incidencias.service.ts         MockAPI: listar (paginado), obtener, crear, cambiar estado
│   ├── clima.service.ts               Open-Meteo: consulta e interpretación
│   ├── foto.service.ts                Cámara y subida a Cloudinary
│   ├── ubicacion.service.ts           GPS y permisos
│   ├── seguimiento.service.ts         Seguimiento local (Preferences)
│   └── borrador.service.ts            Borrador del formulario (Preferences)
├── components/incidencia-card/        Tarjeta compartida con los 8 campos
└── pages/
    ├── tabs/                          Barra de pestañas
    ├── inicio/                        Indicadores
    ├── incidencias/                   Listado con carga progresiva
    ├── seguimiento/                   Incidencias marcadas
    ├── detalle/                       Detalle y cambio de estado
    └── nueva/                         Registro (foto, ubicación, clima, borrador)
seed/seed-incidencias.mjs              Carga de datos de prueba en MockAPI
```

## Casos de prueba

| Caso | Resultado esperado |
| --- | --- |
| Marcar dos incidencias, cerrar la app y volver a abrirla | Ambas siguen en Seguimiento; al desmarcar una desaparece, sin peticiones a la API |
| Consultar el clima de una ubicación | Muestra temperatura, lluvia de la última hora y condición; advierte si supera 5 mm |
| Falla el servicio meteorológico | Informa el error y permite guardar |
| Guardar una incidencia de prioridad alta sin foto | Se impide y se muestra el motivo |
| Registrar un bache sin permiso de ubicación | Se ingresan coordenadas manuales válidas y se usan para el clima |
| Cerrar la app durante el formulario | Al volver, ofrece continuar (con los datos) o descartar |
| Devolver una incidencia resuelta a pendiente | No se ofrece ningún cambio de estado |
| Registrar, verificar en MockAPI y actualizar desde el detalle | El registro aparece en el servicio y refleja el nuevo estado |

## Credenciales

El repositorio no contiene contraseñas ni claves secretas:
- La URL de MockAPI es pública.
- Open-Meteo no requiere clave.
- Cloudinary usa un *upload preset* sin firmar; el API Secret nunca se incluye en la app.

## Capturas

<!-- Agrega tus capturas en docs/ y enlázalas, por ejemplo: ![Inicio](docs/inicio.png) -->

| Inicio | Listado | Seguimiento | Registro | Clima | Detalle |
| --- | --- | --- | --- | --- | --- |
| pendiente | pendiente | pendiente | pendiente | pendiente | pendiente |

## Autor

Nombre del estudiante — Desarrollo de Software, ESFOT · EPN
