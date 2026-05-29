@AGENTS.md

# Gym Converter — Contexto del proyecto

App personal para Android que convierte pesos entre libras y kilos durante entrenamientos de gimnasio.

## Stack
- Expo SDK 54 (`~54.0.34`)
- React 19.1 / React Native 0.81.5
- TypeScript 5.9 (strict)
- New Architecture habilitada (`newArchEnabled: true`)
- Pruebas con Expo Go usando tunnel

## Archivos importantes
- `index.ts` — entry point, registra el componente raíz
- `App.tsx` — componente principal (toda la lógica vive aquí)
- `app.json` — configuración de Expo (portrait, Android, edgeToEdge)
- `tsconfig.json` — strict mode

## Restricciones
- Sin backend, login, ni base de datos
- Sin internet
- Sin navegación compleja
- Sin librerías UI externas
- No cambiar configuración de Expo salvo que sea necesario
- No leer node_modules salvo necesidad estricta

## Fórmulas de conversión
- kg = lb × 0.45359237
- lb = kg × 2.2046226218
- Resultado redondeado a 2 decimales

## Botones rápidos
- Libras: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100
- Kilos: 2.5, 5, 10, 15, 20, 25, 30, 40, 50
