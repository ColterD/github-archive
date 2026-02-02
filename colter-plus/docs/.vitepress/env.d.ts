// docs/env.d.ts
interface ImportMetaEnv {
    PROD: boolean
    DEV: boolean
    SSR: boolean
    DEV_MOCKS?: boolean
    [key: string]: any
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }