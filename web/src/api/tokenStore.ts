const PERSIST_KEY = "quickapp.auth.token"
const SESSION_KEY = "quickapp.auth.token.session"

export type TokenStore = {
  get: () => string | null
  set: (token: string, rememberMe: boolean) => void
  clear: () => void
}

/** Persist across reloads (remember) vs tab session only (session-only). */
export function createBrowserTokenStore(
  local: Storage = globalThis.localStorage,
  session: Storage = globalThis.sessionStorage,
): TokenStore {
  return {
    get() {
      return local.getItem(PERSIST_KEY) ?? session.getItem(SESSION_KEY)
    },
    set(token, rememberMe) {
      local.removeItem(PERSIST_KEY)
      session.removeItem(SESSION_KEY)
      if (rememberMe) {
        local.setItem(PERSIST_KEY, token)
      } else {
        session.setItem(SESSION_KEY, token)
      }
    },
    clear() {
      local.removeItem(PERSIST_KEY)
      session.removeItem(SESSION_KEY)
    },
  }
}
