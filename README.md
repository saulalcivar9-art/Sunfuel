# SUN Fuel · SUNCHODESA REPRESENTACIONES

**Versión inicial v0.1 · PWA para iPhone, desarrollada desde Windows.**

## Paso 1 — Abrir en Windows

1. Instala **Visual Studio Code**: https://code.visualstudio.com/
2. Descomprime `SUNFUEL_PWA_INICIO.zip` en una carpeta de tu PC.
3. En VS Code: **Archivo → Abrir carpeta…** y selecciona la carpeta `sunchodesa-pwa`.
4. En **Extensiones** de VS Code instala **Live Server** (Ritwick Dey).
5. Abre `index.html`, haz clic derecho y selecciona **Open with Live Server**.
6. En Windows se abrirá el navegador en una URL local, habitualmente `http://127.0.0.1:5500`. La aplicación no necesita Node.js ni instalar librerías para ejecutarse.

> No abras `index.html` haciendo doble clic mediante `file://`: los módulos de JavaScript y la funcionalidad PWA necesitan un servidor web.

## Paso 2 — Usar desde el iPhone

Para instalarla como app en el iPhone necesitas publicar los archivos en un **hosting HTTPS**. Puedes usar **GitHub Pages** (sin Mac): crea un repositorio, sube todos los archivos manteniendo las carpetas, y en Settings → Pages selecciona publicar desde la rama principal y la carpeta raíz. Usa el enlace `https://...github.io/.../` que te asigne el servicio.

Después abre la URL desde **Safari en el iPhone** → botón **Compartir** → **Añadir a pantalla de inicio** → Añadir. Se verá sin la barra habitual del navegador y su estructura básica funcionará sin conexión después de cargarla e instalarse. Las acciones que dependan de Internet no funcionarán sin red (en esta versión no hay integraciones remotas).

No hace falta Mac para desarrollar o publicar esta PWA; sí sería necesario un entorno Apple específico si en el futuro quisieras compilar una app nativa para App Store.

## Árbol de archivos

```text
sunchodesa-pwa/
├── index.html               # Pantalla principal + navegación
├── manifest.webmanifest     # Metadatos de instalación en iPhone
├── sw.js                    # Archivos en caché para trabajar offline
├── package.json             # Tests (opcional; sin dependencias)
├── css/
│   └── styles.css           # Identidad visual oscura y animaciones
├── js/
│   ├── app.js               # Interfaz, eventos y pestañas
│   ├── data.js              # Generadores, capacidades y valores iniciales
│   ├── engine.js            # Cálculos independientes de la interfaz
│   ├── charts.js            # Gráficas ligeras, sin librerías externas
│   └── storage.js           # Guardado local, exportación e importación
├── assets/
│   └── icons/
│       ├── favicon.svg
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
└── tests/
    └── engine.test.js
```

## Funciones de la versión 0.1

- **Inicio**: indicadores generales, consumos y alertas de reserva.
- **Simular**: 1–3 generadores, carga independiente 25/50/75/100%, duración, consumo y costo Premium vs. G2. Incluye gráfica por generador y comparación de combustible.
- **CNEL**: tasa USD/kWh editable, kWh medidos opcionales o estimación por kVA × factor de potencia × carga × horas; compara compensación teórica frente al gasto en diésel.
- **Reservas**: dos reservorios de 660 gal, cinco IVT de 250 gal; adicionalmente dos tanques de generador de 900 L y uno de 600 L. Cada uno admite nivel vacío/mitad/lleno o porcentaje. Calcula autonomía y punto de pedido por tiempo de entrega y margen de seguridad.
- **Tanqueadas**: transferencias manuales de reserva a un tanque de generador con control de cantidades y registro histórico; registro independiente de jornadas y consumo estimado.
- **Ajustes**: precios editables, valores de CNEL, curvas de consumo de cada equipo, copia de seguridad JSON y restauración.
- **Modo oscuro**: amarillo para combustible, azul para energía, rojo para advertencias, verde para margen positivo.

### Fuentes y limitaciones del modelo

- GEN-03 LEES Cummins KTA38-G: al 25/50/75/100% = 94/157/221/289 litros por hora (ficha técnica del equipo); convertidos a galones estadounidenses.
- GEN-01 y GEN-02 de 500 kVA: 20 gal/h al 75%, **referencia operativa informada**, no curva oficial. Para otros porcentajes sin datos se utiliza extrapolación proporcional **orientativa**, lo que puede diferir del consumo real. En Ajustes se pueden sustituir por datos medidos.
- kWh estimados = kVA de placa × FP (0,8) × porcentaje de carga × horas. Si hay contador de energía, ingresar el dato medido. **La compensación teórica no es una confirmación del monto que CNEL reconoce o paga.**
- El cálculo Premium/G2 solo modifica el costo por galón; **no verifica compatibilidad técnica del G2** ni modela cambios de eficiencia, filtros o aditivos.
- Los depósitos nuevos aparecen como **sin dato**; es necesario indicar sus niveles reales. La capacidad nominal de reserva es 2570 gal, pero no significa que existan 2570 gal almacenados.
- Las tanqueadas descuentan el volumen del origen e incrementan el destino. **Las jornadas no descuentan combustible automáticamente**: los saldos dependen de actualizaciones físicas o transferencias registradas. Esto evita simular equivocadamente flujo automático que aún no está conectado.
- Este prototipo no tiene usuarios, conexión con CNEL, sincronización cloud, telemetría ni bases de datos remotas. **No usar como registro único de combustible sin respaldos y conciliación física.**

## Próxima fase recomendada

1. Registrar operaciones diarias por generador con inicio/fin, medidor (kWh), combustible inicial/final y tanqueadas, evitando doble conteo.
2. Calcular autonomía y **eventos de recarga al 50%** incluyendo tiempo de bombeo y volumen real disponible.
3. Gráficas de históricos: gal/h, gal/kWh, costo/kWh, proyección de pedidos y compensación.
4. Sincronizar multiusuario con autenticación y un backend, conservar auditoría y copias de seguridad.

## Verificación opcional de cálculos

Si tienes Node.js: ejecuta `npm test` desde la carpeta del proyecto.

## Publicación y actualizaciones

Los cambios a `sw.js` requieren actualizar la versión del caché para forzar el reemplazo de archivos offline. Publica una versión validada y usa respaldo antes de cambiar estructura de datos.
