/**
 * Backend origin for API calls.
 * - Dev default: same origin (Vite proxies `/api` → localhost:8080)
 * - Prod / preview builds: require `VITE_API_BASE_URL` (Render Static Site)
 */

export type ResolveApiBaseUrlInput = {
  viteApiBaseUrl: string | undefined
  isDev: boolean
}

/**
 * Resolves the API origin. Exported for unit tests.
 * @throws if not in DEV and `VITE_API_BASE_URL` is missing/blank
 */
export function resolveApiBaseUrl({
  viteApiBaseUrl,
  isDev,
}: ResolveApiBaseUrlInput): string {
  const trimmed = viteApiBaseUrl?.trim()
  if (trimmed) {
    return normalizeBaseUrl(trimmed)
  }
  if (isDev) {
    return ""
  }
  throw new Error(
    "VITE_API_BASE_URL must be set for production builds (e.g. https://your-api.onrender.com). " +
      "Local `npm run dev` may leave it unset so Vite can proxy /api.",
  )
}

export const apiBaseUrl = resolveApiBaseUrl({
  viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  isDev: import.meta.env.DEV,
})

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "")
}
