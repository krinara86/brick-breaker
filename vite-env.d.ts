/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HF_API_KEY: string;
  readonly VITE_HF_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
