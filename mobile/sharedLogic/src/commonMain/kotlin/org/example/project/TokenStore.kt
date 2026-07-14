package org.example.project

interface TokenStore {
    fun getToken(): String?

    fun saveToken(token: String, rememberMe: Boolean)

    fun clearToken()
}

class InMemoryTokenStore : TokenStore {
    private var token: String? = null

    override fun getToken(): String? = token

    override fun saveToken(token: String, rememberMe: Boolean) {
        this.token = token
    }

    override fun clearToken() {
        token = null
    }
}

expect fun platformTokenStore(): TokenStore
