package org.example.project

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class UserResponse(
    val id: String,
    val email: String,
    val householdId: String,
)

@Serializable
data class AuthResponse(
    val token: String,
    val user: UserResponse,
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val rememberMe: Boolean = true,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val rememberMe: Boolean = true,
)

@Serializable
data class ErrorMessage(
    val message: String,
)

class AuthException(message: String) : Exception(message)

class AuthClient(
    private val baseUrl: String,
    private val httpClient: HttpClient = createHttpClient(),
    private val tokens: TokenStore = platformTokenStore(),
) {
    fun getStoredToken(): String? = tokens.getToken()

    suspend fun register(
        email: String,
        password: String,
        rememberMe: Boolean = true,
    ): AuthResponse {
        val response =
            httpClient.post("$baseUrl/api/auth/register") {
                contentType(ContentType.Application.Json)
                setBody(RegisterRequest(email, password, rememberMe))
            }
        return storeAuth(response, rememberMe)
    }

    suspend fun login(
        email: String,
        password: String,
        rememberMe: Boolean = true,
    ): AuthResponse {
        val response =
            httpClient.post("$baseUrl/api/auth/login") {
                contentType(ContentType.Application.Json)
                setBody(LoginRequest(email, password, rememberMe))
            }
        return storeAuth(response, rememberMe)
    }

    suspend fun logout() {
        val token = tokens.getToken() ?: return
        val response =
            httpClient.post("$baseUrl/api/auth/logout") {
                header(HttpHeaders.Authorization, "Bearer $token")
            }
        tokens.clearToken()
        if (!response.status.isSuccess() && response.status.value != 401) {
            throw AuthException(readError(response))
        }
    }

    suspend fun me(): UserResponse {
        val token = tokens.getToken() ?: throw AuthException("Not signed in")
        val response =
            httpClient.get("$baseUrl/api/auth/me") {
                header(HttpHeaders.Authorization, "Bearer $token")
            }
        if (!response.status.isSuccess()) {
            if (response.status.value == 401) {
                tokens.clearToken()
            }
            throw AuthException(readError(response))
        }
        return response.body()
    }

    private suspend fun storeAuth(
        response: HttpResponse,
        rememberMe: Boolean,
    ): AuthResponse {
        if (!response.status.isSuccess()) {
            throw AuthException(readError(response))
        }
        val body: AuthResponse = response.body()
        tokens.saveToken(body.token, rememberMe)
        return body
    }

    private val errorJson = Json { ignoreUnknownKeys = true }

    private suspend fun readError(response: HttpResponse): String {
        val text =
            runCatching { response.bodyAsText() }.getOrNull()
                ?: return "Auth failed (${response.status})"
        val parsed =
            runCatching {
                errorJson.decodeFromString(ErrorMessage.serializer(), text)
            }.getOrNull()
        return parsed?.message ?: "Auth failed (${response.status})"
    }

    companion object {
        fun create(
            baseUrl: String = apiBaseUrl(),
            tokens: TokenStore = platformTokenStore(),
        ): AuthClient = AuthClient(baseUrl, createHttpClient(), tokens)
    }
}
