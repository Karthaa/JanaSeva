/// <reference types="vite/client" />

// Vite worker URL import for MapLibre GL JS v6
declare module 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url' {
  const workerUrl: string;
  export default workerUrl;
}
