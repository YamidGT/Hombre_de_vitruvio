# Hombre de Vitruvio

Web app que mide tus proporciones corporales (a partir de una foto o de la cámara en vivo) y las compara con los ideales clásicos de Vitrubio, dibujando el círculo y cuadrado al estilo del boceto de Da Vinci sobre tu propia foto.

Todo el procesamiento corre en el navegador (detección de pose vía MediaPipe) — ninguna foto ni video sale de tu computadora.

## Uso

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto `http://localhost:5173`).

- **Foto fija**: subí o arrastrá una foto de cuerpo completo, de frente, con brazos y piernas extendidos.
- **Cámara en vivo**: dale permiso a la cámara y las medidas se recalculan en tiempo real sobre el video.

## Otros comandos

```bash
npm run test      # corre los tests unitarios (Vitest)
npm run build     # type-check + build de producción
npm run sync-wasm # vuelve a copiar los archivos WASM de MediaPipe a public/wasm (se corre solo tras npm install)
```

## Limitaciones

Es una medición 2D a partir de una sola cámara, así que hay margen de error por escorzo, ángulo de cámara, ropa holgada y oclusiones. La app avisa cuándo una medida no pudo calcularse con confianza en vez de mostrar un valor inventado. Ver el panel "¿Qué tan preciso es esto?" dentro de la app para el detalle completo.
