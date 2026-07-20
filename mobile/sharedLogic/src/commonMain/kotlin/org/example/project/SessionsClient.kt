package org.example.project

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.put
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
data class SessionFoodRequest(
    val foodId: String,
    val familiarity: String,
    val variantNote: String? = null,
)

@Serializable
data class CreateSessionRequest(
    val scheduledOn: String,
    val foods: List<SessionFoodRequest>,
)

@Serializable
data class UpdateSessionRequest(
    val scheduledOn: String,
    val foods: List<SessionFoodRequest>,
)

@Serializable
data class SessionFoodResponse(
    val foodId: String,
    val name: String,
    val iconKey: String,
    val familiarity: String,
    val variantNote: String? = null,
    val position: Int,
    val liked: String? = null,
    val texture: String? = null,
    val temperature: String? = null,
    val smell: String? = null,
    val whyNote: String? = null,
    val changeNote: String? = null,
    val ateEnough: Boolean? = null,
)

@Serializable
data class FoodOutcomeRequest(
    val position: Int,
    val liked: String? = null,
    val texture: String? = null,
    val temperature: String? = null,
    val smell: String? = null,
    val whyNote: String? = null,
    val changeNote: String? = null,
    val ateEnough: Boolean,
)

@Serializable
data class CompleteSessionRequest(
    val foods: List<FoodOutcomeRequest>,
)

@Serializable
data class SessionResponse(
    val id: String,
    val scheduledOn: String,
    val status: String,
    val foods: List<SessionFoodResponse>,
    val createdAt: String,
    val updatedAt: String,
)

class SessionsException(message: String) : Exception(message)

class SessionsClient(
    private val baseUrl: String,
    private val httpClient: HttpClient = createHttpClient(),
    private val tokens: TokenStore = platformTokenStore(),
) {
    suspend fun listUpcoming(): List<SessionResponse> {
        val response = authorizedGet("$baseUrl/api/sessions")
        if (!response.status.isSuccess()) {
            throw SessionsException(readError(response))
        }
        return response.body()
    }

    suspend fun get(sessionId: String): SessionResponse {
        val response = authorizedGet("$baseUrl/api/sessions/$sessionId")
        if (!response.status.isSuccess()) {
            throw SessionsException(readError(response))
        }
        return response.body()
    }

    suspend fun create(request: CreateSessionRequest): SessionResponse {
        val response =
            httpClient.post("$baseUrl/api/sessions") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(request)
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw SessionsException(readError(response))
        }
        return response.body()
    }

    suspend fun update(
        sessionId: String,
        request: UpdateSessionRequest,
    ): SessionResponse {
        val response =
            httpClient.put("$baseUrl/api/sessions/$sessionId") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(request)
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw SessionsException(readError(response))
        }
        return response.body()
    }

    suspend fun cancel(sessionId: String): SessionResponse {
        val response =
            httpClient.post("$baseUrl/api/sessions/$sessionId/cancel") {
                header(HttpHeaders.Authorization, bearerOrThrow())
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw SessionsException(readError(response))
        }
        return response.body()
    }

    suspend fun complete(
        sessionId: String,
        request: CompleteSessionRequest,
    ): SessionResponse {
        val response =
            httpClient.post("$baseUrl/api/sessions/$sessionId/complete") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(request)
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw SessionsException(readError(response))
        }
        return response.body()
    }

    private suspend fun authorizedGet(url: String): HttpResponse {
        val response =
            httpClient.get(url) {
                header(HttpHeaders.Authorization, bearerOrThrow())
            }
        clearTokenIfUnauthorized(response)
        return response
    }

    private fun bearerOrThrow(): String {
        val token = tokens.getToken() ?: throw SessionsException("Not signed in")
        return "Bearer $token"
    }

    private fun clearTokenIfUnauthorized(response: HttpResponse) {
        if (response.status.value == 401) {
            tokens.clearToken()
        }
    }

    private val errorJson = Json { ignoreUnknownKeys = true }

    private suspend fun readError(response: HttpResponse): String {
        val text =
            runCatching { response.bodyAsText() }.getOrNull()
                ?: return "Sessions request failed (${response.status})"
        val parsed =
            runCatching {
                errorJson.decodeFromString(ErrorMessage.serializer(), text)
            }.getOrNull()
        return parsed?.message ?: "Sessions request failed (${response.status})"
    }

    companion object {
        fun create(
            baseUrl: String = apiBaseUrl(),
            tokens: TokenStore = platformTokenStore(),
        ): SessionsClient = SessionsClient(baseUrl, createHttpClient(), tokens)
    }
}
