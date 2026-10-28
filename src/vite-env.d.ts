/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_ROBLOX_GAME_ID: string
  readonly VITE_DISCORD_INVITE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
