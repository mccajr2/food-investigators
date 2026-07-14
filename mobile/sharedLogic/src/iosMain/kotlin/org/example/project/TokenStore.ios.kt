package org.example.project

import platform.Foundation.NSUserDefaults

/**
 * Remember-me tokens persist in NSUserDefaults; session-only tokens stay in
 * memory (cleared when the app process ends). Swap for Keychain later without
 * changing AuthClient.
 */
actual fun platformTokenStore(): TokenStore = IosTokenStore()

private class IosTokenStore : TokenStore {
    private var sessionOnlyToken: String? = null
    private val defaults = NSUserDefaults.standardUserDefaults
    private val persistKey = "quickapp.auth.token"

    override fun getToken(): String? = sessionOnlyToken ?: defaults.stringForKey(persistKey)

    override fun saveToken(token: String, rememberMe: Boolean) {
        clearToken()
        if (rememberMe) {
            defaults.setObject(token, persistKey)
        } else {
            sessionOnlyToken = token
        }
    }

    override fun clearToken() {
        sessionOnlyToken = null
        defaults.removeObjectForKey(persistKey)
    }
}
