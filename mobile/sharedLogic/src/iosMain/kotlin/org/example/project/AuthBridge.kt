package org.example.project

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Swift-facing bridge for parent auth on iPad.
 *
 * No constructor parameters — Kotlin/Native does not export a usable Swift
 * `init()` when the primary constructor has default arguments.
 */
class AuthBridge {
    private val client = AuthClient.create()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    fun getStoredToken(): String? = client.getStoredToken()

    fun register(
        email: String,
        password: String,
        rememberMe: Boolean,
        onSuccess: (email: String) -> Unit,
        onError: (String) -> Unit,
    ) {
        scope.launch {
            try {
                val auth = client.register(email, password, rememberMe)
                onSuccess(auth.user.email)
            } catch (e: Throwable) {
                onError(e.message ?: "Registration failed")
            }
        }
    }

    fun login(
        email: String,
        password: String,
        rememberMe: Boolean,
        onSuccess: (email: String) -> Unit,
        onError: (String) -> Unit,
    ) {
        scope.launch {
            try {
                val auth = client.login(email, password, rememberMe)
                onSuccess(auth.user.email)
            } catch (e: Throwable) {
                onError(e.message ?: "Sign in failed")
            }
        }
    }

    fun logout(
        onSuccess: () -> Unit,
        onError: (String) -> Unit,
    ) {
        scope.launch {
            try {
                client.logout()
                onSuccess()
            } catch (e: Throwable) {
                onError(e.message ?: "Sign out failed")
            }
        }
    }

    fun restoreSession(
        onSignedIn: (email: String) -> Unit,
        onSignedOut: () -> Unit,
    ) {
        scope.launch {
            if (client.getStoredToken() == null) {
                onSignedOut()
                return@launch
            }
            try {
                val user = client.me()
                onSignedIn(user.email)
            } catch (_: Throwable) {
                onSignedOut()
            }
        }
    }
}
