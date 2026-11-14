/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RUM_SAMPLE_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
