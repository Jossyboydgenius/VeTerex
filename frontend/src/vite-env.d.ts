/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEPIN_APP_ID: string;
  readonly VITE_WEPIN_APP_KEY: string;
  readonly VITE_VERY_PROJECT_ID: string;
  readonly VITE_DEFAULT_NETWORK: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_VERY_API_BASE: string;
  readonly VITE_VETEREX_PROXY_ADDRESS: string;
  readonly VITE_VETEREX_IMPLEMENTATION_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
