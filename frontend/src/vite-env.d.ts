/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PAYSTACK_PUBLIC_KEY: string
  readonly VITE_ADSENSE_PUBLISHER_ID: string
  readonly VITE_ADSENSE_SLOT_HOME_HERO: string
  readonly VITE_ADSENSE_SLOT_HOME_MID: string
  readonly VITE_ADSENSE_SLOT_SEARCH_TOP: string
  readonly VITE_ADSENSE_SLOT_SEARCH_INLINE: string
  readonly VITE_ADSENSE_SLOT_PROFILE_SIDE: string
  readonly VITE_ADSENSE_SLOT_PROFILE_BOT: string
  readonly VITE_ADSENSE_SLOT_FOOTER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
