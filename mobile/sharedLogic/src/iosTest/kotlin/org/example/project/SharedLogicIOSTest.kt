package org.example.project

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class SharedLogicIOSTest {

    @Test
    fun apiBaseUrlPointsAtLocalhost() {
        assertEquals("http://localhost:8080", apiBaseUrl())
    }

    @Test
    fun platformTokenStoreHonorsRememberFlag() {
        val store = platformTokenStore()
        store.clearToken()

        store.saveToken("remembered", rememberMe = true)
        assertEquals("remembered", store.getToken())

        store.clearToken()
        store.saveToken("session-only", rememberMe = false)
        assertEquals("session-only", store.getToken())

        store.clearToken()
        assertNull(store.getToken())
    }
}
