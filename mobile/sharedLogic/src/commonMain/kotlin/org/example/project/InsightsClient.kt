package org.example.project

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.http.isSuccess
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class InsightTip(
    val id: String,
    val message: String,
)

@Serializable
data class InsightsResponse(
    val completedSessionCount: Int,
    val ready: Boolean,
    val ateEnoughYes: Int,
    val ateEnoughNo: Int,
    val likedLike: Int,
    val likedSoSo: Int,
    val likedNo: Int,
    val likedSkipped: Int,
    val topLikedTextures: List<String> = emptyList(),
    val familiaritySafe: Int,
    val familiarityFamiliarButNew: Int,
    val familiarityTrulyNew: Int,
    val snackCount: Int,
    val hasParentNotes: Boolean,
    val tips: List<InsightTip> = emptyList(),
)

@Serializable
data class DismissInsightTipResponse(
    val status: String,
)

class InsightsException(message: String) : Exception(message)

class InsightsClient(
    private val baseUrl: String,
    private val httpClient: HttpClient = createHttpClient(),
    private val tokens: TokenStore = platformTokenStore(),
) {
    suspend fun get(): InsightsResponse {
        val response = authorizedGet("$baseUrl/api/insights")
        if (!response.status.isSuccess()) {
            throw InsightsException(readError(response))
        }
        return response.body()
    }

    suspend fun dismissTip(tipId: String): DismissInsightTipResponse {
        val response =
            httpClient.post("$baseUrl/api/insights/tips/$tipId/dismiss") {
                header(HttpHeaders.Authorization, bearerOrThrow())
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw InsightsException(readError(response))
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
        val token = tokens.getToken() ?: throw InsightsException("Not signed in")
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
                ?: return "Insights request failed (${response.status})"
        val parsed =
            runCatching {
                errorJson.decodeFromString(ErrorMessage.serializer(), text)
            }.getOrNull()
        return parsed?.message ?: "Insights request failed (${response.status})"
    }

    companion object {
        fun create(
            baseUrl: String = apiBaseUrl(),
            tokens: TokenStore = platformTokenStore(),
        ): InsightsClient = InsightsClient(baseUrl, createHttpClient(), tokens)
    }
}
